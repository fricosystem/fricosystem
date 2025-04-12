import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
      <div className="flex items-center justify-center pt-4">
        <Card className="w-full max-w-md border-none bg-transparent shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardContent className="space-y-4 pt-0">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">Nome</Label>
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
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
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
                  <Label htmlFor="password" className="text-white font-medium">Senha</Label>
                  {!isRegistering && (
                    <a href="#" className="text-sm text-white hover:text-primary hover:underline">
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
            
            <CardFooter className="flex flex-col space-y-4 pt-0">
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
                  <div className="text-white">
                    Já possui uma conta?{" "}
                    <button
                      type="button"
                      className="text-white font-medium hover:underline"
                      onClick={() => setIsRegistering(false)}
                      disabled={isLoading}
                    >
                      Entrar
                    </button>
                  </div>
                ) : (
                  <div className="text-white">
                    Não possui uma conta?{" "}
                    <button
                      type="button"
                      className="text-white font-medium hover:underline"
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
