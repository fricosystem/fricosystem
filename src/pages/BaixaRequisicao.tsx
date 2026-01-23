import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, Trash2, Loader2, Search, Package, X, Calendar as CalendarIcon, History, ClipboardList } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, serverTimestamp, addDoc, orderBy, limit, query } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import HistoricoBaixas from "@/components/baixa-requisicao/HistoricoBaixas";

interface Produto {
  id: string;
  nome: string;
  codigo_material: string;
  quantidade: number;
  quantidade_minima?: number;
  valor_unitario: number;
  deposito?: string;
  unidade_de_medida?: string;
  imagem?: string;
  prateleira?: string;
  detalhes?: string;
}

interface ProdutoBaixa {
  id: string;
  produtoId: string;
  nome: string;
  codigo_material: string;
  quantidade: number;
  valor_unitario: number;
  unidade_de_medida: string;
  deposito: string;
  imagem: string;
  prateleira: string;
  detalhes: string;
  quantidadeDisponivel: number;
  centroDeCusto: string;
}

interface CentroDeCusto {
  id: string;
  nome: string;
  unidade: string;
}

const BaixaRequisicao = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  // Estados principais
  const [itensBaixa, setItensBaixa] = useState<ProdutoBaixa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [centrosDeCusto, setCentrosDeCusto] = useState<CentroDeCusto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [solicitanteNome, setSolicitanteNome] = useState("");
  const [horarioLancamento, setHorarioLancamento] = useState("");
  const [centroDeCustoSelecionado, setCentroDeCustoSelecionado] = useState("");
  const [dataLancamento, setDataLancamento] = useState<Date>(new Date());
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  // Carregar produtos
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);
        
        // Carregar produtos
        const produtosRef = collection(db, "produtos");
        const produtosSnapshot = await getDocs(produtosRef);
        const listaProdutos: Produto[] = produtosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Produto, 'id'>
        }));
        setProdutos(listaProdutos);
        
        // Carregar centros de custo filtrados pela unidade do usuário
        const centrosRef = collection(db, "centro_de_custo");
        const centrosSnapshot = await getDocs(centrosRef);
        const listaCentros: CentroDeCusto[] = centrosSnapshot.docs
          .map(doc => ({
            id: doc.id,
            nome: doc.data().nome || "",
            unidade: doc.data().unidade || ""
          }))
          .filter(centro => centro.unidade === userData?.unidade);
        listaCentros.sort((a, b) => a.nome.localeCompare(b.nome));
        setCentrosDeCusto(listaCentros);
        
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [userData?.unidade]);

  // Filtrar produtos no modal
  const produtosFiltrados = useMemo(() => {
    if (!modalSearchTerm) return produtos;
    const termo = modalSearchTerm.toLowerCase();
    return produtos.filter(p => 
      p.nome?.toLowerCase().includes(termo) ||
      p.codigo_material?.toLowerCase().includes(termo)
    );
  }, [produtos, modalSearchTerm]);

  // Abrir modal
  const abrirModal = () => {
    setIsModalOpen(true);
    setModalSearchTerm("");
    setSolicitanteNome("");
    setHorarioLancamento("");
    setCentroDeCustoSelecionado("");
    setDataLancamento(new Date());
    setProdutoSelecionado(null);
    setQuantidadeSelecionada(1);
  };

  // Fechar modal
  const fecharModal = () => {
    setIsModalOpen(false);
    setProdutoSelecionado(null);
  };

  // Selecionar produto no modal
  const selecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeSelecionada(1);
  };

  // Adicionar produto à lista
  const adicionarProduto = () => {
    if (!produtoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive"
      });
      return;
    }
    
    if (!solicitanteNome.trim()) {
      toast({
        title: "Erro",
        description: "Informe o nome do solicitante",
        variant: "destructive"
      });
      return;
    }
    
    if (!horarioLancamento || !/^\d{2}:\d{2}$/.test(horarioLancamento)) {
      toast({
        title: "Erro",
        description: "Informe o horário no formato 00:00",
        variant: "destructive"
      });
      return;
    }
    
    if (!centroDeCustoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um centro de custo",
        variant: "destructive"
      });
      return;
    }
    
    if (quantidadeSelecionada < 1) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }
    
    if (quantidadeSelecionada > (produtoSelecionado.quantidade || 0)) {
      toast({
        title: "Erro",
        description: `Quantidade máxima disponível: ${produtoSelecionado.quantidade}`,
        variant: "destructive"
      });
      return;
    }
    
    const centroCusto = centrosDeCusto.find(c => c.id === centroDeCustoSelecionado);
    
    const novoItem: ProdutoBaixa = {
      id: `${Date.now()}-${produtoSelecionado.id}`,
      produtoId: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      codigo_material: produtoSelecionado.codigo_material || "",
      quantidade: quantidadeSelecionada,
      valor_unitario: produtoSelecionado.valor_unitario || 0,
      unidade_de_medida: produtoSelecionado.unidade_de_medida || "UN",
      deposito: "MANUTENCAO",
      imagem: produtoSelecionado.imagem || "/placeholder.svg",
      prateleira: produtoSelecionado.prateleira || "",
      detalhes: produtoSelecionado.detalhes || "",
      quantidadeDisponivel: produtoSelecionado.quantidade || 0,
      centroDeCusto: centroCusto?.nome || ""
    };
    
    setItensBaixa(prev => [...prev, novoItem]);
    
    toast({
      title: "Produto adicionado",
      description: `${produtoSelecionado.nome} foi adicionado à lista`
    });
    
    fecharModal();
  };

  // Remover item
  const removerItem = (id: string) => {
    setItensBaixa(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "O item foi removido da lista"
    });
  };

  // Alterar quantidade
  const alterarQuantidade = (id: string, delta: number) => {
    setItensBaixa(prev => prev.map(item => {
      if (item.id !== id) return item;
      const novaQtd = item.quantidade + delta;
      if (novaQtd < 1 || novaQtd > item.quantidadeDisponivel) return item;
      return { ...item, quantidade: novaQtd };
    }));
  };

  // Gerar próximo ID
  const getNextReportId = async () => {
    try {
      const relatoriosRef = collection(db, "relatorios");
      const q = query(relatoriosRef, orderBy("data_registro", "desc"), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return "REL-0001";
      
      const lastDoc = snapshot.docs[0].data();
      const lastId = lastDoc.requisicao_id || "REL-0000";
      const match = lastId.match(/REL-(\d+)/);
      if (!match) return "REL-0001";
      
      const nextNum = parseInt(match[1], 10) + 1;
      return `REL-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Erro ao gerar ID:", error);
      return `REL-${Date.now().toString().slice(-6)}`;
    }
  };

  // Finalizar baixa
  const finalizarBaixa = async () => {
    if (itensBaixa.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione ao menos um produto",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const requisicaoId = await getNextReportId();
      const userName = userData?.nome || user?.displayName || user?.email || "Usuário não identificado";
      
      // Criar um documento de relatório para cada item
      for (const item of itensBaixa) {
        const relatorioData = {
          requisicao_id: requisicaoId,
          produto_id: item.produtoId,
          codigo_material: item.codigo_material,
          nome_produto: item.nome,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_unitario * item.quantidade,
          tipo: "Requisição",
          status: "saida",
          movimento: "Saída",
          solicitante: {
            id: "",
            nome: solicitanteNome,
            cargo: ""
          },
          usuario: {
            id: user?.uid || "",
            email: user?.email || "",
            nome: userName
          },
          deposito: "MANUTENCAO",
          prateleira: item.prateleira,
          centro_de_custo: item.centroDeCusto,
          unidade: userData?.unidade || "",
          unidade_de_medida: item.unidade_de_medida,
          data_saida: serverTimestamp(),
          data_registro: serverTimestamp(),
          horario_lancamento: horarioLancamento,
          data_lancamento: format(dataLancamento, "yyyy-MM-dd")
        };
        
        await addDoc(collection(db, "relatorios"), relatorioData);
      }
      
      toast({
        title: "Sucesso!",
        description: `Baixa ${requisicaoId} realizada com sucesso!`
      });
      
      setItensBaixa([]);
      setSolicitanteNome("");
      setHorarioLancamento("");
      
    } catch (error) {
      console.error("Erro ao finalizar baixa:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a baixa",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const valorTotal = itensBaixa.reduce((total, item) => total + item.valor_unitario * item.quantidade, 0);

  return (
    <AppLayout title="Baixa Requisição">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Baixa Requisição</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="nova-baixa" className="w-full">
          <TabsList className="mb-6 w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="nova-baixa" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Nova Baixa
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nova-baixa">
            {/* Botão Adicionar */}
            <div className="flex justify-end mb-6">
              <Button onClick={abrirModal} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {/* Lista de itens */}
            {isLoading ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border">
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-lg text-muted-foreground">Carregando...</p>
              </div>
            ) : itensBaixa.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-4">Nenhum produto adicionado</p>
                <Button onClick={abrirModal}>
                  Adicionar Produto
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-lg shadow overflow-x-auto">
                  {/* Cabeçalho da tabela - Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr,3fr,1fr,1fr,1fr,auto] gap-4 p-4 font-medium border-b">
                    <div>Imagem</div>
                    <div>Produto</div>
                    <div className="text-center">Quantidade</div>
                    <div className="text-right">Preço Unit.</div>
                    <div className="text-right">Subtotal</div>
                    <div className="w-10"></div>
                  </div>
    
                  {itensBaixa.map(item => (
                    <div key={item.id} className="border-b last:border-b-0">
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-[1fr,3fr,1fr,1fr,1fr,auto] gap-4 p-4 items-center">
                        <div>
                          <img 
                            src={item.imagem} 
                            alt={item.nome} 
                            className="w-16 h-16 object-cover rounded" 
                          />
                        </div>
                        <div>
                          <div className="font-medium">{item.nome}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <p>Código: {item.codigo_material || "N/A"} | Centro de Custo: {item.centroDeCusto}</p>
                            <p>Disponível: {item.quantidadeDisponivel} {item.unidade_de_medida}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex items-center border rounded-md">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 rounded-none"
                              onClick={() => alterarQuantidade(item.id, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-medium">{item.quantidade}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 rounded-none"
                              onClick={() => alterarQuantidade(item.id, 1)}
                              disabled={item.quantidade >= item.quantidadeDisponivel}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          {formatCurrency(item.valor_unitario)}
                        </div>
                        <div className="text-right font-medium">
                          {formatCurrency(item.valor_unitario * item.quantidade)}
                        </div>
                        <div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                            onClick={() => removerItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Mobile */}
                      <div className="md:hidden p-4 space-y-3">
                        <div className="flex gap-3">
                          <img 
                            src={item.imagem} 
                            alt={item.nome} 
                            className="w-16 h-16 object-cover rounded flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              Código: {item.codigo_material || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Centro de Custo: {item.centroDeCusto}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive flex-shrink-0"
                            onClick={() => removerItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-md">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 rounded-none"
                              onClick={() => alterarQuantidade(item.id, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-medium">{item.quantidade}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 rounded-none"
                              onClick={() => alterarQuantidade(item.id, 1)}
                              disabled={item.quantidade >= item.quantidadeDisponivel}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{formatCurrency(item.valor_unitario)} x {item.quantidade}</div>
                            <div className="font-medium">{formatCurrency(item.valor_unitario * item.quantidade)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
    
                  <div className="p-4 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button variant="outline" onClick={abrirModal}>
                    Adicionar Mais Produtos
                  </Button>
                  <Button 
                    onClick={finalizarBaixa} 
                    disabled={isSubmitting || itensBaixa.length === 0}
                    className="sm:ml-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Finalizar Baixa"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoBaixas />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Lateral */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={fecharModal}
        />
        
        {/* Modal Content */}
        <div 
          className={cn(
            "absolute right-0 top-0 h-full w-full sm:w-[480px] bg-background shadow-xl transition-transform duration-300 flex flex-col",
            isModalOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Header do Modal */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">Adicionar Produto</h2>
            <Button variant="ghost" size="icon" onClick={fecharModal}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Conteúdo do Modal */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Campos de entrada */}
            <div className="space-y-4">
              {/* Solicitante */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Nome do Solicitante <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="Digite o nome do solicitante"
                  value={solicitanteNome}
                  onChange={(e) => setSolicitanteNome(e.target.value)}
                />
              </div>
              
              {/* Horário */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Horário <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="00:00"
                  value={horarioLancamento}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + ':' + value.slice(2, 4);
                    }
                    setHorarioLancamento(value.slice(0, 5));
                  }}
                  maxLength={5}
                />
              </div>
              
              {/* Centro de Custo */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Centro de Custo <span className="text-destructive">*</span>
                </label>
                <select 
                  value={centroDeCustoSelecionado}
                  onChange={(e) => setCentroDeCustoSelecionado(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um centro de custo</option>
                  {centrosDeCusto.map(centro => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nome} - {centro.unidade}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Data de Lançamento */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Data de Lançamento <span className="text-destructive">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataLancamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataLancamento ? format(dataLancamento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataLancamento}
                      onSelect={(date) => date && setDataLancamento(date)}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Busca de produto */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Buscar Produto <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou código..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Lista de produtos */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {produtosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              ) : (
                produtosFiltrados.map(produto => (
                  <div 
                    key={produto.id}
                    className={cn(
                      "flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      produtoSelecionado?.id === produto.id && "bg-primary/10 border-primary"
                    )}
                    onClick={() => selecionarProduto(produto)}
                  >
                    <img 
                      src={produto.imagem || "/placeholder.svg"} 
                      alt={produto.nome}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{produto.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        Código: {produto.codigo_material || "N/A"} | Disp: {produto.quantidade || 0} {produto.unidade_de_medida || "UN"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Seletor de quantidade */}
            {produtoSelecionado && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="font-medium">Produto selecionado: {produtoSelecionado.nome}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quantidade:</span>
                  <div className="flex items-center border rounded-md bg-background">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 p-0 rounded-none"
                      onClick={() => setQuantidadeSelecionada(prev => Math.max(1, prev - 1))}
                      disabled={quantidadeSelecionada <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantidadeSelecionada}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 p-0 rounded-none"
                      onClick={() => setQuantidadeSelecionada(prev => Math.min(produtoSelecionado.quantidade || 1, prev + 1))}
                      disabled={quantidadeSelecionada >= (produtoSelecionado.quantidade || 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Máximo disponível: {produtoSelecionado.quantidade || 0} {produtoSelecionado.unidade_de_medida || "UN"}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer do Modal */}
          <div className="p-4 border-t flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={fecharModal} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={adicionarProduto} className="flex-1" disabled={!produtoSelecionado}>
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BaixaRequisicao;