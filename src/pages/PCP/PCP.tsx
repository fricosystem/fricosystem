import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip as UITooltip, TooltipContent as UITooltipContent, TooltipProvider as UITooltipProvider, TooltipTrigger as UITooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppLayout from "@/layouts/AppLayout";
import { CalendarIcon, FileTextIcon, SearchIcon, RefreshCw, Download, User, Factory, Clock, Package, BarChart2, Settings, ClipboardList, AlertTriangle, Loader2, Boxes, Layers, Calculator, Map, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/ui/StatsCard";
import { usePCPOptimized } from "@/hooks/usePCPOptimized";
import { usePCPPageState } from "@/hooks/usePCPPageState";
import { usePCPConfig } from "@/hooks/usePCPConfig";

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
const COLORS = ["#3B82F6",
// Azul vibrante
"#10B981",
// Verde esmeralda
"#F59E0B",
// Âmbar
"#EF4444",
// Vermelho
"#8B5CF6",
// Roxo
"#06B6D4",
// Ciano
"#F97316",
// Laranja
"#84CC16",
// Lima
"#EC4899",
// Rosa
"#6366F1",
// Índigo
"#14B8A6",
// Teal
"#F43F5E",
// Rosa vermelho
"#A855F7",
// Violeta
"#22C55E",
// Verde
"#FB923C",
// Laranja claro
"#38BDF8",
// Azul céu
"#FBBF24",
// Amarelo
"#F472B6",
// Rosa claro
"#34D399",
// Verde água
"#A78BFA" // Lavanda
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
  // Hook personalizado para gestão de estado da página
  const {
    activeTab,
    searchTerm,
    period,
    customStartDate,
    customEndDate,
    showProdutosSemClassificacao,
    showAdicionarProduto,
    produtoSelecionado,
    handleTabChange,
    handlePeriodChange,
    handleCustomStartDateChange,
    handleCustomEndDateChange,
    openProdutosSemClassificacao,
    closeProdutosSemClassificacao,
    openAdicionarProduto,
    closeAdicionarProduto,
    handleProdutoAdicionado,
    handleSearchTermChange
  } = usePCPPageState();

  // Escutar eventos customizados para mudança de aba
  useEffect(() => {
    const handleChangeTab = (event: CustomEvent) => {
      handleTabChange(event.detail);
    };
    window.addEventListener('changeTab', handleChangeTab as EventListener);
    return () => {
      window.removeEventListener('changeTab', handleChangeTab as EventListener);
    };
  }, [handleTabChange]);

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

  // Hook para configurações do PCP
  const {
    config
  } = usePCPConfig();

  // Carregar dados baseado no período selecionado (apenas quando não está na aba Resultados)
  useEffect(() => {
    // Não carregar dados se estiver na aba Resultados para evitar conflito
    if (activeTab === 'resultados') return;
    if (period === 'personalizado') {
      fetchPCPData(period, customStartDate, customEndDate);
    } else {
      fetchPCPData(period);
    }
  }, [period, customStartDate, customEndDate, fetchPCPData, activeTab]);

  // Configurar listener em tempo real (apenas quando não está na aba Resultados)
  useEffect(() => {
    // Não configurar listener se estiver na aba Resultados para evitar conflito
    if (activeTab === 'resultados') return;
    let unsubscribe: (() => void) | undefined;
    if (period === 'personalizado') {
      unsubscribe = setupRealtimeListener(period, customStartDate, customEndDate);
    } else {
      unsubscribe = setupRealtimeListener(period);
    }
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [period, customStartDate, customEndDate, setupRealtimeListener, activeTab]);
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
    if (!pcpData || pcpData.length === 0) {
      return [];
    }
    const produtosSemClassificacao: ProdutoSemClassificacao[] = [];
    pcpData.forEach(item => {
      if (!item) return; // Validação adicional

      const classificacaoInvalida = !item.classificacao || item.classificacao === "NÃO CADASTRADO" || item.classificacao === "Sem classificação" || item.classificacao === "Não classificado" || item.classificacao === "Sem cadastro";
      if (classificacaoInvalida) {
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
    if (!data) return;
    const setoresInvalidos = ["NÃO CADASTRADO", "Sem classificação", "Não classificado", "Sem cadastro"];
    if (data.setor && setoresInvalidos.includes(data.setor)) {
      openProdutosSemClassificacao();
    }
  };

  // Função chamada após produto ser adicionado com sucesso
  const handleProdutoAdicionadoWithReload = () => {
    if (period === 'personalizado') {
      fetchPCPData(period, customStartDate, customEndDate);
    } else {
      fetchPCPData(period);
    }
    handleProdutoAdicionado(); // Chama a função do hook que limpa os estados
  };

  // Obter métricas e dados dos gráficos com validação de erro
  const metrics = useMemo(() => {
    if (error || !getMetrics) {
      return {
        produtosCadastrados: 0,
        produtosSemClassificacao: 0,
        totalOrdens: 0,
        ordensEmProducao: 0,
        ordensCompletas: 0,
        eficienciaMedia: 0,
        producaoTotal: 0,
        producaoPorTurno: {} as Record<string, {
          quantidade: number;
          eficiencia: number;
          count: number;
        }>,
        producaoPorSetor: {} as Record<string, number>
      };
    }
    try {
      return getMetrics(period);
    } catch (err) {
      console.error('Erro ao calcular métricas:', err);
      return {
        produtosCadastrados: 0,
        produtosSemClassificacao: 0,
        totalOrdens: 0,
        ordensEmProducao: 0,
        ordensCompletas: 0,
        eficienciaMedia: 0,
        producaoTotal: 0,
        producaoPorTurno: {} as Record<string, {
          quantidade: number;
          eficiencia: number;
          count: number;
        }>,
        producaoPorSetor: {} as Record<string, number>
      };
    }
  }, [error, getMetrics, period]);
  const chartDataMemo = useMemo(() => {
    if (error || !getChartData) {
      return {
        turnosChart: [],
        setoresChart: [],
        performanceChart: [],
        performanceClassificacaoChart: []
      };
    }
    try {
      return getChartData;
    } catch (err) {
      console.error('Erro ao gerar dados dos gráficos:', err);
      return {
        turnosChart: [],
        setoresChart: [],
        performanceChart: [],
        performanceClassificacaoChart: []
      };
    }
  }, [error, getChartData]);
  return <ErrorBoundary>
      <AppLayout title="Planejamento e Controle de Produção">
        <div className="w-full h-full flex flex-col gap-6 p-4 md:p-6 flex-1 overflow-auto">
        {/* Abas do PCP */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Button variant={activeTab === "dashboard" ? "default" : "ghost"} onClick={() => handleTabChange("dashboard")} className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button variant={activeTab === "turno1" ? "default" : "ghost"} onClick={() => handleTabChange("turno1")} className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            1° Turno
          </Button>
          <Button variant={activeTab === "turno2" ? "default" : "ghost"} onClick={() => handleTabChange("turno2")} className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            2° Turno
          </Button>
          <Button variant={activeTab === "processamento" ? "default" : "ghost"} onClick={() => handleTabChange("processamento")} className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Processamento
          </Button>
          <Button variant={activeTab === "resultados" ? "default" : "ghost"} onClick={() => handleTabChange("resultados")} className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Resultados finais
          </Button>
          <Button variant={activeTab === "produtos" ? "default" : "ghost"} onClick={() => handleTabChange("produtos")} className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </Button>
          <Button variant={activeTab === "metas" ? "default" : "ghost"} onClick={() => handleTabChange("metas")} className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </Button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === "dashboard" && <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-bold">Dashboard de Produção</h2>
            
            {/* Seletor de período */}
            <div className="mb-6">
              <Tabs defaultValue="hoje" value={period} onValueChange={v => handlePeriodChange(v as "hoje" | "semana" | "mes" | "ano" | "personalizado")}>
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
                    <CalendarIcon className="h-4 w-4" /> Personalizado
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Seletor de datas personalizadas */}
              {period === 'personalizado' && <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Período Personalizado</CardTitle>
                    <CardDescription>Selecione o intervalo de datas para análise</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Data de Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customStartDate ? format(customStartDate, "PPP", {
                            locale: ptBR
                          }) : <span>Selecione a data de início</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={customStartDate} onSelect={handleCustomStartDateChange} disabled={date => date > new Date() || date < new Date("2020-01-01")} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} showOutsideDays={true} fixedWeeks={true} classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold border border-primary/20",
                          day: "h-9 w-9 text-center font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                          cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          nav_button: "hover:bg-accent hover:text-accent-foreground",
                          caption: "flex justify-center pt-1 relative items-center"
                        }} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Data de Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customEndDate ? format(customEndDate, "PPP", {
                            locale: ptBR
                          }) : <span>Selecione a data de fim</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={customEndDate} onSelect={handleCustomEndDateChange} disabled={date => {
                          const today = new Date();
                          const startLimit = customStartDate || new Date("2020-01-01");
                          return date > today || date < startLimit;
                        }} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} showOutsideDays={true} fixedWeeks={true} classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold border border-primary/20",
                          day: "h-9 w-9 text-center font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                          cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          nav_button: "hover:bg-accent hover:text-accent-foreground",
                          caption: "flex justify-center pt-1 relative items-center"
                        }} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {customStartDate && customEndDate && <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Período selecionado:</strong> 
                          {format(customStartDate, " dd/MM/yyyy", {
                      locale: ptBR
                    })} até 
                          {format(customEndDate, " dd/MM/yyyy", {
                      locale: ptBR
                    })}
                        </p>
                      </div>}
                  </CardContent>
                </Card>}
            </div>

            {error && <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <p className="text-lg font-medium text-red-600">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                  <Button onClick={() => {
                if (period === 'personalizado') {
                  fetchPCPData(period, customStartDate, customEndDate);
                } else {
                  fetchPCPData(period);
                }
              }} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </Card>}

            {/* Cards de estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard title="Produção por Turno" value={<div className="space-y-1">
                    <UITooltipProvider>
                      <UITooltip>
                        <UITooltipTrigger asChild>
                          <div className="cursor-pointer">1° Turno: {((metrics.producaoPorTurno['1° Turno'] as any)?.quantidade || 0).toLocaleString()} KG</div>
                        </UITooltipTrigger>
                        <UITooltipContent>
                          <p>Soma das quantidades produzidas no 1° turno</p>
                        </UITooltipContent>
                      </UITooltip>
                    </UITooltipProvider>
                    <UITooltipProvider>
                      <UITooltip>
                        <UITooltipTrigger asChild>
                          <div className="cursor-pointer">2° Turno: {((metrics.producaoPorTurno['2° Turno'] as any)?.quantidade || 0).toLocaleString()} KG</div>
                        </UITooltipTrigger>
                        <UITooltipContent>
                          <p>Soma das quantidades produzidas no 2° turno</p>
                        </UITooltipContent>
                      </UITooltip>
                    </UITooltipProvider>
                  </div>} icon={<Clock className="h-4 w-4" />} description="Turnos de Produção" className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10" disableHover={true} />
              
              <StatsCard title="Produção Total" value={metrics.producaoTotal.toLocaleString()} icon={<Package className="h-4 w-4" />} trend={{
              value: metrics.producaoTotal > 0 ? 15 : 0,
              positive: metrics.producaoTotal > 0,
              label: metrics.producaoTotal === 0 ? `Sem produção ${period === 'hoje' ? 'ontem' : period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mês' : period === 'ano' ? 'este ano' : 'personalizado'}` : `${period === 'hoje' ? 'Ontem' : period === 'semana' ? 'Esta semana' : period === 'mes' ? 'Este mês' : period === 'ano' ? 'Este ano' : 'Personalizado'}`
            }} description="KG produzidos" formula="Soma de toda produção realizada no período selecionado" className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/10" />
             
              <StatsCard title="Planejado x Realizado" value={`${pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0).toLocaleString()} / ${metrics.producaoTotal.toLocaleString()}`} icon={<BarChart2 className="h-4 w-4" />} description={`Dias trabalhados: ${(() => {
              const uniqueDates = new Set();
              pcpData.forEach(item => {
                if (item.data_inicio) {
                  const date = item.data_inicio.toDate ? item.data_inicio.toDate() : new Date(item.data_inicio.seconds * 1000);
                  uniqueDates.add(date.toDateString());
                }
              });
              return uniqueDates.size;
            })()}`} formula="Soma(quantidade_planejada) / Soma(quantidade_produzida)" className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10" />

              <StatsCard title="Eficiência Média" value={`${(() => {
                const totalPlanejado = pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0);
                const totalProduzido = metrics.producaoTotal;
                return totalPlanejado > 0 ? Math.round((totalProduzido / totalPlanejado) * 100) : 0;
              })()}%`} icon={<Boxes className="h-4 w-4" />} trend={{
              value: (() => {
                const totalPlanejado = pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0);
                const totalProduzido = metrics.producaoTotal;
                return totalPlanejado > 0 ? Math.round((totalProduzido / totalPlanejado) * 100) : 0;
              })(),
              positive: (() => {
                const totalPlanejado = pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0);
                const totalProduzido = metrics.producaoTotal;
                return totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 >= 80 : false;
              })(),
              label: (() => {
                const totalPlanejado = pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0);
                const totalProduzido = metrics.producaoTotal;
                const eficiencia = totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 : 0;
                const periodoLabel = period === 'hoje' ? 'Ontem' : period === 'semana' ? 'Esta semana' : period === 'mes' ? 'Este mês' : period === 'ano' ? 'Este ano' : 'Personalizado';
                const eficienciaLabel = eficiencia >= 100 ? "Eficiência alta" : eficiencia >= 80 ? "Eficiência boa" : "Eficiência baixa";
                return `${eficienciaLabel} - ${periodoLabel}`;
              })()
            }} description={`Planejado: ${pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0).toLocaleString()} KG | Produzido: ${metrics.producaoTotal.toLocaleString()} KG`} formula="(Total Produzido ÷ Total Planejado) × 100" className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10" />
            </div>

            {/* Mensagem quando não há dados */}
            {pcpData.length === 0 && !isLoading && <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma produção encontrada
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Não há dados de produção para o período de{" "}
                    {period === 'hoje' ? 'ontem' : period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mês' : 'este ano'}
                  </p>
                </div>
              </Card>}

            {/* Gráficos principais - Produção por Turno e Setores */}
            {pcpData.length > 0 && chartDataMemo.turnosChart.length > 0 && <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-6">
                    {/* Performance por Classificação e Turno */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Factory className="h-5 w-5" /> Performance por Classificação e Turno
                        </CardTitle>
                        <CardDescription>Planejado vs Produzido por classificação em cada turno</CardDescription>
                      </CardHeader>
                       <CardContent className="p-0">
                          <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={(() => {
                                 // Agrupar dados por classificação e turno
                                 const dadosPorClassificacao: Record<string, any> = {};
                                 
                                 pcpData.forEach(item => {
                                   const classificacao = item.classificacao || 'Sem classificação';
                                   const turno = item.turno === '1_turno' ? '1° Turno' : '2° Turno';
                                   
                                   if (!dadosPorClassificacao[classificacao]) {
                                     dadosPorClassificacao[classificacao] = {
                                       '1° Turno': { planejado: 0, produzido: 0 },
                                       '2° Turno': { planejado: 0, produzido: 0 }
                                     };
                                   }
                                   
                                   dadosPorClassificacao[classificacao][turno].planejado += item.quantidade_planejada || 0;
                                   dadosPorClassificacao[classificacao][turno].produzido += item.quantidade_produzida || 0;
                                 });
                                 
                                 // Converter para formato do gráfico
                                 return Object.entries(dadosPorClassificacao)
                                  .map(([classificacao, dados]) => ({
                                    name: classificacao,
                                    'Planejado 1° Turno': Math.round(dados['1° Turno'].planejado),
                                    'Produzido 1° Turno': Math.round(dados['1° Turno'].produzido),
                                    'Planejado 2° Turno': Math.round(dados['2° Turno'].planejado),
                                    'Produzido 2° Turno': Math.round(dados['2° Turno'].produzido),
                                    eficiencia1: dados['1° Turno'].planejado > 0 ? 
                                      Math.round((dados['1° Turno'].produzido / dados['1° Turno'].planejado) * 100) : 0,
                                    eficiencia2: dados['2° Turno'].planejado > 0 ? 
                                      Math.round((dados['2° Turno'].produzido / dados['2° Turno'].planejado) * 100) : 0
                                  }))
                                  .filter(item => 
                                    item['Planejado 1° Turno'] > 0 || item['Produzido 1° Turno'] > 0 ||
                                    item['Planejado 2° Turno'] > 0 || item['Produzido 2° Turno'] > 0
                                  )
                                  .sort((a, b) => a.name.localeCompare(b.name));
                              })()} margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 80
                              }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  interval={0}
                                  tick={{ fontSize: 11 }}
                                />
                                <YAxis tickFormatter={(value: number) => value.toLocaleString('pt-BR')} />
                                <Tooltip 
                                  contentStyle={{
                                    background: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--foreground))',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                  }}
                                  formatter={(value: number, name: string, props: any) => {
                                    const payload = props.payload;
                                    if (name.includes('1° Turno')) {
                                      return [
                                        `${value.toLocaleString('pt-BR')} kg`,
                                        `${name} (Eficiência: ${payload.eficiencia1}%)`
                                      ];
                                    } else {
                                      return [
                                        `${value.toLocaleString('pt-BR')} kg`,
                                        `${name} (Eficiência: ${payload.eficiencia2}%)`
                                      ];
                                    }
                                  }}
                                  labelFormatter={(label: string) => `Classificação: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="Planejado 1° Turno" fill="#3B82F6" name="Planejado 1° Turno" />
                                <Bar dataKey="Produzido 1° Turno" fill="#10B981" name="Produzido 1° Turno" />
                                <Bar dataKey="Planejado 2° Turno" fill="#8B5CF6" name="Planejado 2° Turno" />
                                <Bar dataKey="Produzido 2° Turno" fill="#F59E0B" name="Produzido 2° Turno" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                       </CardContent>
                    </Card>

                      {/* Setores mais produtivos */}
                      {chartDataMemo.setoresChart.length > 0 && <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Boxes className="h-5 w-5" /> Avaliação de Setores
                            </CardTitle>
                            <CardDescription>Métricas de Produtividade dos Setores</CardDescription>
                         </CardHeader>
                         <CardContent className="p-0">
                           <div className="h-[400px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={chartDataMemo.setoresChart.map(item => ({
                       ...item,
                       setor: item.setor === "Sem classificação" || item.setor === "NÃO CADASTRADO" || item.setor === "Não classificado" ? "Sem cadastro" : item.setor
                     }))} layout="vertical" margin={{
                       top: 10,
                       right: 10,
                       left: 60,
                       bottom: 10
                     }} onClick={handleBarClick}>
                                   <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis type="number" domain={[0, 'dataMax + 10000']} tickFormatter={(value: number) => value.toLocaleString('pt-BR')} ticks={(() => {
                         const maxValue = Math.max(...chartDataMemo.setoresChart.map(item => item.producao_real));
                         const maxTick = Math.max(60000, Math.ceil(maxValue / 10000) * 10000);
                         const ticks = [];
                         for (let i = 0; i <= maxTick; i += 10000) {
                           ticks.push(i);
                         }
                         return ticks;
                       })()} />
                                    <YAxis dataKey="setor" type="category" width={60} tick={{
                         fontSize: 11,
                         textAnchor: "end"
                       }} interval={0} tickFormatter={value => value} />
                                <Tooltip contentStyle={{
                         background: 'hsl(var(--background))',
                         borderColor: 'hsl(var(--border))',
                         borderRadius: 'var(--radius)',
                         color: 'hsl(var(--foreground))',
                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                       }} labelStyle={{
                         color: 'hsl(var(--foreground))',
                         fontWeight: '500'
                       }} itemStyle={{
                         color: 'hsl(var(--foreground))'
                       }} formatter={(value: number) => value.toLocaleString('pt-BR')} />
                                  <Bar dataKey="producao_real" name="Produção (KG)" onClick={handleBarClick} style={{
                         cursor: 'pointer'
                       }}>
                                   {chartDataMemo.setoresChart.map((entry, index) => <Cell key={`cell-${index}`} fill={getBarColor(entry.setor, index)} style={{
                           cursor: 'pointer'
                         }} />)}
                                 </Bar>
                               </BarChart>
                              </ResponsiveContainer>
                           </div>
                        </CardContent>
                      </Card>}
                  </div>}

                 {/* Performance por Classificação - ocupando toda a largura */}
                 {pcpData.length > 0 && chartDataMemo.performanceClassificacaoChart.length > 0 && <Card className="w-full mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Performance por Classificação
                      </CardTitle>
                      <CardDescription>Planejado vs Produzido por Classificação de Famílias</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartDataMemo.performanceClassificacaoChart} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                             <XAxis dataKey="name" />
                             <YAxis domain={[0, 'dataMax + 10000']} tickFormatter={(value: number) => value.toLocaleString('pt-BR')} ticks={(() => {
                        const maxValue = Math.max(...chartDataMemo.performanceClassificacaoChart.map(item => Math.max(item.planejado, item.produzido)));
                        const maxTick = Math.max(60000, Math.ceil(maxValue / 10000) * 10000);
                        const ticks = [];
                        for (let i = 0; i <= maxTick; i += 10000) {
                          ticks.push(i);
                        }
                        return ticks;
                      })()} />
                             <Tooltip contentStyle={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }} labelStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: '500'
                    }} itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }} formatter={(value: number) => value.toLocaleString('pt-BR')} />
                            <Legend />
                            <Bar dataKey="planejado" name="Planejado (kg)" fill="hsl(var(--primary))" />
                            <Bar dataKey="produzido" name="Produzido (kg)" fill="hsl(var(--success))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>}

                 {/* Performance por Produto - ocupando toda a largura */}
                 {pcpData.length > 0 && chartDataMemo.performanceChart.length > 0 && <Card className="w-full mb-6">
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <Package className="h-5 w-5" /> Performance por Produto
                       </CardTitle>
                        <CardDescription>Top 2 Melhores Produtos por Classificação de Famílias {
                          period === 'hoje' ? 'Ontem' : 
                          period === 'semana' ? 'Esta Semana' : 
                          period === 'mes' ? 'Este Mês' : 
                          period === 'ano' ? 'Este Ano' : 
                          period === 'personalizado' && customStartDate && customEndDate ? 
                            `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}` : 
                            'Período Selecionado'
                        }</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="h-[300px]">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart 
                               data={chartDataMemo.performanceChart.filter(item => {
                                 const hasData = (item.produzido > 0 || item.planejado > 0);
                                 if (!hasData && !item.isSeparator) return false;
                                 if (!searchTerm) return true;
                                 if (item.isSeparator) return true;
                                 const term = String(searchTerm).toLowerCase();
                                 return String(item.name).toLowerCase().includes(term)
                                   || String(item.produto_nome || '').toLowerCase().includes(term)
                                   || String(item.classificacao || '').toLowerCase().includes(term);
                               })} 
                               margin={{
                                 top: 20,
                                 right: 30,
                                 left: 20,
                                 bottom: 5
                               }}
                             >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }} 
                                interval={0} 
                                angle={-45} 
                                textAnchor="end" 
                                height={80} 
                              />
                              <YAxis 
                                domain={[0, 'dataMax + 10000']} 
                                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                                ticks={(() => {
                                  const maxValue = Math.max(...chartDataMemo.performanceChart.map(item => Math.max(item.produzido || 0, item.planejado || 0)));
                                  const maxTick = Math.max(10000, Math.ceil(maxValue / 10000) * 10000);
                                  const ticks = [];
                                  for (let i = 0; i <= maxTick; i += 10000) {
                                    ticks.push(i);
                                  }
                                  return ticks;
                                })()}
                              />
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
                                content={props => {
                                  if (!props.active || !props.payload || !props.payload[0]) return null;
                                  const data = props.payload[0].payload;

                                  // Não exibir tooltip para barras separadoras
                                  if (data.isSeparator) return null;

                                  return (
                                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-semibold text-foreground mb-1">
                                        {data.classificacao || 'Sem classificação'}
                                      </p>
                                      <p className="text-sm text-foreground mb-1">
                                        {data.produto_nome || 'Produto não identificado'}
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Código: {data.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {data.isUnicoProduto ? 
                                          `Único produto com ${data.produzido.toLocaleString('pt-BR')} kg` : 
                                          `${data.posicao}° melhor da classificação`
                                        }
                                      </p>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-success">
                                          <span className="font-medium">Produzido:</span> {(data.produzido || 0).toLocaleString('pt-BR')} kg
                                        </p>
                                        <p className="text-primary">
                                          <span className="font-medium">Planejado:</span> {(data.planejado || 0).toLocaleString('pt-BR')} kg
                                        </p>
                                        <p className="text-purple-600 dark:text-purple-400">
                                          <span className="font-medium">Eficiência:</span> {data.eficiencia || 0}%
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }} 
                              />
                             <Legend />
                             <Bar dataKey="planejado" name="Planejado (kg)" fill="hsl(var(--primary))" />
                             <Bar dataKey="produzido" name="Produzido (kg)" fill="hsl(var(--success))" />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </CardContent>
                  </Card>}
          </div>}

        {activeTab === "turno1" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrimeiroTurno />
          </React.Suspense>}
        {activeTab === "turno2" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SegundoTurno />
          </React.Suspense>}
        {activeTab === "processamento" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <Processamento />
          </React.Suspense>}
        {activeTab === "resultados" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ResultadosFinais />
          </React.Suspense>}
        {activeTab === "produtos" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <Produtos />
          </React.Suspense>}
        {activeTab === "metas" && <React.Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <Metas />
          </React.Suspense>}

        {/* Modais para produtos sem classificação */}
        <ProdutosSemClassificacaoModal isOpen={showProdutosSemClassificacao} onClose={closeProdutosSemClassificacao} produtos={getProdutosSemClassificacao()} onAdicionarProduto={openAdicionarProduto} />

        <AdicionarProdutoModal isOpen={showAdicionarProduto} onClose={closeAdicionarProduto} produto={produtoSelecionado} onProdutoAdicionado={handleProdutoAdicionadoWithReload} />
        </div>
      </AppLayout>
    </ErrorBoundary>;
};
export default PCP;