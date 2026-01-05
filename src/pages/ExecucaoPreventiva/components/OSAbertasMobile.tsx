import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Play, Clock, Package, Plus, Minus, X, Check, AlertCircle, Search, ChevronRight, FileText, User, Calendar, Wrench, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  linha: string;
  descricaoOS: string;
  responsavelChamado: string;
  origensParada: string[];
  observacaoManutencao: string;
  status: string;
  criadoEm: Timestamp;
  dataAberturaOS: string;
}

interface Produto {
  id: string;
  nome: string;
  codigo_estoque: string;
  quantidade: number;
  unidade_de_medida: string;
  imagem?: string;
}

interface ProdutoSelecionado {
  id: string;
  nome: string;
  codigo_estoque: string;
  quantidade: number;
  unidade_de_medida: string;
  quantidadeUsada: number;
}

// Componente InfoRow para informações
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

export function OSAbertasMobile() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [ordensAbertas, setOrdensAbertas] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  
  // Execution state
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [solucaoAplicada, setSolucaoAplicada] = useState("");
  
  // Products state
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  
  // Search state
  const [searchOS, setSearchOS] = useState("");

  // Fetch open orders
  useEffect(() => {
    const ordensRef = collection(db, "ordens_servicos");
    const q = query(
      ordensRef,
      where("status", "in", ["aberta", "em_execucao"])
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const ordens = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as OrdemServico[];
        ordens.sort((a, b) => {
          const dateA = a.criadoEm?.toDate?.() || new Date(0);
          const dateB = b.criadoEm?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setOrdensAbertas(ordens);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar ordens de serviço:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (executionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - executionStartTime.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [executionStartTime]);

  // Fetch products
  const fetchProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    try {
      const produtosRef = collection(db, "produtos");
      const q = query(produtosRef, where("ativo", "==", "sim"));
      
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const prods = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Produto[];
          prods.sort((a, b) => a.nome.localeCompare(b.nome));
          setProdutos(prods);
          setLoadingProdutos(false);
        },
        (error) => {
          console.error("Erro ao buscar produtos:", error);
          setLoadingProdutos(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setLoadingProdutos(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenDetails = async (os: OrdemServico) => {
    if (os.status === "em_execucao") {
      try {
        const osRef = doc(db, "ordens_servicos", os.id);
        const osDoc = await getDoc(osRef);
        const osData = osDoc.data();
        
        // Atualizar selectedOS com dados completos do Firestore
        setSelectedOS({
          ...os,
          descricaoOS: osData?.descricaoOS || os.descricaoOS
        });
        
        if (osData?.inicioExecucao) {
          const inicio = osData.inicioExecucao.toDate();
          setExecutionStartTime(inicio);
          const now = new Date();
          const diff = Math.floor((now.getTime() - inicio.getTime()) / 1000);
          setElapsedTime(diff);
        } else {
          setExecutionStartTime(new Date());
          setElapsedTime(0);
        }
        
        setObservacoes(osData?.observacoes || "");
        setSolucaoAplicada(osData?.solucaoAplicada || "");
        setShowExecutionSheet(true);
      } catch (error) {
        console.error("Erro ao recuperar dados de execução:", error);
        setShowExecutionSheet(true);
      }
    } else {
      setShowDetailsSheet(true);
    }
  };

  const handleStartExecution = async () => {
    if (!selectedOS || !user) return;

    try {
      const osRef = doc(db, "ordens_servicos", selectedOS.id);
      await updateDoc(osRef, {
        status: "em_execucao",
        manutentorId: user.uid,
        manutentorNome: userData?.nome || user.email,
        inicioExecucao: serverTimestamp()
      });

      setExecutionStartTime(new Date());
      setElapsedTime(0);
      setObservacoes("");
      setSolucaoAplicada("");
      setProdutosSelecionados([]);
      setShowDetailsSheet(false);
      setShowExecutionSheet(true);
      
      toast({
        title: "Execução iniciada",
        description: "O cronômetro está rodando"
      });
    } catch (error) {
      console.error("Erro ao iniciar execução:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a execução",
        variant: "destructive"
      });
    }
  };

  const handleCloseExecutionSheet = () => {
    setShowExecutionSheet(false);
  };

  const handleOpenProducts = async () => {
    await fetchProdutos();
    setShowProductsModal(true);
  };

  const handleAddProduct = (produto: Produto) => {
    const existente = produtosSelecionados.find(p => p.id === produto.id);
    if (existente) {
      if (existente.quantidadeUsada < produto.quantidade) {
        setProdutosSelecionados(prev =>
          prev.map(p =>
            p.id === produto.id
              ? { ...p, quantidadeUsada: p.quantidadeUsada + 1 }
              : p
          )
        );
      } else {
        toast({
          title: "Limite atingido",
          description: "Quantidade máxima disponível em estoque",
          variant: "destructive"
        });
      }
    } else {
      setProdutosSelecionados(prev => [
        ...prev,
        {
          id: produto.id,
          nome: produto.nome,
          codigo_estoque: produto.codigo_estoque,
          quantidade: produto.quantidade,
          unidade_de_medida: produto.unidade_de_medida,
          quantidadeUsada: 1
        }
      ]);
    }
  };

  const handleRemoveProduct = (produtoId: string) => {
    const existente = produtosSelecionados.find(p => p.id === produtoId);
    if (existente && existente.quantidadeUsada > 1) {
      setProdutosSelecionados(prev =>
        prev.map(p =>
          p.id === produtoId
            ? { ...p, quantidadeUsada: p.quantidadeUsada - 1 }
            : p
        )
      );
    } else {
      setProdutosSelecionados(prev => prev.filter(p => p.id !== produtoId));
    }
  };

  const handleFinishExecution = async () => {
    if (!selectedOS || !user || !executionStartTime) return;

    if (!solucaoAplicada.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a solução aplicada",
        variant: "destructive"
      });
      return;
    }

    try {
      const fimExecucao = new Date();
      const tempoTotal = Math.floor((fimExecucao.getTime() - executionStartTime.getTime()) / 1000);

      const osRef = doc(db, "ordens_servicos", selectedOS.id);
      const osDoc = await getDoc(osRef);
      const osData = osDoc.data();

      await addDoc(collection(db, "ordens_servico_finalizada"), {
        ...osData,
        ordemServicoId: selectedOS.id,
        manutentorId: user.uid,
        manutentorNome: userData?.nome || user.email,
        manutentorEmail: user.email,
        inicioExecucao: executionStartTime,
        fimExecucao: fimExecucao,
        tempoTotal: tempoTotal,
        tempoFormatado: formatTime(tempoTotal),
        observacoes: observacoes,
        solucaoAplicada: solucaoAplicada,
        produtosUtilizados: produtosSelecionados.map(p => ({
          id: p.id,
          nome: p.nome,
          codigo_estoque: p.codigo_estoque,
          quantidade: p.quantidadeUsada,
          unidade_de_medida: p.unidade_de_medida
        })),
        finalizadoEm: serverTimestamp()
      });

      for (const produto of produtosSelecionados) {
        const produtoRef = doc(db, "produtos", produto.id);
        const produtoDoc = await getDoc(produtoRef);
        if (produtoDoc.exists()) {
          const currentQty = produtoDoc.data().quantidade || 0;
          const newQty = Math.max(0, currentQty - produto.quantidadeUsada);
          await updateDoc(produtoRef, {
            quantidade: newQty,
            data_atualizacao: serverTimestamp()
          });
        }
      }

      await updateDoc(osRef, {
        status: "concluida",
        fimExecucao: serverTimestamp(),
        tempoTotal: tempoTotal,
        solucaoAplicada: solucaoAplicada,
        observacoes: observacoes,
        atualizadoEm: serverTimestamp()
      });

      setShowExecutionSheet(false);
      setSelectedOS(null);
      setExecutionStartTime(null);
      setElapsedTime(0);
      setProdutosSelecionados([]);

      toast({
        title: "Ordem finalizada",
        description: "A ordem de serviço foi concluída com sucesso"
      });
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a execução",
        variant: "destructive"
      });
    }
  };

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchProduto.toLowerCase()) ||
    p.codigo_estoque.toLowerCase().includes(searchProduto.toLowerCase())
  );

  const filteredOS = ordensAbertas.filter((os) => {
    const searchValue = searchOS.toLowerCase();
    return (
      os.setor?.toLowerCase().includes(searchValue) ||
      os.equipamento?.toLowerCase().includes(searchValue) ||
      os.descricaoOS?.toLowerCase().includes(searchValue) ||
      os.responsavelChamado?.toLowerCase().includes(searchValue)
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === "em_execucao") {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
          Em Execução
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
        Aberta
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Barra de Busca Aprimorada */}
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 py-3">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ordem de serviço..."
              value={searchOS}
              onChange={(e) => setSearchOS(e.target.value)}
              className="pl-12 w-full text-base h-14 rounded-xl"
            />
          </div>
        </CardHeader>
      </Card>

      {filteredOS.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma ordem de serviço aberta</p>
          <p className="text-muted-foreground text-sm mt-1">Não há OS para executar no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOS.map((os) => (
            <button
              key={os.id}
              onClick={() => handleOpenDetails(os)}
              className="w-full text-left bg-card border rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">
                    {os.equipamento}
                  </h3>
                  <p className="text-base text-muted-foreground mt-1">
                    {os.setor}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {os.linha && (
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    <span>Linha: {os.linha}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{os.responsavelChamado || "Não informado"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(os.status)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {os.criadoEm && format(os.criadoEm.toDate(), "dd/MM/yy HH:mm")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de Detalhes - Sheet Bottom */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Detalhes da OS</SheetTitle>
          </SheetHeader>
          
          {selectedOS && (
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="origem">Origem</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-5 pb-4">
                  {/* Header com Status */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(selectedOS.status)}
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{selectedOS.equipamento}</h2>
                    <p className="text-base text-muted-foreground">{selectedOS.setor}</p>
                  </div>

                  <Separator />

                  {/* Informações Gerais */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Informações Gerais
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <InfoRow 
                        icon={<Calendar className="h-5 w-5" />}
                        label="Data/Hora do Registro"
                        value={selectedOS.criadoEm ? format(selectedOS.criadoEm.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
                      />
                      <InfoRow 
                        icon={<User className="h-5 w-5" />}
                        label="Solicitante"
                        value={selectedOS.responsavelChamado || "Não informado"}
                      />
                      {selectedOS.linha && (
                        <InfoRow 
                          icon={<Wrench className="h-5 w-5" />}
                          label="Linha"
                          value={selectedOS.linha}
                        />
                      )}
                      {selectedOS.observacaoManutencao && (
                        <InfoRow 
                          icon={<FileText className="h-5 w-5" />}
                          label="Motivo da Manutenção"
                          value={selectedOS.observacaoManutencao}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Descrição */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Descrição do Problema</h3>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-base leading-relaxed">
                        {selectedOS.descricaoOS || "Nenhuma descrição fornecida"}
                      </p>
                    </div>
                  </div>

                  {/* Informações de Auditoria */}
                  <Separator />
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Informações de Auditoria
                    </p>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID do Registro:</span>
                        <p className="font-mono text-xs mt-0.5 break-all">{selectedOS.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <Separator />
                  <div className="pb-6">
                    <Button 
                      className="w-full h-14 text-base font-semibold"
                      onClick={handleStartExecution}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Iniciar Execução
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="origem" className="pb-4">
                  {selectedOS.origensParada && selectedOS.origensParada.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Origens da Parada
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedOS.origensParada.map((origem, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-sm px-3 py-1.5"
                          >
                            {origem}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma origem especificada</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Execução - Sheet Bottom */}
      <Sheet open={showExecutionSheet} onOpenChange={setShowExecutionSheet}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Executando OS</SheetTitle>
          </SheetHeader>
          
          {selectedOS && (
            <div className="overflow-y-auto h-[calc(100%-80px)] space-y-5">
              {/* Timer */}
              <div className="bg-primary/10 rounded-xl p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="text-sm text-muted-foreground">Tempo em execução</span>
                  <span className="text-3xl font-bold font-mono text-primary">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              {/* Header com Status */}
              <div className="flex flex-col gap-2">
                <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 w-fit">
                  Em Execução
                </Badge>
                <h2 className="text-xl font-bold leading-tight">{selectedOS.equipamento}</h2>
                <p className="text-base text-muted-foreground">{selectedOS.setor}</p>
              </div>

              <Separator />

              {/* Descrição */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Descrição do Problema</h3>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-base leading-relaxed">{selectedOS.descricaoOS}</p>
                </div>
              </div>

              <Separator />

              {/* Products section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Produtos Utilizados
                  </h3>
                  <Button size="sm" variant="outline" onClick={handleOpenProducts}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {produtosSelecionados.length > 0 && (
                  <div className="space-y-2">
                    {produtosSelecionados.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.codigo_estoque}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleRemoveProduct(p.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{p.quantidadeUsada}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleAddProduct({ ...p, quantidade: p.quantidade } as Produto)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Solução e Observações */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-base font-semibold">Solução Aplicada *</label>
                  <Textarea
                    value={solucaoAplicada}
                    onChange={(e) => setSolucaoAplicada(e.target.value)}
                    placeholder="Descreva a solução aplicada..."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">Observações</label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Botão Finalizar */}
              <div className="pb-6">
                <Button 
                  className="w-full h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700"
                  onClick={handleFinishExecution}
                  disabled={!solucaoAplicada.trim()}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Finalizar Execução
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Products Selection Modal */}
      <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Produtos</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchProduto}
              onChange={(e) => setSearchProduto(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-10"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loadingProdutos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredProdutos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              filteredProdutos.map((produto) => {
                const selecionado = produtosSelecionados.find(p => p.id === produto.id);
                const semEstoque = produto.quantidade <= 0;
                return (
                  <div
                    key={produto.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      semEstoque 
                        ? "opacity-50 cursor-not-allowed bg-muted/30" 
                        : "hover:bg-muted/50 cursor-pointer"
                    }`}
                    onClick={() => !semEstoque && handleAddProduct(produto)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{produto.nome}</p>
                      <p className={`text-xs ${semEstoque ? "text-destructive" : "text-muted-foreground"}`}>
                        {produto.codigo_estoque} • Estoque: {produto.quantidade} {produto.unidade_de_medida}
                        {semEstoque && " (Indisponível)"}
                      </p>
                    </div>
                    {selecionado && (
                      <Badge variant="secondary" className="ml-2 text-xs">{selecionado.quantidadeUsada}</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowProductsModal(false)} className="flex-1">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
