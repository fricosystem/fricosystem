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
import { toast } from "@/hooks/use-toast";
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
  Target,
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
import { usePCPOptimized } from "@/hooks/usePCPOptimized";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Importando os componentes das abas
import PrimeiroTurno from "./1turno";
import SegundoTurno from "./2turno";
import Processamento from "./Processamento";
import ResultadosFinais from "./ResultadosFinais";
import Produtos from "./Produtos";

import Metas from "./Metas";

// Importando os modais para produtos sem classificação
import ProdutosSemClassificacaoModal from "@/components/PCP/ProdutosSemClassificacaoModal";
import AdicionarProdutoModal from "@/components/PCP/AdicionarProdutoModal";

const COLORS = [
  "#3B82F6", // Azul vibrante
  "#10B981", // Verde esmeralda
  "#F59E0B", // Âmbar
  "#EF4444", // Vermelho
  "#8B5CF6", // Roxo
  "#06B6D4", // Ciano
  "#F97316", // Laranja
  "#84CC16", // Lima
  "#EC4899", // Rosa
  "#6366F1", // Índigo
  "#14B8A6", // Teal
  "#F43F5E", // Rosa vermelho
  "#A855F7", // Violeta
  "#22C55E", // Verde
  "#FB923C", // Laranja claro
  "#38BDF8", // Azul céu
  "#FBBF24", // Amarelo
  "#F472B6", // Rosa claro
  "#34D399", // Verde água
  "#A78BFA"  // Lavanda
];

// Cor específica para "NÃO CADASTRADO"
const getBarColor = (setor: string, index: number) => {
  if (setor === "NÃO CADASTRADO" || setor === "Sem classificação" || setor === "Não classificado" || setor === "Sem cadastro") {
    return "hsl(var(--destructive))"; // Cor vermelha
  }
  return COLORS[index % COLORS.length];
};

interface ProdutoSemClassificacao {
  codigo: string;
  nome: string;
  quantidade_produzida: number;
}

const PCP = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "ano" | "personalizado">("hoje");
  const [customPeriod, setCustomPeriod] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  
  // Estados para os modais
  const [showProdutosSemClassificacao, setShowProdutosSemClassificacao] = useState(false);
  const [showAdicionarProduto, setShowAdicionarProduto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoSemClassificacao | null>(null);

  // Hook personalizado para dados PCP
  const { 
    pcpData, 
    pcpProdutos, 
    loading: isLoading, 
    error, 
    fetchPCPData, 
    setupRealtimeListener,
    getMetrics,
    getChartData 
  } = usePCPOptimized();

  // Carregar dados baseado no período selecionado
  useEffect(() => {
    if (period === "personalizado" && customPeriod.startDate && customPeriod.endDate) {
      // Para período personalizado, usar formato adequado
      const customPeriodString = `${format(customPeriod.startDate, 'yyyy-MM-dd')}_${format(customPeriod.endDate, 'yyyy-MM-dd')}`;
      fetchPCPData(customPeriodString as any);
    } else if (period !== "personalizado") {
      fetchPCPData(period);
    }
  }, [period, customPeriod]);

  // Configurar listener em tempo real
  useEffect(() => {
    if (period === "personalizado" && customPeriod.startDate && customPeriod.endDate) {
      const customPeriodString = `${format(customPeriod.startDate, 'yyyy-MM-dd')}_${format(customPeriod.endDate, 'yyyy-MM-dd')}`;
      const unsubscribe = setupRealtimeListener(customPeriodString as any);
      return () => unsubscribe();
    } else if (period !== "personalizado") {
      const unsubscribe = setupRealtimeListener(period);
      return () => unsubscribe();
    }
  }, [period, customPeriod]);

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

  // Função para obter produtos sem classificação
  const getProdutosSemClassificacao = (): ProdutoSemClassificacao[] => {
    const produtosSemClassificacao: ProdutoSemClassificacao[] = [];
    
    pcpData.forEach((item) => {
      if (item.classificacao === "NÃO CADASTRADO" || item.classificacao === "Sem classificação" || item.classificacao === "Não classificado" || !item.classificacao) {
        const existente = produtosSemClassificacao.find(p => p.codigo === item.codigo);
        if (existente) {
          existente.quantidade_produzida += item.quantidade_produzida || 0;
        } else {
          produtosSemClassificacao.push({
            codigo: item.codigo || "N/A",
            nome: item.produto_nome || "Nome não identificado",
            quantidade_produzida: item.quantidade_produzida || 0
          });
        }
      }
    });
    
    return produtosSemClassificacao;
  };

  // Função para lidar com clique na barra "NÃO CADASTRADO"
  const handleBarClick = (data: any) => {
    if (data && (data.setor === "NÃO CADASTRADO" || data.setor === "Sem classificação" || data.setor === "Não classificado" || data.setor === "Sem cadastro")) {
      setShowProdutosSemClassificacao(true);
    }
  };

  // Função para abrir modal de adicionar produto
  const handleAdicionarProduto = (produto: ProdutoSemClassificacao) => {
    setProdutoSelecionado(produto);
    setShowAdicionarProduto(true);
  };

  // Função chamada após produto ser adicionado com sucesso
  const handleProdutoAdicionado = () => {
    // Recarregar dados PCP para refletir as mudanças
    if (period === "personalizado" && customPeriod.startDate && customPeriod.endDate) {
      const customPeriodString = `${format(customPeriod.startDate, 'yyyy-MM-dd')}_${format(customPeriod.endDate, 'yyyy-MM-dd')}`;
      fetchPCPData(customPeriodString as any);
    } else if (period !== "personalizado") {
      fetchPCPData(period);
    }
    setShowProdutosSemClassificacao(false);
    setProdutoSelecionado(null);
  };

  // Obter métricas e dados dos gráficos
  const currentPeriod = period === "personalizado" && customPeriod.startDate && customPeriod.endDate
    ? `${format(customPeriod.startDate, 'yyyy-MM-dd')}_${format(customPeriod.endDate, 'yyyy-MM-dd')}`
    : period;
    
  const metrics = getMetrics(currentPeriod as any);
  const chartData = getChartData;

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
            variant={activeTab === "metas" ? "default" : "ghost"}
            onClick={() => setActiveTab("metas")}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Metas
          </Button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-bold">Dashboard de Produção</h2>
            
            {/* Seletor de período */}
            <div className="mb-6">
              <Tabs defaultValue="hoje" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes" | "ano" | "personalizado")}>
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
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
                  <TabsTrigger value="personalizado" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Personalizado
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="personalizado" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Data de Início</Label>
                          <Input
                            type="date"
                            value={customPeriod.startDate ? format(customPeriod.startDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined;
                              setCustomPeriod(prev => ({ ...prev, startDate: date }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Data de Fim</Label>
                          <Input
                            type="date"
                            value={customPeriod.endDate ? format(customPeriod.endDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined;
                              setCustomPeriod(prev => ({ ...prev, endDate: date }));
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {error && (
              <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <p className="text-lg font-medium text-red-600">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                  <Button onClick={() => {
                    if (period === "personalizado" && customPeriod.startDate && customPeriod.endDate) {
                      const customPeriodString = `${format(customPeriod.startDate, 'yyyy-MM-dd')}_${format(customPeriod.endDate, 'yyyy-MM-dd')}`;
                      fetchPCPData(customPeriodString as any);
                    } else if (period !== "personalizado") {
                      fetchPCPData(period);
                    }
                  }} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </Card>
            )}

            {/* Cards de estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div 
                onClick={() => {
                  // Mostra informações detalhadas dos turnos
                }}
                className="cursor-pointer hover:scale-105 transition-transform"
              >
                <StatsCard
                  title="Quantidade Produzida por Turnos"
                  value={`${Object.values(metrics.producaoPorTurno).reduce((acc, turno) => acc + turno.quantidade, 0).toLocaleString()} KG`}
                  icon={<Clock className="h-4 w-4" />}
                  trend={{
                    value: Object.keys(metrics.producaoPorTurno).length,
                    positive: Object.keys(metrics.producaoPorTurno).length > 0,
                    label: Object.keys(metrics.producaoPorTurno).length === 0 
                      ? "Nenhum turno ativo" 
                      : Object.keys(metrics.producaoPorTurno).length === 1
                        ? "1 turno ativo"
                        : `${Object.keys(metrics.producaoPorTurno).length} turnos ativos`
                  }}
                  description={`1° Turno: ${metrics.producaoPorTurno['1° Turno']?.quantidade.toLocaleString() || 0} KG | 2° Turno: ${metrics.producaoPorTurno['2° Turno']?.quantidade.toLocaleString() || 0} KG`}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
                />
              </div>
              
              <StatsCard
                title="Total Geral em %"
                value={`${metrics.eficienciaMedia}%`}
                icon={<Boxes className="h-4 w-4" />}
                trend={{
                  value: metrics.eficienciaMedia,
                  positive: metrics.eficienciaMedia >= 80,
                  label: metrics.eficienciaMedia >= 80 ? "Meta atingida" : metrics.eficienciaMedia === 0 ? "Sem dados" : "Abaixo da meta"
                }}
                description={`Meta: 80% | Produção total: ${metrics.producaoTotal.toLocaleString()} KG`}
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10"
              />
             
              <StatsCard
                title="Planejado x Realizado"
                value={`${pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0).toLocaleString()} / ${metrics.producaoTotal.toLocaleString()}`}
                icon={<BarChart2 className="h-4 w-4" />}
                trend={{
                  value: pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0) > 0 
                    ? Math.round((metrics.producaoTotal / pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0)) * 100)
                    : 0,
                  positive: pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0) > 0 
                    ? (metrics.producaoTotal / pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0)) >= 0.85
                    : false,
                  label: pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0) === 0 ? "Sem planejamento" : 
                    (metrics.producaoTotal / pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0)) >= 0.85 ? "Meta atingida" : "Abaixo da meta"
                }}
                description="KG Planejado / KG Realizado"
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10"
              />

              <StatsCard
                title="Produção Total"
                value={metrics.producaoTotal.toLocaleString()}
                icon={<Package className="h-4 w-4" />}
                trend={{
                  value: metrics.producaoTotal > 0 ? 15 : 0,
                  positive: metrics.producaoTotal > 0,
                  label: metrics.producaoTotal === 0 
                    ? `Sem produção ${period === 'hoje' ? 'hoje' : period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mês' : 'este ano'}`
                    : `${period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Esta semana' : period === 'mes' ? 'Este mês' : 'Este ano'}`
                }}
                description="KG produzidos"
                className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/10"
              />
            </div>

            {/* Mensagem quando não há dados */}
            {pcpData.length === 0 && !isLoading && (
              <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma produção encontrada
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Não há dados de produção para o período de{" "}
                    {period === 'hoje' ? 'hoje' : 
                     period === 'semana' ? 'esta semana' : 
                     period === 'mes' ? 'este mês' : 
                     'este ano'}
                  </p>
                </div>
              </Card>
            )}

            {/* Gráficos principais - Produção por Turno e Setores */}
            {pcpData.length > 0 && chartData.turnosChart.length > 0 && (
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
                              data={chartData.turnosChart}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{
                                  background: 'hsl(var(--background))',
                                  borderColor: 'hsl(var(--border))',
                                  borderRadius: 'var(--radius)',
                                  color: 'hsl(var(--foreground))',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                }}
                                labelStyle={{
                                  color: 'hsl(var(--foreground))',
                                  fontWeight: '500'
                                }}
                                itemStyle={{
                                  color: 'hsl(var(--foreground))'
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                name="Eficiência (%)"
                              >
                                {chartData.turnosChart.map((entry, index) => (
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
                    {chartData.setoresChart.length > 0 && (
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
                               data={chartData.setoresChart.map(item => ({
                                 ...item,
                                 setor: item.setor === "Sem classificação" || item.setor === "NÃO CADASTRADO" || item.setor === "Não classificado" ? "Sem cadastro" : item.setor
                               }))}
                               layout="vertical"
                               margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                               onClick={handleBarClick}
                             >
                               <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                               <XAxis type="number" />
                               <YAxis dataKey="setor" type="category" width={80} />
                              <Tooltip 
                                contentStyle={{
                                  background: 'hsl(var(--background))',
                                  borderColor: 'hsl(var(--border))',
                                  borderRadius: 'var(--radius)',
                                  color: 'hsl(var(--foreground))',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                }}
                                labelStyle={{
                                  color: 'hsl(var(--foreground))',
                                  fontWeight: '500'
                                }}
                                itemStyle={{
                                  color: 'hsl(var(--foreground))'
                                }}
                                formatter={(value: number) => value.toLocaleString()}
                              />
                                <Bar 
                                  dataKey="producao_real" 
                                  name="Produção (KG)"
                                  onClick={handleBarClick}
                                  style={{ cursor: 'pointer' }}
                                >
                                 {chartData.setoresChart.map((entry, index) => (
                                   <Cell 
                                     key={`cell-${index}`} 
                                     fill={getBarColor(entry.setor, index)}
                                     style={{ cursor: 'pointer' }}
                                   />
                                 ))}
                               </Bar>
                             </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Performance por Produto - ocupando toda a largura */}
                {pcpData.length > 0 && chartData.performanceChart.length > 0 && (
                  <Card className="w-full mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Performance por Produto
                      </CardTitle>
                      <CardDescription>Planejado vs Produzido por código</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData.performanceChart}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{
                                background: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                              }}
                              labelStyle={{
                                color: 'hsl(var(--foreground))',
                                fontWeight: '500'
                              }}
                              itemStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                              formatter={(value: number) => value.toLocaleString()}
                            />
                            <Legend />
                            <Bar 
                              dataKey="planejado" 
                              name="Planejado (kg)" 
                              fill="hsl(var(--primary))"
                            />
                            <Bar 
                              dataKey="produzido" 
                              name="Produzido (kg)" 
                              fill="hsl(var(--success))"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Performance por Classificação - ocupando toda a largura */}
                {pcpData.length > 0 && chartData.performanceClassificacaoChart.length > 0 && (
                  <Card className="w-full mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Performance por Classificação
                      </CardTitle>
                      <CardDescription>Planejado vs Produzido por família de produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData.performanceClassificacaoChart}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{
                                background: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                              }}
                              labelStyle={{
                                color: 'hsl(var(--foreground))',
                                fontWeight: '500'
                              }}
                              itemStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                              formatter={(value: number) => value.toLocaleString()}
                            />
                            <Legend />
                            <Bar 
                              dataKey="planejado" 
                              name="Planejado (kg)" 
                              fill="hsl(var(--primary))"
                            />
                            <Bar 
                              dataKey="produzido" 
                              name="Produzido (kg)" 
                              fill="hsl(var(--success))"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
          </div>
        )}

        {activeTab === "turno1" && <PrimeiroTurno />}
        {activeTab === "turno2" && <SegundoTurno />}
        {activeTab === "processamento" && <Processamento />}
        {activeTab === "resultados" && <ResultadosFinais />}
        {activeTab === "produtos" && <Produtos />}
        {activeTab === "metas" && <Metas />}
        

        {/* Modais para produtos sem classificação */}
        <ProdutosSemClassificacaoModal
          isOpen={showProdutosSemClassificacao}
          onClose={() => setShowProdutosSemClassificacao(false)}
          produtos={getProdutosSemClassificacao()}
          onAdicionarProduto={handleAdicionarProduto}
        />

        <AdicionarProdutoModal
          isOpen={showAdicionarProduto}
          onClose={() => {
            setShowAdicionarProduto(false);
            setProdutoSelecionado(null);
          }}
          produto={produtoSelecionado}
          onProdutoAdicionado={handleProdutoAdicionado}
        />
      </div>
    </AppLayout>
  );
};

export default PCP;