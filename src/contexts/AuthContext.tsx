import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
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
      setIsAdmin(nextSession?.user ? await checkIsAdmin(nextSession.user.id) : false);
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

    if (error) return { error: error.message };

    if (data.user) {
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({ user_id: data.user.id, full_name: fullName });

      if (adminError) {
        return {
          error:
            "Conta criada, mas já existe um administrador cadastrado. Peça para um admin existente liberar seu acesso.",
        };
      }
      setIsAdmin(true);
    }

    return { error: null };
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
