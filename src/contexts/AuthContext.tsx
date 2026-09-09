import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Handles both cases: a Supabase project with "Confirm email" off (signUp()
// returns an active session immediately, so this runs right after signup)
// and one with it on (no session until the user confirms and logs in, so
// this only gets a chance to run on that later signIn). Either way, the
// first person to reach an authenticated session while admin_users is still
// empty becomes the admin — mirrors the "Bootstrap first admin" RLS policy.
async function checkIsAdminOrBootstrap(user: User): Promise<boolean> {
  const { data: existing } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return true;

  const { data: isEmpty } = await supabase.rpc("admin_users_is_empty");
  if (!isEmpty) return false;

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const { error } = await supabase.from("admin_users").insert({ user_id: user.id, full_name: fullName });
  return !error;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // loading only clears once the admin check has resolved too, otherwise
    // guarded routes briefly see isAdmin=false and bounce to the login screen.
    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsAdmin(nextSession?.user ? await checkIsAdminOrBootstrap(nextSession.user) : false);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // deferred: calling supabase from inside this callback can deadlock
      setTimeout(() => applySession(nextSession), 0);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => applySession(currentSession));

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { error: error.message, needsEmailConfirmation: false };

    // With "Confirm email" enabled in Supabase Auth, signUp() creates the
    // user but no session — onAuthStateChange won't fire, so there's no
    // active session yet to bootstrap as admin. That happens on their first
    // signIn() after confirming, via checkIsAdminOrBootstrap() above.
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null, needsEmailConfirmation: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
