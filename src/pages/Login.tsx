
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isRegistering) {
        // Register logic
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: name,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        // Create profile
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              nome: name,
              cargo: "Usuário",
              perfil: "Regular"
            });
          
          if (profileError) throw profileError;
        }
        
        toast({
          title: "Conta criada com sucesso",
          description: "Você foi registrado e logado no sistema.",
        });
        
        navigate("/dashboard");
      } else {
        // Login logic
        const { error } = await signIn(email, password);
        
        if (error) throw error;
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      toast({
        title: "Erro de autenticação",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Fricó Alimentos
            </CardTitle>
            <CardDescription className="text-center">
              {isRegistering ? "Crie sua conta" : "Entre com suas credenciais"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {!isRegistering && (
                    <a href="#" className="text-sm text-primary hover:underline">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRegistering ? "Criando conta..." : "Entrando..."}
                  </>
                ) : (
                  <>{isRegistering ? "Registrar" : "Entrar"}</>
                )}
              </Button>
              
              <div className="text-center text-sm">
                {isRegistering ? (
                  <div>
                    Já possui uma conta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setIsRegistering(false)}
                      disabled={isLoading}
                    >
                      Entrar
                    </button>
                  </div>
                ) : (
                  <div>
                    Não possui uma conta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setIsRegistering(true)}
                      disabled={isLoading}
                    >
                      Registrar
                    </button>
                  </div>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default Login;
