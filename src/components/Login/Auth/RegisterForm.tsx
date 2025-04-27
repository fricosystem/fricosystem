import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARGOS, CENTROS_DE_CUSTO } from "@/firebase/constants";

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargo, setCargo] = useState("");
  const [centroDeCusto, setCentroDeCusto] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    let cpfValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    cpfValue = cpfValue.substring(0, 11);
    
    // Adiciona pontos e traço conforme digitação
    if (cpfValue.length > 9) {
      cpfValue = cpfValue.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (cpfValue.length > 6) {
      cpfValue = cpfValue.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (cpfValue.length > 3) {
      cpfValue = cpfValue.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    
    return cpfValue;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        description: "Verifique se as senhas informadas são iguais.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    if (!cargo) {
      toast({
        title: "Cargo não selecionado",
        description: "Por favor, selecione um cargo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!centroDeCusto) {
      toast({
        title: "Centro de custo não selecionado",
        description: "Por favor, selecione um centro de custo.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Salvando informações adicionais no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: name,
        email: email,
        cpf: cpf.replace(/\D/g, ''), // Armazenar apenas números
        cargo: cargo,
        centro_de_custo: centroDeCusto,
        ativo: "sim",
        tema: "dark",
        data_registro: serverTimestamp(),
        ultimo_login: serverTimestamp(),
        imagem_perfil: ""
      });
      
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo à Fricó Alimentos!",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocorreu um erro ao realizar o cadastro. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está sendo utilizado.";
      }
      
      toast({
        title: "Erro no cadastro",
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
        <Label htmlFor="name">Nome completo</Label>
        <Input 
          id="name"
          placeholder="Seu nome completo" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          placeholder="Digite seu melhor email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input 
          id="cpf"
          placeholder="000.000.000-00" 
          value={cpf} 
          onChange={handleCPFChange}
          required
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Select onValueChange={setCargo} required>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Selecione um cargo" />
            </SelectTrigger>
            <SelectContent>
              {CARGOS.map((cargo) => (
                <SelectItem key={cargo} value={cargo}>
                  {cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="centroDeCusto">Centro de Custo</Label>
          <Select onValueChange={setCentroDeCusto} required>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {CENTROS_DE_CUSTO.map((centro) => (
                <SelectItem key={centro} value={centro}>
                  {centro}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input 
          id="confirmPassword"
          type="password" 
          placeholder="••••••••" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-frico-600 hover:bg-frico-700"
        disabled={loading}
      >
        {loading ? "Registrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
