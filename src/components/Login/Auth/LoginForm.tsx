import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update último_login in Firestore
      const userDoc = doc(db, "usuarios", user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        
        if (userData.ativo !== "sim") {
          await auth.signOut();
          toast({
            title: "Conta desativada",
            description: "Sua conta está desativada. Entre em contato com o administrador.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        await updateDoc(userDoc, {
          ultimo_login: serverTimestamp()
        });
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo de volta, ${userData.nome}!`,
        });
        
        onSuccess();
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar seu cadastro no sistema.",
          variant: "destructive",
        });
        await auth.signOut();
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
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
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
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
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
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
