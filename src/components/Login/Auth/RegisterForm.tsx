import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CENTROS_DE_CUSTO } from "@/firebase/constants";

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [centroDeCusto, setCentroDeCusto] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica dos campos
    if (password !== confirmPassword) {
      toast({
        title: "Erro na senha",
        description: "As senhas informadas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!centroDeCusto) {
      toast({
        title: "Dados incompletos",
        description: "Selecione o centro de custo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Criação do usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const user = userCredential.user;

      // 2. Preparação dos dados para o Firestore
      const userData = {
        uid: user.uid,
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        centro_de_custo: centroDeCusto,
        ativo: "não",
        tema: "dark",
        data_criacao: serverTimestamp(),
        data_atualizacao: serverTimestamp(),
        ultimo_login: null,
        imagem_perfil: "",
        senha: confirmPassword,
        permissoes: [
          "dashboard"
        ] // Páginas que o usuário pode acessar inicialmente
      };

      // 3. Verificação e criação da coleção se necessário
      try {
        // Tenta acessar a coleção para verificar existência
        const usuariosRef = collection(db, "usuarios");
        await getDocs(usuariosRef);
      } catch (error) {
        console.warn("Coleção 'usuarios' não existe. Criando...");
        // Cria um documento temporário para inicializar a coleção
        const tempDocRef = doc(collection(db, "usuarios"), "temp_doc");
        await setDoc(tempDocRef, { _init: true });
        await deleteDoc(tempDocRef); // Remove o documento temporário
      }

      // 4. Persistência dos dados do usuário
      await setDoc(doc(db, "usuarios", user.uid), userData);

      // 5. Feedback de sucesso
      toast({
        title: "Cadastro realizado!",
        description: `Bem-vindo(a) ${name.trim()}! Sua conta foi criada com sucesso.`,
      });

      // 6. Callback de sucesso (redirecionamento, etc)
      onSuccess();

    } catch (error: any) {
      console.error("Erro no cadastro:", error);

      // Mapeamento de erros comuns
      const errorMap: Record<string, string> = {
        'auth/email-already-in-use': 'Este email já está cadastrado',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Operação não permitida',
        'auth/weak-password': 'Senha muito fraca',
        'permission-denied': 'Sem permissão para acessar o banco de dados'
      };

      toast({
        title: "Erro no cadastro",
        description: errorMap[error.code] || "Ocorreu um erro inesperado",
        variant: "destructive"
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