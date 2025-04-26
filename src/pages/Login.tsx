import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, LogIn, Mail, User, UserPlus } from "lucide-react";

// Definindo métodos que estamos utilizando do AuthContext
interface AuthContextMethods {
  signIn?: (email: string, password: string) => Promise<any>;
  signUp?: (email: string, password: string, displayName: string) => Promise<any>;
  user?: any;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Utilizando useAuth com as propriedades corretas do seu contexto
  const auth = useAuth() as AuthContextMethods;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!email || !password) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Usando signIn em vez de login
        await auth.signIn?.(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } catch (error: any) {
        toast.error("Erro ao fazer login: " + (error.message || "Tente novamente"));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!nome || !email || !password || !confirmPassword) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }
      
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Usando signUp em vez de register
        await auth.signUp?.(email, password, nome);
        toast.success("Cadastro realizado com sucesso!");
        navigate("/dashboard");
      } catch (error: any) {
        toast.error("Erro ao cadastrar: " + (error.message || "Tente novamente"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setNome("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C] p-4">
      <Card className="w-full max-w-md border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center space-y-2 mb-4">
              <img 
                src="/lovable-uploads/8c700a7c-8b6b-44bd-ba7c-d2a31d435fb1.png" 
                alt="Frico Logo" 
                className="h-20 mb-2 rounded-lg shadow-md"
              />
            <CardTitle className="text-2xl font-bold text-gray-100">
              {isLogin ? "Bem-vindo ao Sistema Fricó Master" : "Criar Conta Fricó"}
            </CardTitle>
            <p className="text-sm text-gray-400">
              {isLogin ? "Faça login para continuar" : "Preencha seus dados para se cadastrar"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-gray-200">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="nome" 
                    type="text" 
                    placeholder="Seu nome completo" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="******" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="******" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isLoading}
            >
              {isLogin ? (
                <LogIn className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isLoading ? (isLogin ? "Entrando..." : "Cadastrando...") : (isLogin ? "Entrar" : "Cadastrar")}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              {isLogin ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Fazer login
                  </button>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;