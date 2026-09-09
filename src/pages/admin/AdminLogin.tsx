import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import porksLogo from "@/assets/porks-logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [allowBootstrap, setAllowBootstrap] = useState(false);

  useEffect(() => {
    if (user && isAdmin) navigate("/admin", { replace: true });
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    supabase.rpc("admin_users_is_empty").then(({ data }) => setAllowBootstrap(data === true));
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível entrar. Confira email e senha.");
      return;
    }
    navigate("/admin");
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (needsEmailConfirmation) {
      toast.success("Confirme seu email para ativar a conta e depois faça login na aba \"Entrar\".", {
        duration: 8000,
      });
      return;
    }
    toast.success("Administrador criado!");
    navigate("/admin");
  };

  return (
    <>
      <Helmet>
        <title>Admin - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={porksLogo} alt="Porks" className="h-20 w-20 mx-auto mb-3" />
            <h1 className="text-3xl">Painel Porks</h1>
            <p className="text-muted-foreground text-sm">Acesso restrito à equipe</p>
          </div>

          <Tabs defaultValue="login" className="bg-card border border-border rounded-lg p-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup" disabled={!allowBootstrap}>
                Criar admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full font-display tracking-wide" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nenhum administrador cadastrado ainda. Crie o primeiro acesso.
                </p>
                <div>
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full font-display tracking-wide" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar administrador
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
