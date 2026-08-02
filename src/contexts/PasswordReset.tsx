import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { motion } from "framer-motion";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar email de redefinição:", error);
      
      let errorMessage = "Não foi possível enviar o email de redefinição.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "Não encontramos uma conta com este email.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O email fornecido é inválido.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
                <Mail className="h-10 w-10" />
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold">
                {resetSent ? "Email enviado" : "Recuperar senha"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {resetSent 
                  ? "Verifique seu email para continuar o processo" 
                  : "Informe seu email para recuperar sua senha"}
              </p>
            </motion.div>
          </CardHeader>
          
          {!resetSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <CardContent className="space-y-4">
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
                        Enviando...
                      </>
                    ) : (
                      <>Enviar email de recuperação</>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div variants={itemVariants} className="text-center text-sm">
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline transition-colors inline-flex items-center"
                    onClick={() => navigate("/login")}
                    disabled={isLoading}
                  >
                    <ArrowLeft size={14} className="mr-1" />
                    Voltar para o login
                  </button>
                </motion.div>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-6 pt-4 pb-6">
              <motion.div variants={itemVariants} className="text-center">
                <p className="mb-6">
                  Se uma conta existir com o email <strong>{email}</strong>, você receberá um email com instruções para redefinir sua senha.
                </p>
                <p className="text-sm text-muted-foreground">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                </p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex flex-col space-y-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-all"
                  onClick={() => setResetSent(false)}
                >
                  Tentar novamente
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Voltar para o login
                </Button>
              </motion.div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AuthLayout>
  );
};

export default PasswordReset;