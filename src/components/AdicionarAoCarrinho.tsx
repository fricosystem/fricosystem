import { useState } from "react";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Produto } from "./ProdutoCard";

interface AdicionarAoCarrinhoProps {
  produto: Produto;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const AdicionarAoCarrinho = ({ 
  produto, 
  onSuccess, 
  variant = "outline", 
  size = "sm",
  className = "flex-1 text-primary hover:bg-primary hover:text-primary-foreground" 
}: AdicionarAoCarrinhoProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  // Normalizar os valores do produto para compatibilidade
  const codigo = produto.codigo || produto.codigo_material || "";
  const valorUnitario = produto.valorUnitario !== undefined ? 
    produto.valorUnitario : (produto.valor_unitario || 0);

  const adicionarAoCarrinho = async () => {
    if (!user || !user.email) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar itens ao carrinho",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const carrinhoCollection = collection(db, "carrinho");
      const userEmail = user.email;
      
      // Verificar se o produto já existe no carrinho deste usuário
      const q = query(
        carrinhoCollection,
        where("email", "==", userEmail),
        where("codigo_material", "==", codigo)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Se o produto já existe no carrinho, incrementa a quantidade
      if (!querySnapshot.empty) {
        const docRef = doc(db, "carrinho", querySnapshot.docs[0].id);
        const itemAtual = querySnapshot.docs[0].data();
        
        await updateDoc(docRef, {
          quantidade: (itemAtual.quantidade || 0) + 1,
          timestamp: new Date().getTime()
        });
        
        toast({
          title: "Carrinho atualizado",
          description: "Quantidade do produto incrementada no carrinho",
        });
      } else {
        // Se não existe, adiciona um novo item ao carrinho
        const itemCarrinho = {
          nome: produto.nome,
          codigo_material: codigo,
          quantidade: 1,
          valor_unitario: valorUnitario,
          email: userEmail,
          timestamp: new Date().getTime(),
          // Opcional: adicionar mais campos do produto se necessário
          imagem: produto.imagem || "",
          unidade: produto.unidade || produto.unidade || "",
          unidade_de_medida: produto.unidade_de_medida || produto.unidade_de_medida || "",
          deposito: produto.deposito || "",
          prateleira: produto.prateleira || "",
          quantidade_minima: produto.quantidadeMinima || ""
        };
        
        await addDoc(carrinhoCollection, itemCarrinho);
        
        toast({
          title: "Produto adicionado",
          description: "Item adicionado ao carrinho com sucesso",
        });
      }
      
      // Executa callback se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);
      
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho: " + (error.message || "erro desconhecido"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={adicionarAoCarrinho}
      disabled={isAdding}
      aria-label="Adicionar ao Carrinho"
    >
      <ShoppingCart size={14} />
    </Button>
  );
};

// Adicionando a exportação padrão que estava faltando
export default AdicionarAoCarrinho;