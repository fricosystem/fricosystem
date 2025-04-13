
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="border-none bg-white/70 dark:bg-black/60 backdrop-blur-md shadow-xl w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isRegistering ? "Criar uma conta" : "Entrar no sistema"}
          </CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white/80 dark:bg-gray-800/80"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/80 dark:bg-gray-800/80"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="font-medium">Senha</Label>
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
                className="bg-white/80 dark:bg-gray-800/80"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              type="submit" 
              disabled={isLoading}
            >
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
                    className="text-primary font-medium hover:underline"
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
                    className="text-primary font-medium hover:underline"
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
    </AuthLayout>
  );
};

export default Login;
