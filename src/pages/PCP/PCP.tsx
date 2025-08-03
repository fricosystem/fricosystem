import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import {
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/layouts/AppLayout";
import {
  CalendarIcon,
  FileTextIcon,
  SearchIcon,
  RefreshCw,
  Download,
  User,
  Factory,
  Clock,
  Package,
  BarChart2,
  Settings,
  ClipboardList,
  AlertTriangle,
  Loader2,
  Boxes,
  Layers,
  Calculator,
  Map,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/ui/StatsCard";

// Importando os componentes das abas
import PrimeiroTurno from "./1turno";
import SegundoTurno from "./2turno";
import Processamento from "./Processamento";
import ResultadosFinais from "./ResultadosFinais";
import Produtos from "./Produtos";
import Sistema from "./Sistema";

// Tipos para os dados do PCP
interface OrdemProducao {
  id: string;
  ordem_id: string;
  produto: string;
  quantidade: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  turno: string;
  eficiencia: number;
}

interface Produto {
  id: string;
  nome: string;
  codigo: string;
  quantidade_produzida: number;
  quantidade_estoque: number;
  lead_time: number;
}

interface Turno {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  meta_producao: number;
  producao_real: number;
  localizacao: string;
  setor: string;
}

interface Apontador {
  id: string;
  nome: string;
  quantidade_apontada: number;
  data: string;
  turno: string;
  setor: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#A4DE6C", "#D0ED57"];

const PCP = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [ordensProducao, setOrdensProducao] = useState<OrdemProducao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [apontadores, setApontadores] = useState<Apontador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "ano">("hoje");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Simular carregamento de dados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingProgress(0);
      try {
        // Simular chamada API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoadingProgress(30);
        
        // Dados mockados
        const mockOrdens: OrdemProducao[] = [
          {
            id: "1",
            ordem_id: "OP-2023-001",
            produto: "Produto A",
            quantidade: 1000,
            status: "Em andamento",
            data_inicio: "01/07/2023",
            data_fim: "05/07/2023",
            turno: "1° Turno",
            eficiencia: 85,
          },
          {
            id: "2",
            ordem_id: "OP-2023-002",
            produto: "Produto B",
            quantidade: 500,
            status: "Concluído",
            data_inicio: "03/07/2023",
            data_fim: "07/07/2023",
            turno: "2° Turno",
            eficiencia: 78,
          },
          {
            id: "3",
            ordem_id: "OP-2023-003",
            produto: "Produto C",
            quantidade: 750,
            status: "Planejado",
            data_inicio: "10/07/2023",
            data_fim: "15/07/2023",
            turno: "1° Turno",
            eficiencia: 0,
          },
          {
            id: "4",
            ordem_id: "OP-2023-004",
            produto: "Produto D",
            quantidade: 1200,
            status: "Em andamento",
            data_inicio: "05/07/2023",
            data_fim: "12/07/2023",
            turno: "2° Turno",
            eficiencia: 65,
          },
          {
            id: "5",
            ordem_id: "OP-2023-005",
            produto: "Produto E",
            quantidade: 900,
            status: "Concluído",
            data_inicio: "08/07/2023",
            data_fim: "14/07/2023",
            turno: "1° Turno",
            eficiencia: 82,
          },
        ];

        const mockProdutos: Produto[] = [
          {
            id: "1",
            nome: "Produto A",
            codigo: "PA-001",
            quantidade_produzida: 2500,
            quantidade_estoque: 500,
            lead_time: 3,
          },
          {
            id: "2",
            nome: "Produto B",
            codigo: "PB-002",
            quantidade_produzida: 1800,
            quantidade_estoque: 300,
            lead_time: 2,
          },
          {
            id: "3",
            nome: "Produto C",
            codigo: "PC-003",
            quantidade_produzida: 3200,
            quantidade_estoque: 700,
            lead_time: 5,
          },
          {
            id: "4",
            nome: "Produto D",
            codigo: "PD-004",
            quantidade_produzida: 1500,
            quantidade_estoque: 200,
            lead_time: 2,
          },
          {
            id: "5",
            nome: "Produto E",
            codigo: "PE-005",
            quantidade_produzida: 2100,
            quantidade_estoque: 450,
            lead_time: 4,
          },
        ];

        const mockTurnos: Turno[] = [
          {
            id: "1",
            nome: "1° Turno",
            inicio: "06:00",
            fim: "14:00",
            meta_producao: 1000,
            producao_real: 850,
            localizacao: "SP - Fábrica Centro",
            setor: "Frescais"
          },
          {
            id: "2",
            nome: "2° Turno",
            inicio: "14:00",
            fim: "22:00",
            meta_producao: 1000,
            producao_real: 720,
            localizacao: "SP - Fábrica Centro",
            setor: "Embutidos"
          },
          {
            id: "3",
            nome: "1° Turno",
            inicio: "06:00",
            fim: "14:00",
            meta_producao: 800,
            producao_real: 750,
            localizacao: "RJ - Fábrica Norte",
            setor: "Frescais"
          },
          {
            id: "4",
            nome: "2° Turno",
            inicio: "14:00",
            fim: "22:00",
            meta_producao: 800,
            producao_real: 680,
            localizacao: "RJ - Fábrica Norte",
            setor: "Embutidos"
          },
          {
            id: "5",
            nome: "1° Turno",
            inicio: "06:00",
            fim: "14:00",
            meta_producao: 1200,
            producao_real: 1100,
            localizacao: "MG - Fábrica Oeste",
            setor: "Frescais"
          },
          {
            id: "6",
            nome: "2° Turno",
            inicio: "14:00",
            fim: "22:00",
            meta_producao: 1200,
            producao_real: 950,
            localizacao: "MG - Fábrica Oeste",
            setor: "Embutidos"
          },
        ];

        const mockApontadores: Apontador[] = [
          {
            id: "1",
            nome: "João Silva",
            quantidade_apontada: 450,
            data: "01/07/2023",
            turno: "1° Turno",
            setor: "Frescais"
          },
          {
            id: "2",
            nome: "Maria Oliveira",
            quantidade_apontada: 380,
            data: "01/07/2023",
            turno: "1° Turno",
            setor: "Embutidos"
          },
          {
            id: "3",
            nome: "Carlos Souza",
            quantidade_apontada: 520,
            data: "01/07/2023",
            turno: "2° Turno",
            setor: "Frescais"
          },
          {
            id: "4",
            nome: "Ana Costa",
            quantidade_apontada: 340,
            data: "01/07/2023",
            turno: "2° Turno",
            setor: "Embutidos"
          },
          {
            id: "5",
            nome: "Pedro Santos",
            quantidade_apontada: 490,
            data: "02/07/2023",
            turno: "1° Turno",
            setor: "Frescais"
          },
          {
            id: "6",
            nome: "Juliana Lima",
            quantidade_apontada: 410,
            data: "02/07/2023",
            turno: "1° Turno",
            setor: "Embutidos"
          },
        ];

        setLoadingProgress(70);
        setOrdensProducao(mockOrdens);
        setProdutos(mockProdutos);
        setTurnos(mockTurnos);
        setApontadores(mockApontadores);
        setLoadingProgress(100);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do PCP",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'concluida':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'em andamento':
      case 'andamento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'planejado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'cancelado':
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Dados para gráficos do dashboard
  const getDataProducao = () => {
    switch (period) {
      case "hoje":
        return [
          { name: "06h", meta: 200, real: 180 },
          { name: "08h", meta: 200, real: 195 },
          { name: "10h", meta: 200, real: 175 },
          { name: "12h", meta: 200, real: 210 },
          { name: "14h", meta: 200, real: 190 },
          { name: "16h", meta: 200, real: 185 },
          { name: "18h", meta: 200, real: 205 },
        ];
      case "semana":
        return [
          { name: "Seg", meta: 1000, real: 950 },
          { name: "Ter", meta: 1000, real: 980 },
          { name: "Qua", meta: 1000, real: 1020 },
          { name: "Qui", meta: 1000, real: 890 },
          { name: "Sex", meta: 1000, real: 1050 },
        ];
      case "mes":
        return [
          { name: "Sem 1", meta: 4000, real: 3800 },
          { name: "Sem 2", meta: 4000, real: 4200 },
          { name: "Sem 3", meta: 4000, real: 3950 },
          { name: "Sem 4", meta: 4000, real: 4100 },
        ];
      case "ano":
        return [
          { name: "Jan", meta: 15000, real: 14800 },
          { name: "Fev", meta: 14000, real: 13500 },
          { name: "Mar", meta: 16000, real: 16200 },
          { name: "Abr", meta: 15000, real: 14800 },
          { name: "Mai", meta: 17000, real: 16800 },
          { name: "Jun", meta: 16000, real: 16500 },
          { name: "Jul", meta: 17000, real: 17200 },
          { name: "Ago", meta: 17000, real: 0 },
          { name: "Set", meta: 16000, real: 0 },
          { name: "Out", meta: 17000, real: 0 },
          { name: "Nov", meta: 16000, real: 0 },
          { name: "Dez", meta: 15000, real: 0 },
        ];
      default:
        return [];
    }
  };

  const dataEficiencia = [
    { name: "1° Turno", value: 85 },
    { name: "2° Turno", value: 72 },
  ];

  // Dados para gráfico de turnos por localização
  const turnosPorLocalizacao = () => {
    return turnos.reduce((acc: any[], turno) => {
      const existing = acc.find(item => item.localizacao === turno.localizacao);
      if (existing) {
        existing.producao_real += turno.producao_real;
        existing.meta_producao += turno.meta_producao;
      } else {
        acc.push({
          localizacao: turno.localizacao,
          producao_real: turno.producao_real,
          meta_producao: turno.meta_producao,
          eficiencia: Math.round((turno.producao_real / turno.meta_producao) * 100)
        });
      }
      return acc;
    }, []);
  };

  // Dados para gráfico de setores mais produtivos
  const setoresMaisProdutivos = () => {
    const setores = turnos.reduce((acc: any[], turno) => {
      const existing = acc.find(item => item.setor === turno.setor);
      if (existing) {
        existing.producao_real += turno.producao_real;
      } else {
        acc.push({
          setor: turno.setor,
          producao_real: turno.producao_real,
          fill: turno.setor === "Frescais" ? COLORS[0] : COLORS[1]
        });
      }
      return acc;
    }, []);

    return setores.sort((a, b) => b.producao_real - a.producao_real);
  };

  // Top 5 produtos mais produzidos
  const topProdutos = () => {
    return [...produtos]
      .sort((a, b) => b.quantidade_produzida - a.quantidade_produzida)
      .slice(0, 5)
      .map(p => ({
        name: p.nome,
        value: p.quantidade_produzida,
        codigo: p.codigo
      }));
  };

  // Dados para gráfico de apontadores
  const dadosApontadores = () => {
    return [...apontadores]
      .sort((a, b) => b.quantidade_apontada - a.quantidade_apontada)
      .slice(0, 7)
      .map(a => ({
        name: a.nome,
        quantidade: a.quantidade_apontada,
        turno: a.turno,
        setor: a.setor
      }));
  };

  // Calcular eficiência média
  const eficienciaMedia = ordensProducao.length > 0 
    ? Math.round(ordensProducao.reduce((acc, curr) => acc + curr.eficiencia, 0) / ordensProducao.length)
    : 0;

  // Manipulador de clique no gráfico
  const handleBarClick = (data: any, index: number, event: React.MouseEvent) => {
    setTooltipData(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  // Fechar tooltip
  const handleCloseTooltip = () => {
    setTooltipData(null);
  };

  return (
    <AppLayout title="Planejamento e Controle de Produção">
      <div className="w-full h-full flex flex-col gap-6 p-4 md:p-6 flex-1 overflow-auto">
        {/* Abas do PCP */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "turno1" ? "default" : "ghost"}
            onClick={() => setActiveTab("turno1")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            1° Turno
          </Button>
          <Button
            variant={activeTab === "turno2" ? "default" : "ghost"}
            onClick={() => setActiveTab("turno2")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            2° Turno
          </Button>
          <Button
            variant={activeTab === "processamento" ? "default" : "ghost"}
            onClick={() => setActiveTab("processamento")}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Processamento
          </Button>
          <Button
            variant={activeTab === "resultados" ? "default" : "ghost"}
            onClick={() => setActiveTab("resultados")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Resultados finais
          </Button>
          <Button
            variant={activeTab === "produtos" ? "default" : "ghost"}
            onClick={() => setActiveTab("produtos")}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Produtos
          </Button>
          <Button
            variant={activeTab === "sistema" ? "default" : "ghost"}
            onClick={() => setActiveTab("sistema")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Sistema
          </Button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-bold">Dashboard de Produção</h2>
            
            {/* Seletor de período */}
            <div className="mb-6">
              <Tabs defaultValue="hoje" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes" | "ano")}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="hoje" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Hoje
                  </TabsTrigger>
                  <TabsTrigger value="semana" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Semana
                  </TabsTrigger>
                  <TabsTrigger value="mes" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Mês
                  </TabsTrigger>
                  <TabsTrigger value="ano" className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" /> Ano
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Carregando dados do dashboard...</p>
                  <div className="w-full max-w-md">
                    <Progress value={loadingProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center mt-2">{loadingProgress}%</p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Cards de estatísticas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <StatsCard
                    title="Total de Ordens"
                    value={ordensProducao.length.toString()}
                    icon={<FileTextIcon className="h-4 w-4" />}
                    trend={{
                      value: (ordensProducao.length / 20) * 100,
                      positive: true,
                      label: `${((ordensProducao.length / 20) * 100).toFixed(0)}% da capacidade`
                    }}
                    description="Ordens de produção"
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
                  />
                  
                  <StatsCard
                    title="Em Produção"
                    value={ordensProducao.filter(o => o.status === "Em andamento").length.toString()}
                    icon={<Factory className="h-4 w-4" />}
                    description="Ordens ativas"
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10"
                  />
                  
                  <StatsCard
                    title="Eficiência Média"
                    value={`${eficienciaMedia}%`}
                    icon={<BarChart2 className="h-4 w-4" />}
                    description="Meta: 85%"
                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10"
                  />

                  <StatsCard
                    title="Produção Total"
                    value={turnos.reduce((acc, curr) => acc + curr.producao_real, 0).toLocaleString()}
                    icon={<Package className="h-4 w-4" />}
                    description="Unidades produzidas"
                    className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/10"
                  />
                </div>

                {/* Gráficos */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-6">
                  {/* Produção por Turno */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Produção por Turno
                      </CardTitle>
                      <CardDescription>Comparativo entre turnos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={dataEficiencia}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Bar 
                              dataKey="value" 
                              name="Eficiência (%)" 
                              onClick={handleBarClick}
                            >
                              {dataEficiencia.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Setores mais produtivos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Boxes className="h-5 w-5" /> Setores mais produtivos
                      </CardTitle>
                      <CardDescription>Frescais vs Embutidos por turno</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={setoresMaisProdutivos()}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="setor" type="category" width={80} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Bar 
                              dataKey="producao_real" 
                              name="Produção (un)" 
                              onClick={handleBarClick}
                            >
                              {setoresMaisProdutivos().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Segunda linha de gráficos */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {/* Top Apontadores */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Top Apontadores
                      </CardTitle>
                      <CardDescription>Pessoas com mais apontamentos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dadosApontadores()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="quantidade" 
                              name="Quantidade" 
                              fill="#8884d8" 
                              onClick={handleBarClick}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Produção por Período */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Produção {period === "hoje" ? "Diária" : 
                          period === "semana" ? "Semanal" : 
                          period === "mes" ? "Mensal" : "Anual"}
                      </CardTitle>
                      <CardDescription>Meta vs Realizado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getDataProducao()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="meta" 
                              name="Meta" 
                              fill="#8884d8" 
                              onClick={handleBarClick}
                            />
                            <Bar 
                              dataKey="real" 
                              name="Realizado" 
                              fill="#82ca9d" 
                              onClick={handleBarClick}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Terceira linha de gráficos */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {/* Turnos por Localização */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5" /> Turnos por Localização
                      </CardTitle>
                      <CardDescription>Eficiência por fábrica</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={turnosPorLocalizacao()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="localizacao" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="eficiencia" 
                              name="Eficiência (%)" 
                              fill="#FFBB28" 
                              onClick={handleBarClick}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top 5 Produtos mais produzidos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Top 5 Produtos
                      </CardTitle>
                      <CardDescription>Produtos mais produzidos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={topProdutos()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              innerRadius={40}
                              paddingAngle={5}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              onClick={handleBarClick}
                            >
                              {topProdutos().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Tooltip flutuante */}
            {tooltipData && (
              <div 
                className="fixed z-50 p-4 bg-gray-900 text-white rounded-lg shadow-lg"
                style={{
                  left: `${tooltipPosition.x + 10}px`,
                  top: `${tooltipPosition.y + 10}px`,
                  maxWidth: '300px'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">Detalhes</h3>
                  <button 
                    onClick={handleCloseTooltip}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(tooltipData).map(([key, value]) => (
                    key !== 'fill' && (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-300 capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "turno1" && <PrimeiroTurno />}
        {activeTab === "turno2" && <SegundoTurno />}
        {activeTab === "processamento" && <Processamento ordens={ordensProducao} />}
        {activeTab === "resultados" && <ResultadosFinais ordens={ordensProducao} produtos={produtos} />}
        {activeTab === "produtos" && <Produtos />}
        {activeTab === "sistema" && <Sistema />}
      </div>
    </AppLayout>
  );
};

export default PCP;