import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Search, User, ChevronDown, AlertTriangle, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRequisicoesStatus } from '@/hooks/useRequisicoesStatus';
interface Produto {
  id: string;
  nome: string;
  codigo_material: string;
  quantidade: number;
  quantidade_minima?: number;
  valor_unitario: number;
  deposito?: string;
}
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
  produtoEstoque?: Produto; // Referência ao produto no estoque
  centroDeCusto?: string; // Novo campo para centro de custo
}
interface Usuario {
  id: string;
  nome: string;
  perfil: string;
  email?: string;
}
interface CentroDeCusto {
  id: string;
  nome: string;
  unidade: string;
}
const Carrinho = () => {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    user,
    userData
  } = useAuth();
  const [produtos, setProdutos] = useState<Record<string, Produto>>({});
  const {
    requisicoesPendentes,
    totalPendentes,
    isLoading: loadingRequisicoes
  } = useRequisicoesStatus();

  // Estados para o dropdown de solicitantes
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitanteSelecionado, setSolicitanteSelecionado] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tentouEnviarSemSolicitante, setTentouEnviarSemSolicitante] = useState(false);

  // Estados para centros de custo
  const [centrosDeCusto, setCentrosDeCusto] = useState<CentroDeCusto[]>([]);
  const [centroDeCustoTodos, setCentroDeCustoTodos] = useState<string>("");
  const [isLoadingCentrosDeCusto, setIsLoadingCentrosDeCusto] = useState(false);

  // Carregar todos os produtos para referência
  const carregarProdutos = async () => {
    try {
      const produtosRef = collection(db, "produtos");
      const snapshot = await getDocs(produtosRef);
      const produtosMap: Record<string, Produto> = {};
      snapshot.docs.forEach(doc => {
        const produto = doc.data() as Produto;
        if (produto.codigo_material) {
          produtosMap[produto.codigo_material] = {
            id: doc.id,
            ...produto
          };
        }
      });
      setProdutos(produtosMap);
      return produtosMap;
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
      return {};
    }
  };

  // Carregar centros de custo do Firestore
  const carregarCentrosDeCusto = async () => {
    try {
      setIsLoadingCentrosDeCusto(true);
      const centrosRef = collection(db, "centro_de_custo");
      const snapshot = await getDocs(centrosRef);
      const centros: CentroDeCusto[] = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || "",
        unidade: doc.data().unidade || ""
      }));

      // Ordenar por nome
      centros.sort((a, b) => a.nome.localeCompare(b.nome));
      setCentrosDeCusto(centros);
    } catch (error) {
      console.error("Erro ao carregar centros de custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os centros de custo",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCentrosDeCusto(false);
    }
  };
  useEffect(() => {
    const carregarCarrinho = async () => {
      if (!user || !user.email) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);

        // Primeiro carregamos todos os produtos para referência
        const produtosMap = await carregarProdutos();

        // Depois carregamos o carrinho sem filtro de usuário
        const carrinhoRef = collection(db, "carrinho");
        const q = query(carrinhoRef); // Remova o where que filtra por email

        const querySnapshot = await getDocs(q);
        const itensCarrinho: ProdutoCarrinho[] = querySnapshot.docs.map(doc => {
          const item = doc.data() as ProdutoCarrinho;
          item.id = doc.id;

          // Vincular com o produto correspondente do estoque usando código_material
          if (item.codigo_material && produtosMap[item.codigo_material]) {
            item.produtoEstoque = produtosMap[item.codigo_material];
          }
          return item;
        });
        itensCarrinho.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setCarrinho(itensCarrinho);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os itens do carrinho",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    carregarCarrinho();
    carregarCentrosDeCusto();
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
          ...(doc.data() as Omit<Usuario, 'id'>)
        }));

        // Filtrar usuários que não possuem a propriedade nome
        const usuariosValidos = listaUsuarios.filter(u => u.nome);

        // Ordenar usuários por nome (apenas os que têm nome)
        usuariosValidos.sort((a, b) => {
          if (a.nome && b.nome) {
            return a.nome.localeCompare(b.nome);
          }
          return 0;
        });
        setUsuarios(usuariosValidos);

        // Se o usuário atual estiver na lista, selecioná-lo automaticamente
        if (userData) {
          const usuarioAtual = usuariosValidos.find(u => u.id === userData.id);
          if (usuarioAtual) {
            setSolicitanteSelecionado(usuarioAtual);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de solicitantes",
          variant: "destructive"
        });
      } finally {
        setIsLoadingUsuarios(false);
      }
    };
    carregarUsuarios();
  }, [user, userData]);
  const handleRemover = async (id: string) => {
    try {
      await deleteDoc(doc(db, "carrinho", id));
      setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.id !== id));
      toast({
        title: "Item removido",
        description: "O item foi removido do carrinho"
      });
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item do carrinho",
        variant: "destructive"
      });
    }
  };
  const handleQuantidadeChange = async (id: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    try {
      const produto = carrinho.find(item => item.id === id);
      if (!produto || !produto.codigo_material) return;

      // Verificar quantidade disponível no produto vinculado
      const quantidadeDisponivel = produto.produtoEstoque?.quantidade || 0;
      if (novaQuantidade > quantidadeDisponivel) {
        toast({
          title: "Quantidade indisponível",
          description: `Só existem ${quantidadeDisponivel} unidades disponíveis deste produto.`,
          variant: "destructive"
        });
        return;
      }
      const docRef = doc(db, "carrinho", id);
      await updateDoc(docRef, {
        quantidade: novaQuantidade,
        timestamp: new Date().getTime()
      });
      setCarrinho(prevCarrinho => prevCarrinho.map(item => item.id === id ? {
        ...item,
        quantidade: novaQuantidade
      } : item));
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive"
      });
    }
  };
  const handleCentroDeCustoChange = async (id: string, centroDeCusto: string) => {
    try {
      const docRef = doc(db, "carrinho", id);
      await updateDoc(docRef, {
        centroDeCusto: centroDeCusto
      });
      setCarrinho(prevCarrinho => prevCarrinho.map(item => item.id === id ? {
        ...item,
        centroDeCusto
      } : item));
    } catch (error) {
      console.error("Erro ao atualizar centro de custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o centro de custo",
        variant: "destructive"
      });
    }
  };
  const handleCentroDeCustoTodosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoCentroDeCusto = e.target.value;
    setCentroDeCustoTodos(novoCentroDeCusto);
    if (novoCentroDeCusto) {
      // Aplicar a todos os itens do carrinho
      const novosItens = carrinho.map(item => ({
        ...item,
        centroDeCusto: novoCentroDeCusto
      }));
      setCarrinho(novosItens);

      // Atualizar no Firestore (opcional - pode ser feito apenas no envio final)
      // Aqui estamos atualizando imediatamente para persistência
      novosItens.forEach(item => {
        if (item.centroDeCusto !== novoCentroDeCusto) {
          handleCentroDeCustoChange(item.id, novoCentroDeCusto);
        }
      });
    }
  };
  const handleIncrease = async (id: string) => {
    const produto = carrinho.find(item => item.id === id);
    if (!produto) return;

    // Usar a quantidade do produto no estoque
    const quantidadeDisponivel = produto.produtoEstoque?.quantidade || 0;
    if (produto.quantidade >= quantidadeDisponivel) {
      toast({
        title: "Quantidade máxima",
        description: `Só existem ${quantidadeDisponivel} unidades disponíveis deste produto.`,
        variant: "destructive"
      });
      return;
    }
    await handleQuantidadeChange(id, produto.quantidade + 1);
  };
  const handleDecrease = (id: string) => {
    const produto = carrinho.find(item => item.id === id);
    if (!produto || produto.quantidade <= 1) return;
    handleQuantidadeChange(id, produto.quantidade - 1);
  };

  // Função para filtrar usuários com base no termo de pesquisa
  const usuariosFiltrados = usuarios.filter(usuario => usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || usuario.perfil?.toLowerCase().includes(searchTerm.toLowerCase()));

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
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    // Verificar se todos os itens têm centro de custo definido
    const itensSemCentroDeCusto = carrinho.filter(item => !item.centroDeCusto);
    if (itensSemCentroDeCusto.length > 0) {
      toast({
        title: "Centro de custo obrigatório",
        description: "Todos os itens devem ter um centro de custo definido.",
        variant: "destructive"
      });
      return;
    }

    // Se passar nas validações, prosseguir com o envio
    handleFinalizarPedido();
  };

  // Função para finalizar o pedido enviando para a coleção "requisicoes"
  const handleFinalizarPedido = async () => {
    try {
      setIsSubmitting(true);

      // Usar userData do AuthContext que já contém todas as informações do usuário
      const userName = userData?.nome || user?.displayName || user?.email || "Usuário não identificado";

      // Gerar o próximo ID sequencial
      const nextId = await getNextRequestId();

      // Criar um único documento de requisição com todos os itens
      const requisicaoData = {
        requisicao_id: nextId,
        // Campo com ID sequencial
        status: "pendente",
        // Status padrão
        itens: carrinho.map(item => {
          const centroDeCustoSelecionado = centrosDeCusto.find(c => c.id === item.centroDeCusto);
          return {
            nome: item.nome,
            codigo_material: item.codigo_material || "",
            codigo_estoque: item.codigo_estoque || "",
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            unidade: item.unidade,
            unidade_de_medida: item.unidade_de_medida,
            deposito: item.deposito || "",
            prateleira: item.prateleira || "",
            detalhes: item.detalhes || "",
            imagem: item.imagem || "",
            centro_de_custo: centroDeCustoSelecionado.nome
          };
        }),
        usuario: {
          id: user?.uid || "",
          email: user?.email || "",
          nome: userName,
          cargo: userData?.cargo || ""
        },
        // Adicionar informações do solicitante (garantido não ser null neste ponto)
        solicitante: {
          id: solicitanteSelecionado!.id,
          nome: solicitanteSelecionado!.nome,
          perfil: solicitanteSelecionado!.perfil,
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
        description: `Requisição ${nextId} enviada com sucesso!`
      });

      // Limpar o carrinho após o envio
      setCarrinho([]);
      setCentroDeCustoTodos("");
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a requisição. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const valorTotal = carrinho.reduce((total, produto) => total + produto.valor_unitario * produto.quantidade, 0);
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };
  return <AppLayout title="Carrinho">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Seu Carrinho</h1>
        </div>

        {/* Card de Requisições Pendentes */}
        {totalPendentes > 0 && <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requisicoes')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                  Requisições Pendentes
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                  {totalPendentes}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                {totalPendentes === 1 ? 'Existe 1 requisição aguardando aprovação.' : `Existem ${totalPendentes} requisições aguardando aprovação.`}
                <span className="block mt-1 font-medium">
                  Clique aqui para visualizar e gerenciar suas requisições.
                </span>
              </p>
            </CardContent>
          </Card>}
        
        {isLoading ? <div className="text-center py-12 bg-muted/30 rounded-lg border">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Carregando seu carrinho...</p>
          </div> : carrinho.length === 0 ? <div className="text-center py-12 bg-muted/30 rounded-lg border">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">Seu carrinho está vazio</p>
            <Button onClick={() => navigate('/produtos')}>
              Adicionar Produto
            </Button>
          </div> : <div className="space-y-6">
            {/* Seletor de Solicitante e Centro de Custo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seletor de Solicitante */}
              <div className={`bg-card rounded-lg shadow p-4 ${tentouEnviarSemSolicitante && !solicitanteSelecionado ? 'border-2 border-destructive' : ''}`}>
                <h2 className="text-lg font-medium mb-3 flex items-center">
                  Solicitante
                  <span className="text-destructive ml-1">*</span>
                </h2>
                
                {tentouEnviarSemSolicitante && !solicitanteSelecionado && <Alert variant="destructive" className="mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      É necessário selecionar um solicitante para finalizar o pedido.
                    </AlertDescription>
                  </Alert>}
                
                <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button variant={tentouEnviarSemSolicitante && !solicitanteSelecionado ? "destructive" : "outline"} className="w-full justify-between" disabled={isLoadingUsuarios}>
                      {isLoadingUsuarios ? <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>Carregando solicitantes...</span>
                          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </> : solicitanteSelecionado ? <>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium">{solicitanteSelecionado.nome}</p>
                              <p className="text-xs text-muted-foreground">{solicitanteSelecionado.perfil}</p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </> : <>
                          <span>Selecione um solicitante</span>
                          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar solicitante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8" autoFocus />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {usuariosFiltrados.length === 0 ? <div className="p-3 text-center text-sm text-muted-foreground">
                          Nenhum solicitante encontrado
                        </div> : usuariosFiltrados.map(usuario => <div key={usuario.id} className={`flex flex-col p-3 cursor-pointer hover:bg-muted/50 ${solicitanteSelecionado?.id === usuario.id ? "bg-muted" : ""}`} onClick={() => handleSelecionarSolicitante(usuario)}>
                            <span className="font-medium">{usuario.nome}</span>
                            <span className="text-xs text-muted-foreground">{usuario.perfil}</span>
                          </div>)}
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-2">
                  * Campo obrigatório
                </p>
              </div>
              
              {/* Seletor de Centro de Custo para todos os itens */}
              <div className="bg-card rounded-lg shadow p-4">
                <h2 className="text-lg font-medium mb-3">Centro de Custo (Todos os Itens)</h2>
                {isLoadingCentrosDeCusto ? <div className="flex items-center justify-center h-10">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Carregando centros de custo...</span>
                  </div> : <select value={centroDeCustoTodos} onChange={handleCentroDeCustoTodosChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Selecione um centro de custo</option>
                    {centrosDeCusto.map(centro => <option key={centro.id} value={centro.id}>
                        {centro.nome} - {centro.unidade}
                      </option>)}
                  </select>}
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione para aplicar a todos os itens
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow">
              <div className="grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr] md:grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 font-medium border-b">
                <div>Imagem</div>
                <div>Produto</div>
                <div className="text-center">Quantidade</div>
                <div className="text-right">Preço Unit.</div>
                <div className="text-right">Subtotal</div>
              </div>
  
              {carrinho.map(produto => {
            // Obter valores do produto no estoque
            const quantidadeDisponivel = produto.produtoEstoque?.quantidade || 0;
            const quantidadeMinima = produto.produtoEstoque?.quantidade_minima;
            const centroDeCustoSelecionado = centrosDeCusto.find(c => c.id === produto.centroDeCusto);
            return <div key={produto.id} className="border-b">
                    <div className="grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr] md:grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 items-center">
                      <div>
                        <img src={produto.imagem || "/placeholder.svg"} alt={produto.nome} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                      </div>
                      <div>
                        <div className="font-medium">{produto.nome}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>Código: {produto.codigo_material || "N/A"} | Depósito: {produto.deposito || "N/A"}</p>
                          <p className="mt-1">
                            Disponível: {quantidadeDisponivel} un. 
                            {quantidadeMinima !== undefined && ` | Mínimo: ${quantidadeMinima} un.`}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/20" onClick={() => handleRemover(produto.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Remover
                        </Button>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center border rounded-md">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-none" onClick={() => handleDecrease(produto.id)} disabled={produto.quantidade <= 1}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input type="number" min="1" max={quantidadeDisponivel} value={produto.quantidade} onChange={e => handleQuantidadeChange(produto.id, parseInt(e.target.value, 10) || 1)} className="w-10 text-center border-none focus:ring-0 bg-transparent" />
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-none" onClick={() => handleIncrease(produto.id)} disabled={produto.quantidade >= quantidadeDisponivel}>
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
                    
                    {/* Seletor de Centro de Custo individual */}
                    <div className="px-4 pb-4 -mt-2">
                      
                    </div>
                  </div>;
          })}
  
              <div className="p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button variant="outline" onClick={() => navigate("/produtos")}>
                Adicionar Produto
              </Button>
              <Button onClick={handlePreFinalizarPedido} disabled={isSubmitting || carrinho.length === 0} className="sm:ml-auto">
                {isSubmitting ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </> : "Finalizar Requisição"}
              </Button>
            </div>
          </div>}
      </div>
    </AppLayout>;
};
export default Carrinho;