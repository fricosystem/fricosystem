import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, Layers, AlertTriangle, TrendingUp, Package, Plus, Edit, Trash2, Info } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddPecaModal } from "@/components/Maquinas/AddPecaModal";
import { AddSubPecaModal } from "@/components/Maquinas/AddSubPecaModal";
import { AddSistemaModal } from "@/components/Maquinas/AddSistemaModal";
import { AddManutencaoModal } from "@/components/Maquinas/AddManutencaoModal";
import { AddMetricaModal } from "@/components/Maquinas/AddMetricaModal";
import { PecaCard } from "@/components/Maquinas/PecaCard";

interface SubPeca {
  id: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  estoqueMinimo: number;
  pecaPaiId: string;
  pecaId: string;
  valorUnitario: number;
  fornecedor: string;
  descricao: string;
}

interface Peca {
  id: string;
  nome: string;
  x: number;
  y: number;
  conectadoCom?: string[];
  descricao: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  categoria: "Mecânica" | "Elétrica" | "Hidráulica";
  vidaUtil: number;
  vidaUtilRestante: number;
  ultimaManutencao: string;
  proximaManutencao: string;
  custoManutencao: number;
  emEstoque: number;
  estoqueMinimo: number;
  fornecedor: string;
  tempoCritico: number;
  valorUnitario: number;
  dataUltimaCompra: string;
  subPecas?: any[];
  maquinaId?: string;
  equipamentoId: string;
}

interface Sistema {
  id: string;
  nome: string;
  x: number;
  y: number;
  tipo: string;
  status: "Normal" | "Atenção" | "Crítico";
  totalPecas: number;
  pecas?: Peca[];
}

interface Maquina {
  id: string;
  nome: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
  sistemas?: Sistema[];
}

interface Manutencao {
  id: string;
  equipamentoId: string;
  pecaId?: string;
  data: any;
  tipo: "Preventiva" | "Corretiva";
  custo: number;
  tecnico: string;
  descricao: string;
}

interface Metrica {
  id: string;
  equipamentoId: string;
  mes: string;
  ano: number;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  custoPreventiva: number;
  custoCorretiva: number;
}

const MaquinaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
  const [selectedSubPeca, setSelectedSubPeca] = useState<SubPeca | null>(null);
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedMaquina, setSelectedMaquina] = useState<string | null>(null);
  const [expandedPecaId, setExpandedPecaId] = useState<string | null>(null);
  const [camadasVisiveis, setCamadasVisiveis] = useState<string[]>(["Mecânica", "Elétrica", "Hidráulica"]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados para gerenciamento de modais
  const [isPecaModalOpen, setIsPecaModalOpen] = useState(false);
  const [isSubPecaModalOpen, setIsSubPecaModalOpen] = useState(false);
  const [isSistemaModalOpen, setIsSistemaModalOpen] = useState(false);
  const [isManutencaoModalOpen, setIsManutencaoModalOpen] = useState(false);
  const [isMetricaModalOpen, setIsMetricaModalOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);
  const [editingSubPeca, setEditingSubPeca] = useState<SubPeca | null>(null);
  const [editingSistema, setEditingSistema] = useState<Sistema | null>(null);
  const [selectedPecaForSubPeca, setSelectedPecaForSubPeca] = useState<string | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Estados para dados do Firestore
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loadingManutencoes, setLoadingManutencoes] = useState(false);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  // Buscar máquina
  useEffect(() => {
    const fetchMaquina = async () => {
      if (!id) return;
      try {
        const maquinaDoc = await getDoc(doc(db, "equipamentos", id));
        if (maquinaDoc.exists()) {
          const data = maquinaDoc.data();
          setMaquina({
            id: maquinaDoc.id,
            nome: data.equipamento || "",
            imagemUrl: data.imagemUrl || "",
            status: data.status || "Ativa",
            descricao: data.descricao || "",
            sistemas: data.sistemas || []
          } as Maquina);
        } else {
          toast({
            title: "Erro",
            description: "Máquina não encontrada.",
            variant: "destructive"
          });
          navigate("/maquinas");
        }
      } catch (error) {
        console.error("Erro ao buscar máquina:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da máquina.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMaquina();
  }, [id, navigate, toast]);

  // Buscar manutenções
  useEffect(() => {
    const fetchManutencoes = async () => {
      if (!id) return;
      setLoadingManutencoes(true);
      try {
        const manutencoesQuery = query(
          collection(db, "manutencoes"),
          where("equipamentoId", "==", id)
        );
        const snapshot = await getDocs(manutencoesQuery);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Manutencao[];
        setManutencoes(data.sort((a, b) => b.data?.toDate?.() - a.data?.toDate?.() || 0));
      } catch (error) {
        console.error("Erro ao buscar manutenções:", error);
      } finally {
        setLoadingManutencoes(false);
      }
    };
    fetchManutencoes();
  }, [id]);

  // Buscar métricas
  useEffect(() => {
    const fetchMetricas = async () => {
      if (!id) return;
      setLoadingMetricas(true);
      try {
        const metricasQuery = query(
          collection(db, "metricas_equipamento"),
          where("equipamentoId", "==", id)
        );
        const snapshot = await getDocs(metricasQuery);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Metrica[];
        setMetricas(data.sort((a, b) => {
          if (a.ano !== b.ano) return b.ano - a.ano;
          return b.mes.localeCompare(a.mes);
        }));
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
      } finally {
        setLoadingMetricas(false);
      }
    };
    fetchMetricas();
  }, [id]);

  // Extrair todas as peças dos sistemas
  const todasPecas = useMemo(() => {
    if (!maquina?.sistemas) return [];
    const pecas: Peca[] = [];
    maquina.sistemas.forEach(sistema => {
      if (sistema.pecas) {
        sistema.pecas.forEach(peca => {
          pecas.push({
            ...peca,
            maquinaId: sistema.id,
            equipamentoId: maquina.id
          });
        });
      }
    });
    return pecas;
  }, [maquina]);

  // Extrair todas as sub-peças
  const todasSubPecas = useMemo(() => {
    const subPecas: SubPeca[] = [];
    todasPecas.forEach(peca => {
      if (peca.subPecas && Array.isArray(peca.subPecas)) {
        peca.subPecas.forEach(sp => {
          subPecas.push(sp);
        });
      }
    });
    return subPecas;
  }, [todasPecas]);

  // Filtrar peças por camada e sistema selecionado
  const pecasPorCamada = useMemo(() => {
    if (!selectedMaquina) return [];
    return todasPecas.filter(
      peca => camadasVisiveis.includes(peca.categoria) && peca.maquinaId === selectedMaquina
    );
  }, [camadasVisiveis, selectedMaquina, todasPecas]);

  // Filtrar peças na aba de gerenciamento
  const pecasFiltradas = useMemo(() => {
    let filtered = todasPecas;
    if (categoriaFilter !== "todas") {
      filtered = filtered.filter(p => p.categoria === categoriaFilter);
    }
    if (statusFilter !== "todos") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    return filtered;
  }, [todasPecas, categoriaFilter, statusFilter]);

  // Estatísticas das peças
  const pecasStats = useMemo(() => ({
    total: todasPecas.length,
    criticas: todasPecas.filter(p => p.status === "Crítico").length,
    estoqueBaixo: todasPecas.filter(p => p.emEstoque < p.estoqueMinimo).length,
    proximaManutencao: todasPecas.filter(p => {
      if (!p.proximaManutencao) return false;
      const dias = Math.floor((new Date(p.proximaManutencao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return dias <= 30;
    }).length,
    custoTotal: todasPecas.reduce((acc, p) => acc + (p.custoManutencao || 0), 0)
  }), [todasPecas]);

  // Estatísticas de manutenção
  const manutencoesStats = useMemo(() => {
    const preventivas = manutencoes.filter(m => m.tipo === "Preventiva");
    const corretivas = manutencoes.filter(m => m.tipo === "Corretiva");
    return {
      total: manutencoes.length,
      preventivas: preventivas.length,
      corretivas: corretivas.length,
      custoTotal: manutencoes.reduce((acc, m) => acc + m.custo, 0),
      custoPreventivas: preventivas.reduce((acc, m) => acc + m.custo, 0),
      custoCorretivas: corretivas.reduce((acc, m) => acc + m.custo, 0)
    };
  }, [manutencoes]);

  // Calcular OEE médio das últimas métricas
  const oeeAtual = useMemo(() => {
    if (metricas.length === 0) return 0;
    const ultimaMetrica = metricas[0];
    return ((ultimaMetrica.disponibilidade / 100) * 
            (ultimaMetrica.performance / 100) * 
            (ultimaMetrica.qualidade / 100) * 100).toFixed(1);
  }, [metricas]);

  // Dados para gráfico de performance
  const dadosDesempenho = useMemo(() => {
    return metricas.slice(0, 6).reverse().map(m => ({
      mes: `${m.mes}/${String(m.ano).slice(2)}`,
      disponibilidade: m.disponibilidade,
      performance: m.performance,
      qualidade: m.qualidade
    }));
  }, [metricas]);

  // Dados para gráfico de custos
  const dadosCustos = useMemo(() => {
    return metricas.slice(0, 6).reverse().map(m => ({
      mes: `${m.mes}/${String(m.ano).slice(2)}`,
      preventiva: m.custoPreventiva,
      corretiva: m.custoCorretiva
    }));
  }, [metricas]);

  // Handlers
  const handleAddSistema = () => {
    setEditingSistema(null);
    setIsSistemaModalOpen(true);
  };

  const handleEditSistema = (sistema: Sistema) => {
    setEditingSistema(sistema);
    setIsSistemaModalOpen(true);
  };

  const handleDeleteSistema = async (sistemaId: string) => {
    if (!id || !maquina) return;
    try {
      const novosSistemas = maquina.sistemas?.filter(s => s.id !== sistemaId) || [];
      await updateDoc(doc(db, "equipamentos", id), {
        sistemas: novosSistemas
      });
      setMaquina({ ...maquina, sistemas: novosSistemas });
      toast({
        title: "Sucesso",
        description: "Sistema excluído com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o sistema.",
        variant: "destructive"
      });
    }
  };

  const handleAddPeca = () => {
    if (!selectedMaquina) {
      toast({
        title: "Atenção",
        description: "Selecione um sistema primeiro para adicionar uma peça.",
        variant: "default"
      });
      return;
    }
    setEditingPeca(null);
    setIsPecaModalOpen(true);
  };

  const handleEditPeca = (peca: Peca) => {
    setSelectedMaquina(peca.maquinaId || null);
    setEditingPeca(peca);
    setIsPecaModalOpen(true);
  };

  const handleDeletePeca = async (pecaId: string) => {
    if (!id || !maquina) return;
    try {
      const novosSistemas = maquina.sistemas?.map(sistema => ({
        ...sistema,
        pecas: sistema.pecas?.filter(p => p.id !== pecaId) || [],
        totalPecas: (sistema.pecas?.filter(p => p.id !== pecaId) || []).length
      })) || [];
      
      await updateDoc(doc(db, "equipamentos", id), {
        sistemas: novosSistemas
      });
      
      setMaquina({ ...maquina, sistemas: novosSistemas });
      toast({
        title: "Sucesso",
        description: "Peça excluída com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao excluir peça:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a peça.",
        variant: "destructive"
      });
    }
  };

  const handleAddSubPeca = (pecaId: string) => {
    const peca = todasPecas.find(p => p.id === pecaId);
    if (peca) {
      setSelectedMaquina(peca.maquinaId || null);
    }
    setSelectedPecaForSubPeca(pecaId);
    setEditingSubPeca(null);
    setIsSubPecaModalOpen(true);
  };

  const handleEditSubPeca = (subPeca: SubPeca) => {
    const peca = todasPecas.find(p => p.id === subPeca.pecaPaiId);
    if (peca) {
      setSelectedMaquina(peca.maquinaId || null);
    }
    setSelectedPecaForSubPeca(subPeca.pecaPaiId);
    setEditingSubPeca(subPeca);
    setIsSubPecaModalOpen(true);
  };

  const handleDeleteSubPeca = async (subPecaId: string) => {
    if (!id || !maquina) return;
    try {
      const novosSistemas = maquina.sistemas?.map(sistema => ({
        ...sistema,
        pecas: sistema.pecas?.map(peca => ({
          ...peca,
          subPecas: peca.subPecas?.filter((sp: any) => sp.id !== subPecaId) || []
        })) || []
      })) || [];
      
      await updateDoc(doc(db, "equipamentos", id), {
        sistemas: novosSistemas
      });
      
      setMaquina({ ...maquina, sistemas: novosSistemas });
      toast({
        title: "Sucesso",
        description: "Sub-peça excluída com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao excluir sub-peça:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sub-peça.",
        variant: "destructive"
      });
    }
  };

  const handleSistemaSuccess = async () => {
    if (!id) return;
    const maquinaDoc = await getDoc(doc(db, "equipamentos", id));
    if (maquinaDoc.exists()) {
      const data = maquinaDoc.data();
      setMaquina({
        ...maquina!,
        sistemas: data.sistemas || []
      });
    }
  };

  const handlePecaSuccess = async () => {
    if (!id) return;
    const maquinaDoc = await getDoc(doc(db, "equipamentos", id));
    if (maquinaDoc.exists()) {
      const data = maquinaDoc.data();
      setMaquina({
        ...maquina!,
        sistemas: data.sistemas || []
      });
    }
  };

  const handleSubPecaSuccess = async () => {
    if (!id) return;
    const maquinaDoc = await getDoc(doc(db, "equipamentos", id));
    if (maquinaDoc.exists()) {
      const data = maquinaDoc.data();
      setMaquina({
        ...maquina!,
        sistemas: data.sistemas || []
      });
    }
  };

  const handleManutencaoSuccess = async () => {
    if (!id) return;
    const manutencoesQuery = query(
      collection(db, "manutencoes"),
      where("equipamentoId", "==", id)
    );
    const snapshot = await getDocs(manutencoesQuery);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Manutencao[];
    setManutencoes(data.sort((a, b) => b.data?.toDate?.() - a.data?.toDate?.() || 0));
  };

  const handleMetricaSuccess = async () => {
    if (!id) return;
    const metricasQuery = query(
      collection(db, "metricas_equipamento"),
      where("equipamentoId", "==", id)
    );
    const snapshot = await getDocs(metricasQuery);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Metrica[];
    setMetricas(data.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.mes.localeCompare(a.mes);
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-green-500";
      case "Atenção": return "bg-yellow-500";
      case "Crítico": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Crítico": return "destructive";
      case "Atenção": return "secondary";
      default: return "default";
    }
  };

  const toggleCamada = (camada: string) => {
    setCamadasVisiveis(prev => 
      prev.includes(camada) ? prev.filter(c => c !== camada) : [...prev, camada]
    );
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case "Mecânica": return "⚙️";
      case "Elétrica": return "⚡";
      case "Hidráulica": return "💧";
      default: return "🔧";
    }
  };

  const handleMaquinaClick = (sistemaId: string) => {
    setSelectedMaquina(sistemaId);
  };

  const handleSistemaInfo = (sistema: Sistema, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSistema(sistema);
    setSelectedPeca(null);
    setSelectedSubPeca(null);
  };

  const handleVoltar = () => {
    setSelectedMaquina(null);
    setExpandedPecaId(null);
  };

  const handlePecaClick = (peca: Peca) => {
    if (expandedPecaId === peca.id) {
      setExpandedPecaId(null);
    } else {
      setExpandedPecaId(peca.id);
    }
  };

  const handlePecaInfo = (peca: Peca, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPeca(peca);
    setSelectedSubPeca(null);
    setSelectedSistema(null);
  };

  const handleSubPecaInfo = (subPeca: SubPeca, peca: Peca, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubPeca(subPeca);
    setSelectedPeca(peca);
    setSelectedSistema(null);
  };

  if (loading) {
    return (
      <AppLayout title="Detalhes da Máquina">
        <div className="container mx-auto p-6">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!maquina) return null;

  const sistemas = maquina.sistemas || [];

  return (
    <AppLayout title={`Detalhes - ${maquina.nome}`}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/maquinas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{maquina.nome}</h1>
            <p className="text-muted-foreground mt-1">
              Mapa interativo de componentes e peças
            </p>
          </div>
          <Badge variant={maquina.status === "Ativa" ? "default" : "secondary"}>
            {maquina.status}
          </Badge>
        </div>

        {/* Mapa de Peças */}
        <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <CardTitle>Diagrama de Componentes</CardTitle>
              
              {selectedMaquina && (
                <>
                  <Button variant="outline" size="sm" onClick={handleVoltar}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Camadas:</span>
                    {["Mecânica", "Elétrica", "Hidráulica"].map(camada => (
                      <Button
                        key={camada}
                        variant={camadasVisiveis.includes(camada) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCamada(camada)}
                      >
                        {getCategoriaIcon(camada)} {camada}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="diagram-container diagram-background rounded-lg relative" style={{ 
              width: "100%", 
              height: isFullscreen ? "calc(100vh - 80px)" : "600px" 
            }}>
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-card/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg">
                      <Button variant="outline" size="icon" onClick={() => zoomIn()}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => zoomOut()}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => resetTransform()}>
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="absolute top-4 left-4 z-10 flex gap-2 bg-card/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg">
                      <Button onClick={handleAddSistema} size="sm" variant="default">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Sistema
                      </Button>
                    </div>
                    
                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: isFullscreen ? "calc(100vh - 80px)" : "600px"
                      }}
                    >
                      <svg width="900" height="600" className="diagram-background">
                        <defs>
                          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                            <feOffset dx="0" dy="2" result="offsetblur" />
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.2" />
                            </feComponentTransfer>
                            <feMerge> 
                              <feMergeNode />
                              <feMergeNode in="SourceGraphic" /> 
                            </feMerge>
                          </filter>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Renderizar Sistemas no lado esquerdo */}
                        {sistemas.map(sistema => {
                          const statusColor = sistema.status === "Crítico" ? "#ef4444" : 
                                            sistema.status === "Atenção" ? "#f59e0b" : "#10b981";
                          const isSelected = selectedMaquina === sistema.id;
                          
                          return (
                            <g
                              key={sistema.id}
                              style={{ cursor: "pointer" }}
                              className="transition-all hover:opacity-90"
                              filter="url(#cardShadow)"
                            >
                              <rect
                                x={sistema.x - 85}
                                y={sistema.y - 50}
                                width="170"
                                height="100"
                                rx="12"
                                ry="12"
                                fill="hsl(var(--card))"
                                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                                strokeWidth={isSelected ? "2.5" : "1.5"}
                                className="transition-all"
                                onClick={() => handleMaquinaClick(sistema.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  handleSistemaInfo(sistema, e as any);
                                }}
                              />
                              
                              <rect
                                x={sistema.x - 85}
                                y={sistema.y - 50}
                                width="170"
                                height="5"
                                rx="12"
                                ry="12"
                                fill={statusColor}
                              />

                              <text
                                x={sistema.x}
                                y={sistema.y - 15}
                                textAnchor="middle"
                                className="text-sm font-bold fill-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {sistema.nome}
                              </text>

                              <text
                                x={sistema.x}
                                y={sistema.y + 5}
                                textAnchor="middle"
                                className="text-xs fill-muted-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {sistema.tipo}
                              </text>

                              <text
                                x={sistema.x}
                                y={sistema.y + 25}
                                textAnchor="middle"
                                className="text-xs fill-muted-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {sistema.totalPecas} peças
                              </text>

                              <g transform={`translate(${sistema.x + 70}, ${sistema.y - 35})`}>
                                <circle r="10" fill={statusColor} />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="10"
                                  fill="white"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {sistema.status === "Crítico" ? "!" : 
                                   sistema.status === "Atenção" ? "!" : "✓"}
                                </text>
                              </g>

                              <g 
                                transform={`translate(${sistema.x + 70}, ${sistema.y + 30})`}
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSistemaInfo(sistema, e as any);
                                }}
                              >
                                <circle r="10" fill="hsl(var(--primary))" opacity="0.9" />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="12"
                                  fill="white"
                                  fontWeight="bold"
                                >
                                  i
                                </text>
                              </g>
                            </g>
                          );
                        })}

                        {/* Renderizar peças no lado direito quando um sistema for selecionado */}
                        {selectedMaquina && (
                          <>
                            {/* Linhas de conexão */}
                            {pecasPorCamada.map((peca, index) => {
                              const sistema = sistemas.find(s => s.id === selectedMaquina);
                              const centerX = sistema?.x || 120;
                              const centerY = sistema?.y || 300;
                              const startX = 400;
                              const startY = 80;
                              const spacing = 100;
                              const pecaX = startX;
                              const pecaY = startY + index * spacing;

                              const startPointX = centerX + 85;
                              const startPointY = centerY;
                              const endPointX = pecaX - 70;
                              const endPointY = pecaY;

                              const controlX1 = startPointX + 80;
                              const controlX2 = endPointX - 80;
                              
                              return (
                                <g key={`conn-${peca.id}`}>
                                  <path
                                    d={`M ${startPointX} ${startPointY} C ${controlX1} ${startPointY}, ${controlX2} ${endPointY}, ${endPointX} ${endPointY}`}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="2.5"
                                    fill="none"
                                    opacity={0.6}
                                    strokeLinecap="round"
                                    filter="url(#glow)"
                                  />
                                  <circle
                                    cx={endPointX}
                                    cy={endPointY}
                                    r="4"
                                    fill="hsl(var(--primary))"
                                    opacity={0.8}
                                  />
                                </g>
                              );
                            })}

                            {/* Linhas para sub-peças expandidas */}
                            {expandedPecaId && pecasPorCamada.find(p => p.id === expandedPecaId)?.subPecas?.map((subPeca: any, subIndex: number) => {
                              const pecaIndex = pecasPorCamada.findIndex(p => p.id === expandedPecaId);
                              const startX = 400;
                              const startY = 80;
                              const spacing = 100;
                              const pecaX = startX;
                              const pecaY = startY + pecaIndex * spacing;
                              const subStartX = 650;
                              const subSpacing = 70;
                              const subPecaX = subStartX;
                              const subPecaY = pecaY - 30 + subIndex * subSpacing;

                              const startPointX = pecaX + 70;
                              const startPointY = pecaY;
                              const endPointX = subPecaX - 60;
                              const endPointY = subPecaY;
                              
                              return (
                                <g key={`subconn-${subPeca.id}`}>
                                  <line
                                    x1={startPointX}
                                    y1={startPointY}
                                    x2={endPointX}
                                    y2={endPointY}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="1.5"
                                    opacity={0.4}
                                    strokeDasharray="4,4"
                                  />
                                  <polygon
                                    points={`${endPointX},${endPointY} ${endPointX - 5},${endPointY - 3} ${endPointX - 5},${endPointY + 3}`}
                                    fill="hsl(var(--primary))"
                                    opacity={0.6}
                                  />
                                </g>
                              );
                            })}

                            {/* Blocos de peças */}
                            {pecasPorCamada.map((peca, index) => {
                              const startX = 400;
                              const startY = 80;
                              const spacing = 100;
                              const pecaX = startX;
                              const pecaY = startY + index * spacing;
                              const statusColor = peca.status === "Crítico" ? "#ef4444" : 
                                                peca.status === "Atenção" ? "#f59e0b" : "#10b981";
                              const isExpanded = expandedPecaId === peca.id;
                              
                              return (
                                <g key={peca.id}>
                                  <g
                                    style={{ cursor: "pointer" }}
                                    className="transition-all hover:opacity-90"
                                    filter="url(#cardShadow)"
                                  >
                                    <rect
                                      x={pecaX - 70}
                                      y={pecaY - 35}
                                      width="140"
                                      height="70"
                                      rx="10"
                                      ry="10"
                                      fill="hsl(var(--card))"
                                      stroke={isExpanded ? "hsl(var(--primary))" : "hsl(var(--border))"}
                                      strokeWidth={isExpanded ? "2.5" : "1.5"}
                                      className="transition-all"
                                      onClick={() => handlePecaClick(peca)}
                                      onContextMenu={(e) => handlePecaInfo(peca, e as any)}
                                    />
                                    
                                    <rect
                                      x={pecaX - 70}
                                      y={pecaY - 35}
                                      width="140"
                                      height="5"
                                      rx="10"
                                      ry="10"
                                      fill={statusColor}
                                    />

                                    <text
                                      x={pecaX - 55}
                                      y={pecaY - 8}
                                      fontSize="18"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {getCategoriaIcon(peca.categoria)}
                                    </text>

                                    <text
                                      x={pecaX - 30}
                                      y={pecaY - 12}
                                      textAnchor="start"
                                      className="text-xs font-semibold fill-foreground"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {peca.codigo}
                                    </text>

                                    <text
                                      x={pecaX}
                                      y={pecaY + 6}
                                      textAnchor="middle"
                                      className="text-[10px] fill-muted-foreground"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {peca.nome.length > 20 ? peca.nome.substring(0, 18) + "..." : peca.nome}
                                    </text>

                                    <g transform={`translate(${pecaX + 55}, ${pecaY - 25})`}>
                                      <circle r="8" fill={statusColor} />
                                      <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="9"
                                        fill="white"
                                        fontWeight="bold"
                                        style={{ pointerEvents: "none" }}
                                      >
                                        {peca.status === "Crítico" || peca.status === "Atenção" ? "!" : "✓"}
                                      </text>
                                    </g>

                                    {peca.emEstoque <= peca.estoqueMinimo && (
                                      <g transform={`translate(${pecaX + 55}, ${pecaY - 10})`}>
                                        <circle r="7" fill="#f59e0b" />
                                        <text
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="10"
                                          fill="white"
                                          fontWeight="bold"
                                          style={{ pointerEvents: "none" }}
                                        >
                                          !
                                        </text>
                                      </g>
                                    )}

                                    <g transform={`translate(${pecaX - 60}, ${pecaY + 18})`}>
                                      <rect width="120" height="3" rx="1.5" fill="hsl(var(--muted))" />
                                      <rect
                                        width={120 * (peca.vidaUtilRestante / peca.vidaUtil)}
                                        height="3"
                                        rx="1.5"
                                        fill={
                                          peca.vidaUtilRestante / peca.vidaUtil > 0.5 ? "#10b981" :
                                          peca.vidaUtilRestante / peca.vidaUtil > 0.3 ? "#f59e0b" : "#ef4444"
                                        }
                                      />
                                    </g>
                                    
                                    {peca.subPecas && peca.subPecas.length > 0 && (
                                      <g transform={`translate(${pecaX - 58}, ${pecaY - 25})`}>
                                        <circle r="7" fill="hsl(var(--primary))" />
                                        <text
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="10"
                                          fill="white"
                                          fontWeight="bold"
                                          style={{ pointerEvents: "none" }}
                                        >
                                          {isExpanded ? "−" : "+"}
                                        </text>
                                      </g>
                                    )}
                                  </g>
                                  
                                  {/* Renderizar sub-peças se expandido */}
                                  {isExpanded && peca.subPecas?.map((subPeca: any, subIndex: number) => {
                                    const subStartX = 650;
                                    const subSpacing = 70;
                                    const subPecaX = subStartX;
                                    const subPecaY = pecaY - 30 + subIndex * subSpacing;
                                    const subStatusColor = subPeca.status === "Crítico" ? "#ef4444" : 
                                                         subPeca.status === "Atenção" ? "#f59e0b" : "#10b981";
                                    
                                    return (
                                      <g
                                        key={subPeca.id}
                                        style={{ cursor: "pointer" }}
                                        className="transition-all hover:opacity-90"
                                        filter="url(#cardShadow)"
                                      >
                                        <rect
                                          x={subPecaX - 60}
                                          y={subPecaY - 25}
                                          width="120"
                                          height="50"
                                          rx="8"
                                          ry="8"
                                          fill="hsl(var(--card))"
                                          stroke="hsl(var(--border))"
                                          strokeWidth="1.5"
                                          onClick={(e) => handleSubPecaInfo(subPeca, peca, e as any)}
                                        />
                                        
                                        <rect
                                          x={subPecaX - 60}
                                          y={subPecaY - 25}
                                          width="120"
                                          height="4"
                                          rx="8"
                                          ry="8"
                                          fill={subStatusColor}
                                        />
                                        
                                        <text
                                          x={subPecaX}
                                          y={subPecaY - 8}
                                          textAnchor="middle"
                                          className="text-[9px] font-bold fill-foreground"
                                          style={{ pointerEvents: "none" }}
                                        >
                                          {subPeca.codigo}
                                        </text>
                                        
                                        <text
                                          x={subPecaX}
                                          y={subPecaY + 5}
                                          textAnchor="middle"
                                          className="text-[8px] fill-muted-foreground"
                                          style={{ pointerEvents: "none" }}
                                        >
                                          {subPeca.nome.length > 18 ? subPeca.nome.substring(0, 16) + "..." : subPeca.nome}
                                        </text>
                                        
                                        <g transform={`translate(${subPecaX + 48}, ${subPecaY - 18})`}>
                                          <circle r="6" fill={subStatusColor} />
                                          <text
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="8"
                                            fill="white"
                                            fontWeight="bold"
                                            style={{ pointerEvents: "none" }}
                                          >
                                            {subPeca.emEstoque === 0 ? "!" : subPeca.emEstoque}
                                          </text>
                                        </g>
                                      </g>
                                    );
                                  })}
                                </g>
                              );
                            })}
                          </>
                        )}
                      </svg>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas.length > 0 ? `${metricas[0].disponibilidade}%` : "0%"}
              </div>
              <Progress value={metricas.length > 0 ? metricas[0].disponibilidade : 0} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas.length > 0 ? `${metricas[0].performance}%` : "0%"}
              </div>
              <Progress value={metricas.length > 0 ? metricas[0].performance : 0} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">OEE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{oeeAtual}%</div>
              <Progress value={Number(oeeAtual)} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pecasStats.criticas + pecasStats.estoqueBaixo}</div>
              <p className="text-xs text-muted-foreground mt-2">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Legenda */}
        <Card>
          <CardHeader>
            <CardTitle>Legenda de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm">Atenção</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">Crítico</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Sistema */}
        <Dialog open={!!selectedSistema} onOpenChange={() => setSelectedSistema(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Detalhes do Sistema: {selectedSistema?.nome}
              </DialogTitle>
            </DialogHeader>
            
            {selectedSistema && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedSistema.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(selectedSistema.status)}>
                      {selectedSistema.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Peças</p>
                    <p className="font-medium">{selectedSistema.totalPecas}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Peças do Sistema</h3>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedMaquina(selectedSistema.id);
                        setSelectedSistema(null);
                        setEditingPeca(null);
                        setIsPecaModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Peça
                    </Button>
                  </div>
                  
                  {selectedSistema.pecas && selectedSistema.pecas.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSistema.pecas.map(peca => (
                        <Card key={peca.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getCategoriaIcon(peca.categoria)}</span>
                                <div>
                                  <p className="font-medium">{peca.nome}</p>
                                  <p className="text-sm text-muted-foreground">{peca.codigo}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <Badge variant={getStatusVariant(peca.status)}>
                                    {peca.status}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Estoque: {peca.emEstoque}/{peca.estoqueMinimo}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSistema(null);
                                      handleEditPeca(peca);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSistema(null);
                                      handleDeletePeca(peca.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {peca.subPecas && peca.subPecas.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-2">Sub-peças ({peca.subPecas.length})</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {peca.subPecas.map((sp: any) => (
                                    <div key={sp.id} className="text-xs p-2 bg-muted rounded">
                                      <p className="font-medium">{sp.nome}</p>
                                      <p className="text-muted-foreground">{sp.codigo}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma peça cadastrada neste sistema</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modais de Detalhes */}
        <AddSistemaModal
          open={isSistemaModalOpen}
          onOpenChange={setIsSistemaModalOpen}
          equipamentoId={id || ""}
          sistemas={sistemas}
          editingSistema={editingSistema}
          onSuccess={handleSistemaSuccess}
        />
        <AddPecaModal
          open={isPecaModalOpen}
          onOpenChange={setIsPecaModalOpen}
          equipamentoId={id || ""}
          sistemaId={selectedMaquina || ""}
          sistemas={sistemas}
          editingPeca={editingPeca}
          onSuccess={handlePecaSuccess}
        />
        {selectedPecaForSubPeca && (
          <AddSubPecaModal
            open={isSubPecaModalOpen}
            onOpenChange={setIsSubPecaModalOpen}
            equipamentoId={id || ""}
            sistemaId={selectedMaquina || ""}
            pecaId={selectedPecaForSubPeca}
            sistemas={sistemas}
            editingSubPeca={editingSubPeca}
            onSuccess={handleSubPecaSuccess}
          />
        )}
        <AddManutencaoModal
          open={isManutencaoModalOpen}
          onOpenChange={setIsManutencaoModalOpen}
          equipamentoId={id || ""}
          pecas={todasPecas}
          onSuccess={handleManutencaoSuccess}
        />
        <AddMetricaModal
          open={isMetricaModalOpen}
          onOpenChange={setIsMetricaModalOpen}
          equipamentoId={id || ""}
          onSuccess={handleMetricaSuccess}
        />

        {/* Tabs Principais */}
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="pecas">Gerenciar Peças</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          </TabsList>

          {/* Aba Gerenciar Peças */}
          <TabsContent value="pecas" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Peças</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pecasStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Peças Críticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{pecasStats.criticas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estoque Baixo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pecasStats.estoqueBaixo}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Manutenção Próxima</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pecasStats.proximaManutencao}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {pecasStats.custoTotal.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Mecânica">Mecânica</SelectItem>
                    <SelectItem value="Elétrica">Elétrica</SelectItem>
                    <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Atenção">Atenção</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPeca} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Peça
              </Button>
            </div>

            {pecasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {todasPecas.length === 0 
                    ? "Nenhuma peça cadastrada. Adicione sua primeira peça!" 
                    : "Nenhuma peça encontrada com os filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pecasFiltradas.map(peca => (
                  <PecaCard
                    key={peca.id}
                    peca={peca}
                    subPecas={todasSubPecas.filter(sp => sp.pecaPaiId === peca.id)}
                    onEdit={handleEditPeca}
                    onDelete={handleDeletePeca}
                    onAddSubPeca={handleAddSubPeca}
                    onEditSubPeca={handleEditSubPeca}
                    onDeleteSubPeca={handleDeleteSubPeca}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="historico" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Histórico de Manutenções</h3>
                <p className="text-sm text-muted-foreground">
                  Total: {manutencoesStats.total} | Preventivas: {manutencoesStats.preventivas} | Corretivas: {manutencoesStats.corretivas}
                </p>
              </div>
              <Button onClick={() => setIsManutencaoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Manutenção
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {manutencoesStats.custoTotal.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo Preventivas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {manutencoesStats.custoPreventivas.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo Corretivas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {manutencoesStats.custoCorretivas.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {loadingManutencoes ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : manutencoes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma manutenção registrada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {manutencoes.map(manutencao => (
                  <Card key={manutencao.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={manutencao.tipo === "Preventiva" ? "default" : "destructive"}>
                              {manutencao.tipo}
                            </Badge>
                            <span className="font-medium">{manutencao.tecnico}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{manutencao.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            R$ {manutencao.custo.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {manutencao.data?.toDate?.().toLocaleDateString('pt-BR') || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Desempenho */}
          <TabsContent value="desempenho" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Métricas de Performance</h3>
                <p className="text-sm text-muted-foreground">
                  OEE atual: {oeeAtual}%
                </p>
              </div>
              <Button onClick={() => setIsMetricaModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Métrica
              </Button>
            </div>

            {loadingMetricas ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : metricas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma métrica registrada.</p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Tendência de Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dadosDesempenho}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="disponibilidade" stroke="#10b981" name="Disponibilidade (%)" />
                        <Line type="monotone" dataKey="performance" stroke="#3b82f6" name="Performance (%)" />
                        <Line type="monotone" dataKey="qualidade" stroke="#8b5cf6" name="Qualidade (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custos de Manutenção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosCustos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="preventiva" fill="#10b981" name="Preventiva (R$)" />
                        <Bar dataKey="corretiva" fill="#ef4444" name="Corretiva (R$)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MaquinaDetalhes;
