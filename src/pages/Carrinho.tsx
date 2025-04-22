import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface ProdutoCarrinho {
  id: string;
  nome: string;
  imagem?: string;
  quantidade: number;
  codigo_material?: string;
  codigo_estoque?: string;
  unidade?: string;
  deposito?: string;
  quantidade_minima?: number;
  detalhes?: string;
  unidade_de_medida?: string;
  valor_unitario: number;
  prateleira?: string;
  email?: string;
  timestamp?: number;
}

const Carrinho = () => {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Carregar itens do carrinho do Firebase
  useEffect(() => {
    const carregarCarrinho = async () => {
      if (!user || !user.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Consultar itens no carrinho do usuário atual
        const carrinhoRef = collection(db, "carrinho");
        const q = query(carrinhoRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        const itensCarrinho: ProdutoCarrinho[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProdutoCarrinho[];
        
        // Ordenar por timestamp, do mais recente para o mais antigo
        itensCarrinho.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setCarrinho(itensCarrinho);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os itens do carrinho",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarCarrinho();
  }, [user]);

  // Função para remover um produto do carrinho
  const handleRemover = async (id: string) => {
    try {
      // Remover do Firebase
      await deleteDoc(doc(db, "carrinho", id));
      
      // Atualizar estado local
      setCarrinho((prevCarrinho) => prevCarrinho.filter((item) => item.id !== id));
      
      toast({
        title: "Item removido",
        description: "O item foi removido do carrinho",
      });
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item do carrinho",
        variant: "destructive",
      });
    }
  };

  // Função para atualizar a quantidade de um produto
  const handleQuantidadeChange = async (id: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    try {
      // Atualizar no Firebase
      const docRef = doc(db, "carrinho", id);
      await updateDoc(docRef, {
        quantidade: novaQuantidade,
        timestamp: new Date().getTime()
      });
      
      // Atualizar estado local
      setCarrinho((prevCarrinho) =>
        prevCarrinho.map((produto) =>
          produto.id === id ? { ...produto, quantidade: novaQuantidade } : produto
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    }
  };

  // Função para aumentar a quantidade
  const handleIncrease = (id: string) => {
    const produto = carrinho.find(item => item.id === id);
    if (produto) {
      handleQuantidadeChange(id, produto.quantidade + 1);
    }
  };

  // Função para diminuir a quantidade
  const handleDecrease = (id: string) => {
    const produto = carrinho.find(item => item.id === id);
    if (produto && produto.quantidade > 1) {
      handleQuantidadeChange(id, produto.quantidade - 1);
    }
  };

  // Função para gerar o próximo ID sequencial
  const getNextRequestId = async () => {
    try {
      // Buscar todas as requisições ordenadas pelo ID de forma decrescente
      const requisicaoRef = collection(db, "requisicoes");
      const q = query(requisicaoRef, orderBy("requisicao_id", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      // Se não houver requisições, começar com REQ-01
      if (querySnapshot.empty) {
        return "REQ-01";
      }
      
      // Obter o último ID
      const lastReq = querySnapshot.docs[0].data();
      const lastId = lastReq.requisicao_id || "REQ-00";
      
      // Extrair o número e incrementar
      const match = lastId.match(/REQ-(\d+)/);
      if (!match) return "REQ-01";
      
      const nextNum = parseInt(match[1], 10) + 1;
      // Formatar com zeros à esquerda (01, 02, etc.)
      return `REQ-${nextNum.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error("Erro ao gerar ID sequencial:", error);
      // Em caso de erro, gerar um ID baseado em timestamp
      return `REQ-${new Date().getTime().toString().substr(-6)}`;
    }
  };

  // Função para finalizar o pedido enviando para a coleção "requisicoes"
  const handleFinalizarPedido = async () => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Seu carrinho está vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Obter nome do usuário logado
      const userName = user?.user_metadata?.nome || user?.email || "Usuário não identificado";
      
      // Gerar o próximo ID sequencial
      const nextId = await getNextRequestId();
      
      // Criar um único documento de requisição com todos os itens
      const requisicaoData = {
        requisicao_id: nextId, // Campo com ID sequencial
        status: "pendente", // Status padrão
        itens: carrinho.map(item => ({
          nome: item.nome,
          codigo_material: item.codigo_material || "",
          codigo_estoque: item.codigo_estoque || "",
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          unidade: item.unidade || item.unidade_de_medida || "",
          deposito: item.deposito || "",
          prateleira: item.prateleira || "",
          detalhes: item.detalhes || "",
          imagem: item.imagem || ""
        })),
        usuario: {
          email: user?.email,
          nome: userName
        },
        data_criacao: serverTimestamp(),
        valor_total: valorTotal
      };
      
      // Adicionar à coleção de requisições
      await addDoc(collection(db, "requisicoes"), requisicaoData);
      
      // Remover todos os itens do carrinho após a criação da requisição
      for (const item of carrinho) {
        await deleteDoc(doc(db, "carrinho", item.id));
      }

      toast({
        title: "Sucesso!",
        description: `Requisição ${nextId} enviada com sucesso!`,
      });
      
      // Limpar o carrinho após o envio
      setCarrinho([]);
      
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a requisição. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular o valor total do carrinho
  const valorTotal = carrinho.reduce(
    (total, produto) => total + produto.valor_unitario * produto.quantidade,
    0
  );

  // Formatar valor para o padrão brasileiro (R$ 0.000,00)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AppLayout title="Carrinho de Compras">
      {/* Removida a limitação de largura máxima e adicionado padding horizontal */}
      <div className="w-full h-full px-4 md:px-6">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="text-primary" />
          <h1 className="text-2xl font-bold">Carrinho de Compras</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-lg text-muted-foreground">Carregando seu carrinho...</p>
          </div>
        ) : carrinho.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Seu carrinho está vazio</p>
            <Button className="mt-4" onClick={() => navigate("/produtos")}>
              Ver produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow">
              {/* Cabeçalho da tabela com responsividade melhorada */}
              <div className="grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr] md:grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 font-medium border-b">
                <div>Imagem</div>
                <div>Produto</div>
                <div className="text-center">Quantidade</div>
                <div className="text-right">Preço Unit.</div>
                <div className="text-right">Subtotal</div>
              </div>

              {/* Itens do carrinho com responsividade melhorada */}
              {carrinho.map((produto) => (
                <div key={produto.id} className="grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr] md:grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 items-center border-b">
                  <div>
                    <img
                      src={produto.imagem || "/placeholder.svg"}
                      alt={produto.nome}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{produto.nome}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Código: {produto.codigo_material || "N/A"} | Depósito: {produto.deposito || "N/A"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                      onClick={() => handleRemover(produto.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center border rounded-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 rounded-none"
                        onClick={() => handleDecrease(produto.id)}
                        disabled={produto.quantidade <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        min="1"
                        value={produto.quantidade}
                        onChange={(e) => handleQuantidadeChange(produto.id, parseInt(e.target.value, 10) || 1)}
                        className="w-10 text-center border-none focus:ring-0 bg-transparent"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 rounded-none"
                        onClick={() => handleIncrease(produto.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    {formatCurrency(produto.valor_unitario)}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(produto.valor_unitario * produto.quantidade)}
                  </div>
                </div>
              ))}

              {/* Rodapé do carrinho com total */}
              <div className="p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button variant="outline" onClick={() => navigate("/produtos")}>
                Continuar Comprando
              </Button>
              <Button 
                onClick={handleFinalizarPedido}
                disabled={isSubmitting || carrinho.length === 0}
                className="sm:ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : "Finalizar Pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrinho;