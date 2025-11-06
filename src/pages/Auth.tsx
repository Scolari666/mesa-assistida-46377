import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  restaurantName: z.string().min(2, "Nome do restaurante deve ter pelo menos 2 caracteres").max(100),
  ownerName: z.string().min(2, "Nome do proprietário deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const signInSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const Auth = () => {
  const { user, loading, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Signup form state
  const [signUpData, setSignUpData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    password: "",
  });

  // Signin form state
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setIsLoading(true);

    try {
      const validated = signUpSchema.parse(signUpData);
      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.restaurantName,
        validated.ownerName
      );

      if (error) {
        if (error.message.includes("already registered")) {
          setError("Este email já está cadastrado. Faça login ou use outro email.");
        } else {
          setError(error.message || "Erro ao criar conta. Tente novamente.");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setIsLoading(true);

    try {
      const validated = signInSchema.parse(signInData);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos. Tente novamente.");
        } else {
          setError(error.message || "Erro ao fazer login. Tente novamente.");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Entrar - MenuFacil Pro</title>
        <meta name="description" content="Faça login ou crie sua conta no MenuFacil Pro" />
      </Helmet>

      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <Card className="p-8 shadow-elegant bg-gradient-card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">M</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">MenuFacil Pro</h1>
              <p className="text-muted-foreground">Transforme seu restaurante</p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-destructive">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Nome do Restaurante *</Label>
                    <Input
                      id="restaurant-name"
                      type="text"
                      placeholder="Meu Restaurante"
                      value={signUpData.restaurantName}
                      onChange={(e) => setSignUpData({ ...signUpData, restaurantName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.restaurantName && (
                      <p className="text-sm text-destructive">{validationErrors.restaurantName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Nome do Proprietário *</Label>
                    <Input
                      id="owner-name"
                      type="text"
                      placeholder="João Silva"
                      value={signUpData.ownerName}
                      onChange={(e) => setSignUpData({ ...signUpData, ownerName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.ownerName && (
                      <p className="text-sm text-destructive">{validationErrors.ownerName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-destructive">{validationErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      ✨ <strong>30 dias grátis</strong> para testar todas as funcionalidades
                    </p>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta Grátis"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Auth;
