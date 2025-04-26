import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Search, User, ChevronDown, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  addDoc, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email?: string;
}

const Carrinho = () => {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // Estados para o dropdown de solicitantes
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitanteSelecionado, setSolicitanteSelecionado] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tentouEnviarSemSolicitante, setTentouEnviarSemSolicitante] = useState(false);

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

  // Carregar lista de usuários do Firestore
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        setIsLoadingUsuarios(true);
        const usuariosRef = collection(db, "usuarios");
        const usuariosSnapshot = await getDocs(usuariosRef);
        
        const listaUsuarios: Usuario[] = usuariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Usuario, 'id'>
        }));
        
        // Ordenar usuários por nome
        listaUsuarios.sort((a, b) => a.nome.localeCompare(b.nome));
        
        setUsuarios(listaUsuarios);
        
        // Se o usuário atual estiver na lista, selecioná-lo automaticamente
        if (user && user.email) {
          const usuarioAtual = listaUsuarios.find(u => u.email === user.email);
          if (usuarioAtual) {
            setSolicitanteSelecionado(usuarioAtual);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de solicitantes",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsuarios(false);
      }
    };

    carregarUsuarios();
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

  // Função para filtrar usuários com base no termo de pesquisa
  const usuariosFiltrados = usuarios.filter(usuario => 
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para selecionar um solicitante
  const handleSelecionarSolicitante = (usuario: Usuario) => {
    setSolicitanteSelecionado(usuario);
    setIsDropdownOpen(false);
    // Resetar alerta de erro quando um solicitante é selecionado
    if (tentouEnviarSemSolicitante) {
      setTentouEnviarSemSolicitante(false);
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

  // Função para verificar os requisitos antes de enviar o pedido
  const handlePreFinalizarPedido = () => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Seu carrinho está vazio.",
        variant: "destructive",
      });
      return;
    }

    if (!solicitanteSelecionado) {
      // Marcar que tentou enviar sem selecionar solicitante para exibir o alerta
      setTentouEnviarSemSolicitante(true);
      
      // Focar no dropdown de solicitante abrindo-o
      setIsDropdownOpen(true);
      
      toast({
        title: "Solicitante obrigatório",
        description: "É necessário selecionar um solicitante para finalizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    // Se passar nas validações, prosseguir com o envio
    handleFinalizarPedido();
  };

  // Função para finalizar o pedido enviando para a coleção "requisicoes"
  const handleFinalizarPedido = async () => {
    // Esta função só será chamada se houver um solicitante selecionado
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
        // Adicionar informações do solicitante (garantido não ser null neste ponto)
        solicitante: {
          id: solicitanteSelecionado!.id,
          nome: solicitanteSelecionado!.nome,
          cargo: solicitanteSelecionado!.cargo,
          email: solicitanteSelecionado!.email || ""
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
            {/* Seletor de Solicitante */}
            <div className={`bg-card rounded-lg shadow p-4 ${tentouEnviarSemSolicitante && !solicitanteSelecionado ? 'border-2 border-destructive' : ''}`}>
              <h2 className="text-lg font-medium mb-3 flex items-center">
                Solicitante
                <span className="text-destructive ml-1">*</span>
              </h2>
              
              {tentouEnviarSemSolicitante && !solicitanteSelecionado && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    É necessário selecionar um solicitante para finalizar o pedido.
                  </AlertDescription>
                </Alert>
              )}
              
              <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant={tentouEnviarSemSolicitante && !solicitanteSelecionado ? "destructive" : "outline"}
                    className="w-full justify-between"
                    disabled={isLoadingUsuarios}
                  >
                    {isLoadingUsuarios ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Carregando solicitantes...</span>
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </>
                    ) : solicitanteSelecionado ? (
                      <>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium">{solicitanteSelecionado.nome}</p>
                            <p className="text-xs text-muted-foreground">{solicitanteSelecionado.cargo}</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </>
                    ) : (
                      <>
                        <span>Selecione um solicitante</span>
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar solicitante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {usuariosFiltrados.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Nenhum solicitante encontrado
                      </div>
                    ) : (
                      usuariosFiltrados.map((usuario) => (
                        <div
                          key={usuario.id}
                          className={`flex flex-col p-3 cursor-pointer hover:bg-muted/50 ${
                            solicitanteSelecionado?.id === usuario.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelecionarSolicitante(usuario)}
                        >
                          <span className="font-medium">{usuario.nome}</span>
                          <span className="text-xs text-muted-foreground">{usuario.cargo}</span>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-2">
                * Campo obrigatório
              </p>
            </div>
  
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
                onClick={handlePreFinalizarPedido}
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