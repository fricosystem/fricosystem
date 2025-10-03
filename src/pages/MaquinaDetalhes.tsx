import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize2, Layers, BoxSelect, AlertTriangle, TrendingUp, Package, History, Settings, Activity } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { doc, getDoc } from "firebase/firestore";
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

interface Peca {
  id: string;
  nome: string;
  x: number;
  y: number;
  conectadoCom: string[];
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
}

interface Maquina {
  id: string;
  nome: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
}

interface HistoricoManutencao {
  data: string;
  tipo: string;
  custo: number;
  tecnico: string;
  descricao: string;
}

const pecasFicticias: Peca[] = [
  {
    id: "motor",
    nome: "Motor Principal",
    x: 150,
    y: 100,
    conectadoCom: ["eixo", "bomba"],
    descricao: "Motor elétrico trifásico de 50HP",
    codigo: "MOT-001",
    status: "Normal",
    categoria: "Elétrica",
    vidaUtil: 10000,
    vidaUtilRestante: 8500,
    ultimaManutencao: "2025-08-15",
    proximaManutencao: "2025-11-15",
    custoManutencao: 1500,
    emEstoque: 1,
    estoqueMinimo: 1,
    fornecedor: "MotorTech LTDA",
    tempoCritico: 240,
  },
  {
    id: "eixo",
    nome: "Eixo de Transmissão",
    x: 400,
    y: 100,
    conectadoCom: ["motor", "engrenagem"],
    descricao: "Eixo de aço forjado com rolamentos de alta precisão",
    codigo: "EIX-002",
    status: "Normal",
    categoria: "Mecânica",
    vidaUtil: 15000,
    vidaUtilRestante: 12000,
    ultimaManutencao: "2025-07-20",
    proximaManutencao: "2025-12-20",
    custoManutencao: 800,
    emEstoque: 2,
    estoqueMinimo: 1,
    fornecedor: "Mecânica Industrial",
    tempoCritico: 180,
  },
  {
    id: "engrenagem",
    nome: "Conjunto de Engrenagens",
    x: 650,
    y: 100,
    conectadoCom: ["eixo", "redutor"],
    descricao: "Sistema de engrenagens helicoidais",
    codigo: "ENG-003",
    status: "Atenção",
    categoria: "Mecânica",
    vidaUtil: 12000,
    vidaUtilRestante: 3000,
    ultimaManutencao: "2025-06-10",
    proximaManutencao: "2025-10-15",
    custoManutencao: 2200,
    emEstoque: 0,
    estoqueMinimo: 1,
    fornecedor: "Engrenagens Premium",
    tempoCritico: 96,
  },
  {
    id: "redutor",
    nome: "Redutor de Velocidade",
    x: 650,
    y: 250,
    conectadoCom: ["engrenagem", "saida"],
    descricao: "Redutor planetário com relação 1:10",
    codigo: "RED-004",
    status: "Normal",
    categoria: "Mecânica",
    vidaUtil: 20000,
    vidaUtilRestante: 18000,
    ultimaManutencao: "2025-09-01",
    proximaManutencao: "2026-02-01",
    custoManutencao: 3500,
    emEstoque: 1,
    estoqueMinimo: 1,
    fornecedor: "Redutores S.A.",
    tempoCritico: 360,
  },
  {
    id: "bomba",
    nome: "Bomba Hidráulica",
    x: 150,
    y: 250,
    conectadoCom: ["motor", "valvula"],
    descricao: "Bomba centrífuga de alta vazão",
    codigo: "BOM-005",
    status: "Normal",
    categoria: "Hidráulica",
    vidaUtil: 8000,
    vidaUtilRestante: 6500,
    ultimaManutencao: "2025-08-20",
    proximaManutencao: "2025-11-20",
    custoManutencao: 1200,
    emEstoque: 1,
    estoqueMinimo: 1,
    fornecedor: "Hidráulica Pro",
    tempoCritico: 120,
  },
  {
    id: "valvula",
    nome: "Válvula de Controle",
    x: 400,
    y: 250,
    conectadoCom: ["bomba", "tanque"],
    descricao: "Válvula proporcional eletrônica",
    codigo: "VAL-006",
    status: "Crítico",
    categoria: "Hidráulica",
    vidaUtil: 5000,
    vidaUtilRestante: 500,
    ultimaManutencao: "2025-05-15",
    proximaManutencao: "2025-10-10",
    custoManutencao: 950,
    emEstoque: 0,
    estoqueMinimo: 2,
    fornecedor: "Válvulas Tech",
    tempoCritico: 48,
  },
  {
    id: "tanque",
    nome: "Tanque Reservatório",
    x: 400,
    y: 400,
    conectadoCom: ["valvula"],
    descricao: "Tanque de 200L em aço inox",
    codigo: "TAN-007",
    status: "Normal",
    categoria: "Hidráulica",
    vidaUtil: 25000,
    vidaUtilRestante: 23000,
    ultimaManutencao: "2025-09-10",
    proximaManutencao: "2026-03-10",
    custoManutencao: 600,
    emEstoque: 1,
    estoqueMinimo: 1,
    fornecedor: "Tanques Industriais",
    tempoCritico: 480,
  },
  {
    id: "saida",
    nome: "Eixo de Saída",
    x: 650,
    y: 400,
    conectadoCom: ["redutor"],
    descricao: "Eixo principal de saída com acoplamento",
    codigo: "SAI-008",
    status: "Normal",
    categoria: "Mecânica",
    vidaUtil: 15000,
    vidaUtilRestante: 13500,
    ultimaManutencao: "2025-08-25",
    proximaManutencao: "2026-01-25",
    custoManutencao: 750,
    emEstoque: 2,
    estoqueMinimo: 1,
    fornecedor: "Mecânica Industrial",
    tempoCritico: 200,
  },
];

const historicoManutencoes: HistoricoManutencao[] = [
  { data: "2025-09-15", tipo: "Preventiva", custo: 1500, tecnico: "João Silva", descricao: "Manutenção preventiva motor principal" },
  { data: "2025-08-20", tipo: "Corretiva", custo: 2200, tecnico: "Maria Santos", descricao: "Substituição de engrenagens" },
  { data: "2025-07-10", tipo: "Preventiva", custo: 800, tecnico: "João Silva", descricao: "Lubrificação geral" },
  { data: "2025-06-05", tipo: "Corretiva", custo: 950, tecnico: "Pedro Costa", descricao: "Reparo válvula de controle" },
  { data: "2025-05-15", tipo: "Preventiva", custo: 1200, tecnico: "Maria Santos", descricao: "Manutenção bomba hidráulica" },
];

const dadosDesempenho = [
  { mes: "Mai", disponibilidade: 95, performance: 88, qualidade: 97 },
  { mes: "Jun", disponibilidade: 92, performance: 85, qualidade: 96 },
  { mes: "Jul", disponibilidade: 94, performance: 90, qualidade: 98 },
  { mes: "Ago", disponibilidade: 96, performance: 92, qualidade: 97 },
  { mes: "Set", disponibilidade: 93, performance: 87, qualidade: 95 },
  { mes: "Out", disponibilidade: 95, performance: 91, qualidade: 98 },
];

const dadosCustos = [
  { mes: "Mai", preventiva: 1200, corretiva: 800 },
  { mes: "Jun", preventiva: 950, corretiva: 1500 },
  { mes: "Jul", preventiva: 800, corretiva: 0 },
  { mes: "Ago", preventiva: 2200, corretiva: 1200 },
  { mes: "Set", preventiva: 1500, corretiva: 0 },
  { mes: "Out", preventiva: 1000, corretiva: 950 },
];

const MaquinaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
  const [modoExplodido, setModoExplodido] = useState(false);
  const [camadasVisiveis, setCamadasVisiveis] = useState<string[]>(["Mecânica", "Elétrica", "Hidráulica"]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchMaquina = async () => {
      if (!id) return;
      
      try {
        const maquinaDoc = await getDoc(doc(db, "maquinas", id));
        if (maquinaDoc.exists()) {
          setMaquina({ id: maquinaDoc.id, ...maquinaDoc.data() } as Maquina);
        } else {
          toast({
            title: "Erro",
            description: "Máquina não encontrada.",
            variant: "destructive",
          });
          navigate("/maquinas");
        }
      } catch (error) {
        console.error("Erro ao buscar máquina:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da máquina.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaquina();
  }, [id, navigate, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-green-500";
      case "Atenção":
        return "bg-yellow-500";
      case "Crítico":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Crítico":
        return "destructive";
      case "Atenção":
        return "secondary";
      default:
        return "default";
    }
  };

  const toggleCamada = (camada: string) => {
    setCamadasVisiveis(prev =>
      prev.includes(camada)
        ? prev.filter(c => c !== camada)
        : [...prev, camada]
    );
  };

  // Memoiza a filtragem de peças por camada
  const pecasPorCamada = useMemo(() => {
    return pecasFicticias.filter(peca => camadasVisiveis.includes(peca.categoria));
  }, [camadasVisiveis]);

  // Memoiza as posições explodidas
  const posicoesExplodidas = useMemo(() => {
    if (!modoExplodido) return null;
    
    const centerX = 400;
    const centerY = 250;
    
    return pecasPorCamada.reduce((acc, peca) => {
      const offsetX = (peca.x - centerX) * 0.8;
      const offsetY = (peca.y - centerY) * 0.8;
      acc[peca.id] = {
        x: peca.x + offsetX,
        y: peca.y + offsetY
      };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
  }, [modoExplodido, pecasPorCamada]);

  const getPosicaoExplodida = (peca: Peca) => {
    if (!modoExplodido || !posicoesExplodidas) return { x: peca.x, y: peca.y };
    return posicoesExplodidas[peca.id] || { x: peca.x, y: peca.y };
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case "Mecânica":
        return "⚙️";
      case "Elétrica":
        return "⚡";
      case "Hidráulica":
        return "💧";
      default:
        return "🔧";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Crítico":
        return "⚠️";
      case "Atenção":
        return "⚠";
      case "Normal":
        return "✓";
      default:
        return "";
    }
  };

  const pecasExibiveis = pecasPorCamada;

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

  return (
    <AppLayout title={`Detalhes - ${maquina.nome}`}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/maquinas")}
          >
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

        {/* Indicadores de Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Disponibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <Progress value={95} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">91%</div>
              <Progress value={91} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-yellow-500" />
                OEE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86%</div>
              <Progress value={86} className="mt-2" />
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
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-2">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Controles e Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={modoExplodido ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoExplodido(!modoExplodido)}
                >
                  <BoxSelect className="h-4 w-4 mr-2" />
                  Modo Explodido
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Camadas:</span>
                <Button
                  variant={camadasVisiveis.includes("Mecânica") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCamada("Mecânica")}
                >
                  Mecânica
                </Button>
                <Button
                  variant={camadasVisiveis.includes("Elétrica") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCamada("Elétrica")}
                >
                  Elétrica
                </Button>
                <Button
                  variant={camadasVisiveis.includes("Hidráulica") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCamada("Hidráulica")}
                >
                  Hidráulica
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapa de Peças */}
        <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Diagrama de Componentes</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="p-0 relative">
            <div className={`bg-slate-950 ${isFullscreen ? "h-[calc(100vh-80px)]" : "h-[600px]"}`}>
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border">
                      <Button size="sm" variant="ghost" onClick={() => zoomIn()}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => zoomOut()}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resetTransform()}>
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                    <TransformComponent wrapperStyle={{ width: "100%", height: isFullscreen ? "calc(100vh - 80px)" : "600px" }}>
                      <svg width="900" height="600" className="bg-background">
                        <defs>
                          {/* Gradiente moderno para as conexões */}
                          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.6 }} />
                            <stop offset="50%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.8 }} />
                            <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.6 }} />
                          </linearGradient>
                          
                          {/* Gradiente para fundo do card */}
                          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "hsl(var(--card))", stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: "hsl(var(--muted))", stopOpacity: 0.3 }} />
                          </linearGradient>
                          
                          {/* Glow effect para conexões */}
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          
                          {/* Sombra moderna e suave para os cards */}
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                            <feOffset dx="0" dy="4" result="offsetblur"/>
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Linhas de conexão com curvas suaves */}
                        {pecasExibiveis.map((peca) =>
                          peca.conectadoCom.map((conectadoId) => {
                            const pecaConectada = pecasFicticias.find(
                              (p) => p.id === conectadoId
                            );
                            if (!pecaConectada || !camadasVisiveis.includes(pecaConectada.categoria)) return null;
                            
                            const posOrigem = getPosicaoExplodida(peca);
                            const posDestino = getPosicaoExplodida(pecaConectada);
                            
                            // Criar path curvo entre os blocos
                            const midX = (posOrigem.x + posDestino.x) / 2;
                            const midY = (posOrigem.y + posDestino.y) / 2;
                            const controlX = midX;
                            const controlY = midY + (posDestino.y > posOrigem.y ? -30 : 30);
                            
                            return (
                              <g key={`${peca.id}-${conectadoId}`}>
                                {/* Linha de base com glow */}
                                <path
                                  d={`M ${posOrigem.x + 70} ${posOrigem.y} Q ${controlX} ${controlY} ${posDestino.x - 70} ${posDestino.y}`}
                                  stroke="url(#connectionGradient)"
                                  strokeWidth="3"
                                  fill="none"
                                  opacity={modoExplodido ? 0.4 : 0.7}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  filter="url(#glow)"
                                />
                                {/* Linha secundária mais fina para profundidade */}
                                <path
                                  d={`M ${posOrigem.x + 70} ${posOrigem.y} Q ${controlX} ${controlY} ${posDestino.x - 70} ${posDestino.y}`}
                                  stroke="hsl(var(--primary))"
                                  strokeWidth="1.5"
                                  fill="none"
                                  opacity={modoExplodido ? 0.6 : 0.9}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* Seta moderna no final */}
                                <polygon
                                  points={`${posDestino.x - 70},${posDestino.y} ${posDestino.x - 80},${posDestino.y - 5} ${posDestino.x - 80},${posDestino.y + 5}`}
                                  fill="hsl(var(--primary))"
                                  opacity={modoExplodido ? 0.6 : 0.9}
                                  filter="url(#glow)"
                                />
                              </g>
                            );
                          })
                        )}

                        {/* Blocos de peças estilo flowchart */}
                        {pecasExibiveis.map((peca) => {
                          const pos = getPosicaoExplodida(peca);
                          const statusColor = peca.status === "Crítico" ? "#ef4444" : 
                                            peca.status === "Atenção" ? "#f59e0b" : "#10b981";
                          
                          return (
                            <g
                              key={peca.id}
                              onClick={() => setSelectedPeca(peca)}
                              style={{ cursor: "pointer" }}
                              className="transition-all hover:opacity-95"
                              filter="url(#shadow)"
                            >
                              {/* Camada de fundo para profundidade */}
                              <rect
                                x={pos.x - 69}
                                y={pos.y - 33}
                                width="138"
                                height="68"
                                rx="16"
                                ry="16"
                                fill="hsl(var(--primary))"
                                opacity="0.05"
                              />
                              
                              {/* Bloco principal com gradiente */}
                              <rect
                                x={pos.x - 70}
                                y={pos.y - 35}
                                width="140"
                                height="70"
                                rx="16"
                                ry="16"
                                fill="url(#cardGradient)"
                                stroke="hsl(var(--border))"
                                strokeWidth="1.5"
                                className="transition-all"
                              />
                              
                              {/* Brilho sutil no topo */}
                              <rect
                                x={pos.x - 68}
                                y={pos.y - 33}
                                width="136"
                                height="20"
                                rx="16"
                                ry="16"
                                fill="hsl(var(--primary))"
                                opacity="0.03"
                              />
                              
                              {/* Barra de status moderna no topo */}
                              <rect
                                x={pos.x - 70}
                                y={pos.y - 35}
                                width="140"
                                height="6"
                                rx="16"
                                ry="16"
                                fill={statusColor}
                                opacity="0.9"
                              />
                              
                              {/* Linha de destaque sutil na lateral */}
                              <rect
                                x={pos.x - 70}
                                y={pos.y - 30}
                                width="3"
                                height="60"
                                rx="2"
                                ry="2"
                                fill={statusColor}
                                opacity="0.4"
                              />

                              {/* Ícone de categoria */}
                              <text
                                x={pos.x - 55}
                                y={pos.y - 8}
                                fontSize="20"
                                style={{ pointerEvents: "none" }}
                              >
                                {getCategoriaIcon(peca.categoria)}
                              </text>

                              {/* Código da peça */}
                              <text
                                x={pos.x - 25}
                                y={pos.y - 12}
                                textAnchor="start"
                                className="text-xs font-bold fill-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {peca.codigo}
                              </text>

                              {/* Nome da peça */}
                              <text
                                x={pos.x}
                                y={pos.y + 8}
                                textAnchor="middle"
                                className="text-[10px] fill-muted-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {peca.nome.length > 20 ? peca.nome.substring(0, 18) + '...' : peca.nome}
                              </text>

                              {/* Badge de status */}
                              <g transform={`translate(${pos.x + 40}, ${pos.y - 8})`}>
                                <circle
                                  r="10"
                                  fill={statusColor}
                                  opacity="0.9"
                                />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="10"
                                  fill="white"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {getStatusIcon(peca.status)}
                                </text>
                              </g>

                              {/* Indicador de estoque baixo */}
                              {peca.emEstoque <= peca.estoqueMinimo && (
                                <g transform={`translate(${pos.x + 55}, ${pos.y + 15})`}>
                                  <circle
                                    r="8"
                                    fill="#f59e0b"
                                    opacity="0.9"
                                  />
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

                              {/* Barra de vida útil */}
                              <g transform={`translate(${pos.x - 60}, ${pos.y + 20})`}>
                                <rect
                                  width="120"
                                  height="4"
                                  rx="2"
                                  fill="hsl(var(--muted))"
                                />
                                <rect
                                  width={120 * (peca.vidaUtilRestante / peca.vidaUtil)}
                                  height="4"
                                  rx="2"
                                  fill={peca.vidaUtilRestante / peca.vidaUtil > 0.5 ? "#10b981" : 
                                       peca.vidaUtilRestante / peca.vidaUtil > 0.3 ? "#f59e0b" : "#ef4444"}
                                />
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </CardContent>
        </Card>

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

        {/* Modal de Detalhes da Peça */}
        <Dialog open={!!selectedPeca} onOpenChange={() => setSelectedPeca(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPeca?.nome}
                <Badge variant={getStatusVariant(selectedPeca?.status || "Normal")}>
                  {selectedPeca?.status}
                </Badge>
                <Badge variant="outline">{selectedPeca?.categoria}</Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedPeca && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
                  <TabsTrigger value="estoque">Estoque</TabsTrigger>
                  <TabsTrigger value="graficos">Gráficos</TabsTrigger>
                </TabsList>

                {/* Aba Informações */}
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Código
                      </h4>
                      <p className="text-lg">{selectedPeca.codigo}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Categoria
                      </h4>
                      <p className="text-lg">{selectedPeca.categoria}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Descrição
                    </h4>
                    <p>{selectedPeca.descricao}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      Vida Útil
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Restante: {selectedPeca.vidaUtilRestante}h</span>
                        <span>Total: {selectedPeca.vidaUtil}h</span>
                      </div>
                      <Progress 
                        value={(selectedPeca.vidaUtilRestante / selectedPeca.vidaUtil) * 100} 
                        className="h-2"
                      />
                      {selectedPeca.vidaUtilRestante / selectedPeca.vidaUtil < 0.3 && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Atenção: Vida útil em {Math.round((selectedPeca.vidaUtilRestante / selectedPeca.vidaUtil) * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Conectado com
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPeca.conectadoCom.map((conectadoId) => {
                        const pecaConectada = pecasFicticias.find(
                          (p) => p.id === conectadoId
                        );
                        return (
                          <Badge
                            key={conectadoId}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => setSelectedPeca(pecaConectada || null)}
                          >
                            {pecaConectada?.nome}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba Manutenção */}
                <TabsContent value="manutencao" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Última Manutenção</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {new Date(selectedPeca.ultimaManutencao).toLocaleDateString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Próxima Manutenção</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {new Date(selectedPeca.proximaManutencao).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Em {selectedPeca.tempoCritico} horas
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custo de Manutenção</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        R$ {selectedPeca.custoManutencao.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor médio por manutenção
                      </p>
                    </CardContent>
                  </Card>

                  {selectedPeca.status === "Crítico" && (
                    <Card className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-sm text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Alerta de Manutenção Preditiva
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          Esta peça está em estado crítico e requer manutenção imediata. 
                          Tempo estimado até falha: {selectedPeca.tempoCritico} horas.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Aba Estoque */}
                <TabsContent value="estoque" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Em Estoque
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedPeca.emEstoque} un</p>
                        {selectedPeca.emEstoque <= selectedPeca.estoqueMinimo && (
                          <Badge variant="destructive" className="mt-2">
                            Estoque baixo
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Estoque Mínimo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedPeca.estoqueMinimo} un</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Fornecedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{selectedPeca.fornecedor}</p>
                    </CardContent>
                  </Card>

                  {selectedPeca.emEstoque < selectedPeca.estoqueMinimo && (
                    <Card className="border-yellow-500">
                      <CardHeader>
                        <CardTitle className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Sugestão de Compra
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">
                          Recomendamos a compra de {selectedPeca.estoqueMinimo * 2} unidades para manter o estoque adequado.
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-medium">Quantidade sugerida:</span>
                          <span className="text-lg font-bold">{selectedPeca.estoqueMinimo * 2} un</span>
                        </div>
                        <Button className="w-full mt-2">
                          Gerar Requisição de Compra
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Aba Gráficos */}
                <TabsContent value="graficos" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Histórico de Vida Útil</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={[
                          { mes: "Mai", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante + 500 },
                          { mes: "Jun", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante + 400 },
                          { mes: "Jul", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante + 300 },
                          { mes: "Ago", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante + 200 },
                          { mes: "Set", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante + 100 },
                          { mes: "Out", vidaUtil: selectedPeca.vidaUtil, restante: selectedPeca.vidaUtilRestante },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="vidaUtil" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Vida Útil Total" />
                          <Line type="monotone" dataKey="restante" stroke="hsl(var(--primary))" name="Vida Útil Restante" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custos de Manutenção (últimos 6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { mes: "Mai", custo: selectedPeca.custoManutencao * 0.8 },
                          { mes: "Jun", custo: selectedPeca.custoManutencao * 1.1 },
                          { mes: "Jul", custo: 0 },
                          { mes: "Ago", custo: selectedPeca.custoManutencao * 1.2 },
                          { mes: "Set", custo: selectedPeca.custoManutencao },
                          { mes: "Out", custo: selectedPeca.custoManutencao * 0.9 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="custo" fill="hsl(var(--primary))" name="Custo (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default MaquinaDetalhes;
