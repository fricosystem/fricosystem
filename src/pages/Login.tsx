
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, PackageOpen, Mail, Lock, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };
  
  return (
    <AuthLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full"
      >
        <Card className="border-none bg-white/70 dark:bg-black/60 backdrop-blur-md shadow-xl w-full">
          <CardHeader className="space-y-1 text-center">
            <motion.div variants={itemVariants} className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <PackageOpen className="h-10 w-10" />
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold">
                {isRegistering ? "Criar uma conta" : "Entrar no sistema"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {isRegistering 
                  ? "Complete os campos abaixo para criar seu acesso" 
                  : "Entre com suas credenciais para acessar o sistema"}
              </p>
            </motion.div>
          </CardHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardContent className="space-y-4">
              {isRegistering && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className="font-medium">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 bg-white/80 dark:bg-gray-800/80"
                    />
                  </div>
                </motion.div>
              )}
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 bg-white/80 dark:bg-gray-800/80"
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password" className="font-medium">Senha</Label>
                  {!isRegistering && (
                    <a href="#" className="text-sm text-primary hover:underline">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 bg-white/80 dark:bg-gray-800/80"
                  />
                </div>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <motion.div variants={itemVariants} className="w-full">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 font-medium text-base"
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
              </motion.div>
              
              <motion.div variants={itemVariants} className="text-center text-sm">
                {isRegistering ? (
                  <div>
                    Já possui uma conta?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline transition-colors"
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
                      className="text-primary font-medium hover:underline transition-colors"
                      onClick={() => setIsRegistering(true)}
                      disabled={isLoading}
                    >
                      Registrar
                    </button>
                  </div>
                )}
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;
