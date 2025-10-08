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

interface SubPeca {
  id: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  pecaPaiId: string;
}

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
  valorUnitario: number;
  dataUltimaCompra: string;
  subPecas: string[];
  maquinaId: string;
}

interface MaquinaComponente {
  id: string;
  nome: string;
  x: number;
  y: number;
  tipo: string;
  status: "Normal" | "Atenção" | "Crítico";
  totalPecas: number;
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

const maquinasComponentes: MaquinaComponente[] = [
  {
    id: "maq1",
    nome: "Sistema Principal",
    x: 120,
    y: 150,
    tipo: "Mecânico-Elétrico",
    status: "Normal",
    totalPecas: 4,
  },
  {
    id: "maq2",
    nome: "Sistema Hidráulico",
    x: 120,
    y: 300,
    tipo: "Hidráulico",
    status: "Atenção",
    totalPecas: 3,
  },
  {
    id: "maq3",
    nome: "Sistema de Transmissão",
    x: 120,
    y: 450,
    tipo: "Mecânico",
    status: "Crítico",
    totalPecas: 2,
  },
];

const pecasFicticias: Peca[] = [
  {
    id: "motor",
    nome: "Motor Principal",
    x: 400,
    y: 100,
    conectadoCom: [],
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
    valorUnitario: 15000,
    dataUltimaCompra: "2024-06-20",
    subPecas: ["motor-bobina", "motor-rotor"],
    maquinaId: "maq1",
  },
  {
    id: "eixo",
    nome: "Eixo de Transmissão",
    x: 550,
    y: 100,
    conectadoCom: [],
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
    valorUnitario: 4500,
    dataUltimaCompra: "2024-08-10",
    subPecas: ["eixo-rolamento-a", "eixo-rolamento-b"],
    maquinaId: "maq1",
  },
  {
    id: "engrenagem",
    nome: "Conjunto de Engrenagens",
    x: 700,
    y: 100,
    conectadoCom: [],
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
    valorUnitario: 8700,
    dataUltimaCompra: "2024-03-15",
    subPecas: ["eng-primaria", "eng-secundaria", "eng-terciaria"],
    maquinaId: "maq1",
  },
  {
    id: "redutor",
    nome: "Redutor de Velocidade",
    x: 400,
    y: 200,
    conectadoCom: [],
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
    valorUnitario: 12300,
    dataUltimaCompra: "2024-05-22",
    subPecas: ["red-engrenagem-planetaria"],
    maquinaId: "maq1",
  },
  {
    id: "bomba",
    nome: "Bomba Hidráulica",
    x: 400,
    y: 280,
    conectadoCom: [],
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
    valorUnitario: 6800,
    dataUltimaCompra: "2024-07-08",
    subPecas: ["bomba-rotor", "bomba-vedacao"],
    maquinaId: "maq2",
  },
  {
    id: "valvula",
    nome: "Válvula de Controle",
    x: 550,
    y: 280,
    conectadoCom: [],
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
    valorUnitario: 3200,
    dataUltimaCompra: "2024-02-18",
    subPecas: ["valv-solenoide", "valv-corpo"],
    maquinaId: "maq2",
  },
  {
    id: "tanque",
    nome: "Tanque Reservatório",
    x: 700,
    y: 280,
    conectadoCom: [],
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
    valorUnitario: 5400,
    dataUltimaCompra: "2024-04-25",
    subPecas: [],
    maquinaId: "maq2",
  },
  {
    id: "acoplamento",
    nome: "Acoplamento Flexível",
    x: 400,
    y: 440,
    conectadoCom: [],
    descricao: "Acoplamento de alto torque",
    codigo: "ACP-009",
    status: "Normal",
    categoria: "Mecânica",
    vidaUtil: 18000,
    vidaUtilRestante: 16500,
    ultimaManutencao: "2025-08-01",
    proximaManutencao: "2026-01-01",
    custoManutencao: 650,
    emEstoque: 2,
    estoqueMinimo: 1,
    fornecedor: "Mecânica Industrial",
    tempoCritico: 220,
    valorUnitario: 2800,
    dataUltimaCompra: "2024-06-12",
    subPecas: ["acp-elemento-elastico"],
    maquinaId: "maq3",
  },
  {
    id: "correia",
    nome: "Correia Transportadora",
    x: 550,
    y: 440,
    conectadoCom: [],
    descricao: "Correia de alta resistência",
    codigo: "COR-010",
    status: "Atenção",
    categoria: "Mecânica",
    vidaUtil: 6000,
    vidaUtilRestante: 1500,
    ultimaManutencao: "2025-07-05",
    proximaManutencao: "2025-10-25",
    custoManutencao: 450,
    emEstoque: 1,
    estoqueMinimo: 2,
    fornecedor: "Correias Express",
    tempoCritico: 85,
    valorUnitario: 1900,
    dataUltimaCompra: "2024-09-03",
    subPecas: [],
    maquinaId: "maq3",
  },
];

const subPecasFicticias: SubPeca[] = [
  // Sub-peças do Motor
  { id: "motor-bobina", nome: "Bobina Principal", codigo: "MOT-001-A", status: "Normal", emEstoque: 2, pecaPaiId: "motor" },
  { id: "motor-rotor", nome: "Rotor", codigo: "MOT-001-B", status: "Normal", emEstoque: 1, pecaPaiId: "motor" },
  { id: "motor-estator", nome: "Estator", codigo: "MOT-001-C", status: "Atenção", emEstoque: 1, pecaPaiId: "motor" },
  
  // Sub-peças do Eixo
  { id: "eixo-rolamento-a", nome: "Rolamento Frontal", codigo: "EIX-002-A", status: "Normal", emEstoque: 3, pecaPaiId: "eixo" },
  { id: "eixo-rolamento-b", nome: "Rolamento Traseiro", codigo: "EIX-002-B", status: "Normal", emEstoque: 3, pecaPaiId: "eixo" },
  { id: "eixo-retentor", nome: "Retentor", codigo: "EIX-002-C", status: "Normal", emEstoque: 5, pecaPaiId: "eixo" },
  
  // Sub-peças das Engrenagens
  { id: "eng-primaria", nome: "Engrenagem Primária", codigo: "ENG-003-A", status: "Atenção", emEstoque: 1, pecaPaiId: "engrenagem" },
  { id: "eng-secundaria", nome: "Engrenagem Secundária", codigo: "ENG-003-B", status: "Normal", emEstoque: 2, pecaPaiId: "engrenagem" },
  { id: "eng-terciaria", nome: "Engrenagem Terciária", codigo: "ENG-003-C", status: "Crítico", emEstoque: 0, pecaPaiId: "engrenagem" },
  
  // Sub-peças do Redutor
  { id: "red-engrenagem-planetaria", nome: "Engrenagem Planetária", codigo: "RED-004-A", status: "Normal", emEstoque: 2, pecaPaiId: "redutor" },
  { id: "red-coroa", nome: "Coroa Dentada", codigo: "RED-004-B", status: "Normal", emEstoque: 1, pecaPaiId: "redutor" },
  
  // Sub-peças da Bomba
  { id: "bomba-rotor", nome: "Rotor da Bomba", codigo: "BOM-005-A", status: "Normal", emEstoque: 2, pecaPaiId: "bomba" },
  { id: "bomba-vedacao", nome: "Vedação Mecânica", codigo: "BOM-005-B", status: "Atenção", emEstoque: 1, pecaPaiId: "bomba" },
  { id: "bomba-impulsor", nome: "Impulsor", codigo: "BOM-005-C", status: "Normal", emEstoque: 2, pecaPaiId: "bomba" },
  
  // Sub-peças da Válvula
  { id: "valv-solenoide", nome: "Solenoide", codigo: "VAL-006-A", status: "Crítico", emEstoque: 0, pecaPaiId: "valvula" },
  { id: "valv-corpo", nome: "Corpo da Válvula", codigo: "VAL-006-B", status: "Normal", emEstoque: 1, pecaPaiId: "valvula" },
  { id: "valv-carretel", nome: "Carretel", codigo: "VAL-006-C", status: "Atenção", emEstoque: 1, pecaPaiId: "valvula" },
  
  // Sub-peças do Acoplamento
  { id: "acp-elemento-elastico", nome: "Elemento Elástico", codigo: "ACP-009-A", status: "Normal", emEstoque: 3, pecaPaiId: "acoplamento" },
  { id: "acp-flanges", nome: "Flanges", codigo: "ACP-009-B", status: "Normal", emEstoque: 2, pecaPaiId: "acoplamento" },
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
  const [selectedSubPeca, setSelectedSubPeca] = useState<SubPeca | null>(null);
  const [selectedSistema, setSelectedSistema] = useState<MaquinaComponente | null>(null);
  const [selectedMaquina, setSelectedMaquina] = useState<string | null>(null);
  const [expandedPecaId, setExpandedPecaId] = useState<string | null>(null);
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

  // Memoiza a filtragem de peças por camada e máquina
  const pecasPorCamada = useMemo(() => {
    if (!selectedMaquina) return [];
    return pecasFicticias.filter(peca => 
      camadasVisiveis.includes(peca.categoria) && peca.maquinaId === selectedMaquina
    );
  }, [camadasVisiveis, selectedMaquina]);

  // Memoiza as posições explodidas ou em coluna vertical
  const posicoesExplodidas = useMemo(() => {
    if (!selectedMaquina && !modoExplodido) return null;
    
    if (modoExplodido) {
      const centerX = 550;
      const centerY = 300;
      
      return pecasPorCamada.reduce((acc, peca) => {
        const offsetX = (peca.x - centerX) * 0.3;
        const offsetY = (peca.y - centerY) * 0.3;
        acc[peca.id] = {
          x: peca.x + offsetX,
          y: peca.y + offsetY
        };
        return acc;
      }, {} as Record<string, { x: number; y: number }>);
    }
    
    // Posições em coluna vertical no lado direito
    const startX = 500;
    const startY = 80;
    const spacing = 100;
    
    return pecasPorCamada.reduce((acc, peca, index) => {
      acc[peca.id] = {
        x: startX,
        y: startY + (index * spacing)
      };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
  }, [modoExplodido, pecasPorCamada, selectedMaquina]);

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
  
  const handleMaquinaClick = (maquinaId: string) => {
    setSelectedMaquina(maquinaId);
  };

  const handleSistemaInfo = (sistema: MaquinaComponente, e: React.MouseEvent) => {
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

        {/* Mapa de Peças */}
        <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <CardTitle>Diagrama de Componentes</CardTitle>
              
              {selectedMaquina && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoltar}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  
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
                </>
              )}
            </div>
            
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
                          {/* Sombra suave para os cards */}
                          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.15"/>
                            </feComponentTransfer>
                            <feMerge> 
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Renderizar Máquinas no lado esquerdo sempre */}
                        {maquinasComponentes.map((maquina) => {
                          const statusColor = maquina.status === "Crítico" ? "#ef4444" : 
                                            maquina.status === "Atenção" ? "#f59e0b" : "#10b981";
                          const isSelected = selectedMaquina === maquina.id;
                          
                          return (
                            <g
                              key={maquina.id}
                              style={{ cursor: "pointer" }}
                              className="transition-all hover:opacity-90"
                              filter="url(#cardShadow)"
                            >
                              {/* Card principal */}
                              <rect
                                x={maquina.x - 85}
                                y={maquina.y - 50}
                                width="170"
                                height="100"
                                rx="8"
                                ry="8"
                                fill="hsl(var(--card))"
                                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="transition-all"
                                onClick={() => handleMaquinaClick(maquina.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  handleSistemaInfo(maquina, e as any);
                                }}
                              />
                              
                              {/* Barra de status no topo */}
                              <rect
                                x={maquina.x - 85}
                                y={maquina.y - 50}
                                width="170"
                                height="4"
                                rx="8"
                                ry="8"
                                fill={statusColor}
                              />

                              {/* Nome da máquina */}
                              <text
                                x={maquina.x}
                                y={maquina.y - 15}
                                textAnchor="middle"
                                className="text-sm font-bold fill-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {maquina.nome}
                              </text>

                              {/* Tipo */}
                              <text
                                x={maquina.x}
                                y={maquina.y + 5}
                                textAnchor="middle"
                                className="text-xs fill-muted-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {maquina.tipo}
                              </text>

                              {/* Total de peças */}
                              <text
                                x={maquina.x}
                                y={maquina.y + 25}
                                textAnchor="middle"
                                className="text-xs fill-muted-foreground"
                                style={{ pointerEvents: "none" }}
                              >
                                {maquina.totalPecas} peças
                              </text>

                              {/* Ícone de status no canto superior direito */}
                              <g transform={`translate(${maquina.x + 70}, ${maquina.y - 35})`}>
                                <circle
                                  r="10"
                                  fill={statusColor}
                                />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="10"
                                  fill="white"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {maquina.status === "Crítico" ? "!" : maquina.status === "Atenção" ? "!" : "✓"}
                                </text>
                              </g>
                            </g>
                          );
                        })}

                        {/* Renderizar peças no lado direito quando uma máquina for selecionada */}
                        {selectedMaquina && (
                          <>
                            {/* Linhas de conexão da máquina selecionada para cada peça */}
                            {pecasExibiveis.map((peca, index) => {
                              const maquinaSelecionada = maquinasComponentes.find(m => m.id === selectedMaquina);
                              const centerX = maquinaSelecionada?.x || 120;
                              const centerY = maquinaSelecionada?.y || 300;
                              
                              const startX = 400;
                              const startY = 80;
                              const spacing = 100;
                              const pecaX = startX;
                              const pecaY = startY + (index * spacing);
                              
                              // Ponto de saída do card da máquina (lado direito)
                              const startPointX = centerX + 85;
                              const startPointY = centerY;
                              
                              // Ponto de entrada do card da peça (lado esquerdo)
                              const endPointX = pecaX - 70;
                              const endPointY = pecaY;
                              
                              // Criar curva bezier suave
                              const controlX1 = startPointX + 80;
                              const controlX2 = endPointX - 80;
                              
                              return (
                                <g key={`conn-${peca.id}`}>
                                  {/* Linha de conexão */}
                                  <path
                                    d={`M ${startPointX} ${startPointY} C ${controlX1} ${startPointY}, ${controlX2} ${endPointY}, ${endPointX} ${endPointY}`}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="2"
                                    fill="none"
                                    opacity={0.5}
                                    strokeLinecap="round"
                                  />
                                  {/* Seta apontando para a peça */}
                                  <polygon
                                    points={`${endPointX},${endPointY} ${endPointX - 6},${endPointY - 4} ${endPointX - 6},${endPointY + 4}`}
                                    fill="hsl(var(--primary))"
                                    opacity={0.7}
                                  />
                                </g>
                              );
                            })}
                            
                            {/* Linhas de conexão para subpeças se uma peça estiver expandida */}
                            {expandedPecaId && subPecasFicticias
                              .filter(sp => sp.pecaPaiId === expandedPecaId)
                              .map((subPeca, subIndex) => {
                                const pecaIndex = pecasExibiveis.findIndex(p => p.id === expandedPecaId);
                                const startX = 400;
                                const startY = 80;
                                const spacing = 100;
                                const pecaX = startX;
                                const pecaY = startY + (pecaIndex * spacing);
                                
                                const subStartX = 650;
                                const subSpacing = 70;
                                const subPecaX = subStartX;
                                const subPecaY = pecaY - 30 + (subIndex * subSpacing);
                                
                                // Ponto de saída da peça (lado direito)
                                const startPointX = pecaX + 70;
                                const startPointY = pecaY;
                                
                                // Ponto de entrada da subpeça (lado esquerdo)
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
                                    {/* Seta apontando para a subpeça */}
                                    <polygon
                                      points={`${endPointX},${endPointY} ${endPointX - 5},${endPointY - 3} ${endPointX - 5},${endPointY + 3}`}
                                      fill="hsl(var(--primary))"
                                      opacity={0.6}
                                    />
                                  </g>
                                );
                              })}

                            {/* Blocos de peças em coluna vertical */}
                            {pecasExibiveis.map((peca, index) => {
                              const startX = 400;
                              const startY = 80;
                              const spacing = 100;
                              const pecaX = startX;
                              const pecaY = startY + (index * spacing);
                              
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
                                    {/* Card principal */}
                                    <rect
                                      x={pecaX - 70}
                                      y={pecaY - 35}
                                      width="140"
                                      height="70"
                                      rx="8"
                                      ry="8"
                                      fill="hsl(var(--card))"
                                      stroke={isExpanded ? "hsl(var(--primary))" : "hsl(var(--border))"}
                                      strokeWidth={isExpanded ? "2" : "1"}
                                      className="transition-all"
                                      onClick={() => handlePecaClick(peca)}
                                      onContextMenu={(e) => handlePecaInfo(peca, e as any)}
                                    />
                                    
                                    {/* Barra de status no topo */}
                                    <rect
                                      x={pecaX - 70}
                                      y={pecaY - 35}
                                      width="140"
                                      height="4"
                                      rx="8"
                                      ry="8"
                                      fill={statusColor}
                                    />

                                    {/* Ícone de categoria */}
                                    <text
                                      x={pecaX - 55}
                                      y={pecaY - 8}
                                      fontSize="18"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {getCategoriaIcon(peca.categoria)}
                                    </text>

                                    {/* Código da peça */}
                                    <text
                                      x={pecaX - 30}
                                      y={pecaY - 12}
                                      textAnchor="start"
                                      className="text-xs font-semibold fill-foreground"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {peca.codigo}
                                    </text>

                                    {/* Nome da peça */}
                                    <text
                                      x={pecaX}
                                      y={pecaY + 6}
                                      textAnchor="middle"
                                      className="text-[10px] fill-muted-foreground"
                                      style={{ pointerEvents: "none" }}
                                    >
                                      {peca.nome.length > 20 ? peca.nome.substring(0, 18) + "..." : peca.nome}
                                    </text>

                                    {/* Ícone de status no canto superior direito */}
                                    <g transform={`translate(${pecaX + 55}, ${pecaY - 25})`}>
                                      <circle
                                        r="8"
                                        fill={statusColor}
                                      />
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

                                    {/* Indicador de estoque baixo */}
                                    {peca.emEstoque <= peca.estoqueMinimo && (
                                      <g transform={`translate(${pecaX + 55}, ${pecaY - 10})`}>
                                        <circle
                                          r="7"
                                          fill="#f59e0b"
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
                                    <g transform={`translate(${pecaX - 60}, ${pecaY + 18})`}>
                                      <rect
                                        width="120"
                                        height="3"
                                        rx="1.5"
                                        fill="hsl(var(--muted))"
                                      />
                                      <rect
                                        width={120 * (peca.vidaUtilRestante / peca.vidaUtil)}
                                        height="3"
                                        rx="1.5"
                                        fill={peca.vidaUtilRestante / peca.vidaUtil > 0.5 ? "#10b981" : 
                                             peca.vidaUtilRestante / peca.vidaUtil > 0.3 ? "#f59e0b" : "#ef4444"}
                                      />
                                    </g>
                                    
                                    {/* Indicador de subpeças disponíveis */}
                                    {peca.subPecas.length > 0 && (
                                      <g transform={`translate(${pecaX - 58}, ${pecaY - 25})`}>
                                        <circle
                                          r="7"
                                          fill="hsl(var(--primary))"
                                        />
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
                                  
                                  {/* Renderizar subpeças se esta peça estiver expandida */}
                                  {isExpanded && subPecasFicticias
                                    .filter(sp => sp.pecaPaiId === peca.id)
                                    .map((subPeca, subIndex) => {
                                      const subStartX = 650;
                                      const subSpacing = 70;
                                      const subPecaX = subStartX;
                                      const subPecaY = pecaY - 30 + (subIndex * subSpacing);
                                      const subStatusColor = subPeca.status === "Crítico" ? "#ef4444" : 
                                                           subPeca.status === "Atenção" ? "#f59e0b" : "#10b981";
                                      
                                      return (
                                        <g
                                          key={subPeca.id}
                                          style={{ cursor: "pointer" }}
                                          className="transition-all hover:opacity-90"
                                          filter="url(#cardShadow)"
                                        >
                                          {/* Card da subpeça */}
                                          <rect
                                            x={subPecaX - 60}
                                            y={subPecaY - 25}
                                            width="120"
                                            height="50"
                                            rx="6"
                                            ry="6"
                                            fill="hsl(var(--card))"
                                            stroke="hsl(var(--border))"
                                            strokeWidth="1"
                                            onClick={(e) => handleSubPecaInfo(subPeca, peca, e as any)}
                                          />
                                          
                                          {/* Barra de status */}
                                          <rect
                                            x={subPecaX - 60}
                                            y={subPecaY - 25}
                                            width="120"
                                            height="3"
                                            rx="6"
                                            ry="6"
                                            fill={subStatusColor}
                                          />
                                          
                                          {/* Código */}
                                          <text
                                            x={subPecaX}
                                            y={subPecaY - 8}
                                            textAnchor="middle"
                                            className="text-[9px] font-bold fill-foreground"
                                            style={{ pointerEvents: "none" }}
                                          >
                                            {subPeca.codigo}
                                          </text>
                                          
                                          {/* Nome */}
                                          <text
                                            x={subPecaX}
                                            y={subPecaY + 5}
                                            textAnchor="middle"
                                            className="text-[8px] fill-muted-foreground"
                                            style={{ pointerEvents: "none" }}
                                          >
                                            {subPeca.nome.length > 18 ? subPeca.nome.substring(0, 16) + "..." : subPeca.nome}
                                          </text>
                                          
                                          {/* Ícone de status */}
                                          <g transform={`translate(${subPecaX + 48}, ${subPecaY - 18})`}>
                                            <circle
                                              r="6"
                                              fill={subStatusColor}
                                            />
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

        {/* Modal de Detalhes - Sistema */}
        <Dialog open={!!selectedSistema} onOpenChange={() => setSelectedSistema(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedSistema?.nome}
                <Badge variant={getStatusVariant(selectedSistema?.status || "Normal")}>
                  {selectedSistema?.status}
                </Badge>
                <Badge variant="outline">{selectedSistema?.tipo}</Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedSistema && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Nome do Sistema
                        </h4>
                        <p className="text-lg">{selectedSistema.nome}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Tipo
                        </h4>
                        <p className="text-lg">{selectedSistema.tipo}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Status
                        </h4>
                        <Badge variant={getStatusVariant(selectedSistema.status)}>
                          {selectedSistema.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Total de Peças
                        </h4>
                        <p className="text-lg font-bold">{selectedSistema.totalPecas} peças</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Peças do Sistema
                      </h4>
                      <div className="space-y-2">
                        {pecasFicticias
                          .filter(p => p.maquinaId === selectedSistema.id)
                          .map(peca => (
                            <div
                              key={peca.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setSelectedPeca(peca);
                                setSelectedSistema(null);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getCategoriaIcon(peca.categoria)}</span>
                                <div>
                                  <p className="font-medium">{peca.nome}</p>
                                  <p className="text-xs text-muted-foreground">{peca.codigo}</p>
                                </div>
                              </div>
                              <Badge variant={getStatusVariant(peca.status)}>
                                {peca.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes - Sub-Peça */}
        <Dialog open={!!selectedSubPeca && !selectedSistema} onOpenChange={() => setSelectedSubPeca(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedSubPeca?.nome}
                <Badge variant={getStatusVariant(selectedSubPeca?.status || "Normal")}>
                  {selectedSubPeca?.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedSubPeca && selectedPeca && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações da Sub-Peça</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Código
                        </h4>
                        <p className="text-lg">{selectedSubPeca.codigo}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Status
                        </h4>
                        <Badge variant={getStatusVariant(selectedSubPeca.status)}>
                          {selectedSubPeca.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Peça Principal
                      </h4>
                      <div
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setSelectedSubPeca(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getCategoriaIcon(selectedPeca.categoria)}</span>
                          <div>
                            <p className="font-medium">{selectedPeca.nome}</p>
                            <p className="text-xs text-muted-foreground">{selectedPeca.codigo}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(selectedPeca.status)}>
                          {selectedPeca.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Estoque
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Em Estoque</p>
                          <p className="text-2xl font-bold">{selectedSubPeca.emEstoque} un</p>
                        </div>
                        {selectedSubPeca.emEstoque === 0 && (
                          <Badge variant="destructive">
                            Sem estoque
                          </Badge>
                        )}
                      </div>
                    </div>

                    {selectedSubPeca.emEstoque === 0 && (
                      <Card className="border-destructive">
                        <CardHeader>
                          <CardTitle className="text-sm text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Alerta de Estoque
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Esta sub-peça está sem estoque. Recomenda-se solicitar reposição urgente.
                          </p>
                          <Button className="w-full mt-3">
                            Solicitar Reposição
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes - Peça */}
        <Dialog open={!!selectedPeca && !selectedSubPeca && !selectedSistema} onOpenChange={() => setSelectedPeca(null)}>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Valor Unitário
                      </h4>
                      <p className="text-lg font-bold text-green-600 dark:text-green-500">
                        R$ {selectedPeca.valorUnitario.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Data Última Compra
                      </h4>
                      <p className="text-lg">
                        {new Date(selectedPeca.dataUltimaCompra).toLocaleDateString('pt-BR')}
                      </p>
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

                  {selectedPeca.subPecas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Sub-Peças
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPeca.subPecas.map((subPecaId, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {subPecaId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
