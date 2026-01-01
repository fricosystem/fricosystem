import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Play, Clock, Package, Plus, Minus, X, Check, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  descricao: string;
  responsavelChamado: string;
  origensParada: string[];
  status: string;
  criadoEm: Timestamp;
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

export function OSAbertasMobile() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [ordensAbertas, setOrdensAbertas] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
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

  // Fetch open orders
  useEffect(() => {
    const ordensRef = collection(db, "ordens_servicos");
    // Query para buscar OS que não estão concluídas (aberta ou em_execucao)
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
        // Ordenar no cliente por criadoEm (mais recentes primeiro)
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
      // Query simples sem orderBy para evitar necessidade de índice composto
      const q = query(produtosRef, where("ativo", "==", "sim"));
      
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const prods = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Produto[];
          // Ordenar no cliente por nome
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

  const handleOpenDetails = (os: OrdemServico) => {
    setSelectedOS(os);
    setShowDetailsModal(true);
  };

  const handleStartExecution = async () => {
    if (!selectedOS || !user) return;

    try {
      // Update OS status to em_execucao
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
      setShowDetailsModal(false);
      setShowExecutionModal(true);
      
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

      // Get the original OS data
      const osRef = doc(db, "ordens_servicos", selectedOS.id);
      const osDoc = await getDoc(osRef);
      const osData = osDoc.data();

      // Create finished order in ordens_servico_finalizada
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

      // Update product quantities
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

      // Update original OS status to concluida
      await updateDoc(osRef, {
        status: "concluida",
        fimExecucao: serverTimestamp(),
        tempoTotal: tempoTotal,
        solucaoAplicada: solucaoAplicada,
        observacoes: observacoes,
        atualizadoEm: serverTimestamp()
      });

      setShowExecutionModal(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Ordens de Serviço Abertas</h2>
        <Badge variant="secondary">{ordensAbertas.length}</Badge>
      </div>

      {ordensAbertas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ordem de serviço aberta</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordensAbertas.map((os) => (
            <Card 
              key={os.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenDetails(os)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{os.equipamento}</p>
                    <p className="text-sm text-muted-foreground truncate">{os.setor}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{os.descricao}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                      Aberta
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {os.criadoEm && format(os.criadoEm.toDate(), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Detalhes da OS
            </DialogTitle>
          </DialogHeader>
          
          {selectedOS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium">{selectedOS.setor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipamento</p>
                  <p className="font-medium">{selectedOS.equipamento}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedOS.descricao}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Solicitante</p>
                <p className="font-medium">{selectedOS.responsavelChamado}</p>
              </div>

              {selectedOS.origensParada && selectedOS.origensParada.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Origens da Parada</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOS.origensParada.map((origem, idx) => (
                      <Badge key={idx} variant="outline">{origem}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {selectedOS.criadoEm && format(selectedOS.criadoEm.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartExecution} className="gap-2">
              <Play className="h-4 w-4" />
              Executar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Modal */}
      <Dialog open={showExecutionModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Executando OS
            </DialogTitle>
          </DialogHeader>
          
          {selectedOS && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Tempo de Execução</p>
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{selectedOS.equipamento}</p>
                <p className="text-sm text-muted-foreground">{selectedOS.setor}</p>
              </div>

              {/* Products section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos Utilizados
                  </p>
                  <Button size="sm" variant="outline" onClick={handleOpenProducts}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {produtosSelecionados.length > 0 && (
                  <div className="space-y-2">
                    {produtosSelecionados.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.codigo_estoque}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleRemoveProduct(p.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{p.quantidadeUsada}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
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

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Solução Aplicada <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={solucaoAplicada}
                  onChange={(e) => setSolucaoAplicada(e.target.value)}
                  placeholder="Descreva a solução aplicada..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleFinishExecution} className="w-full gap-2" size="lg">
              <Check className="h-5 w-5" />
              Finalizar Execução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Selection Modal */}
      <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Adicionar Produtos
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>
            ) : (
              filteredProdutos.map((produto) => {
                const selecionado = produtosSelecionados.find(p => p.id === produto.id);
                return (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAddProduct(produto)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {produto.codigo_estoque} • Estoque: {produto.quantidade} {produto.unidade_de_medida}
                      </p>
                    </div>
                    {selecionado && (
                      <Badge className="ml-2">{selecionado.quantidadeUsada}</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowProductsModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
