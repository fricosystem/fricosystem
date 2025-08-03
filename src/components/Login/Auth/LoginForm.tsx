import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { user, isActive } = await signIn(email, password);
      
      if (!isActive) {
        setTimeout(() => navigate('/bem-vindo'), 0);
        toast({
          title: "Conta desativada",
          description: "Procure o RH para ativar sua conta.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo de volta!`,
      });
      
      navigate('/dashboard');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Procure o RH para verificar sua conta.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          placeholder="Digite seu email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#1A1F2C]/[0.02] border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input 
          id="password"
          type="password" 
          placeholder="••••••••" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-[#1A1F2C]/[0.02] border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-frico-600 hover:bg-frico-700"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}