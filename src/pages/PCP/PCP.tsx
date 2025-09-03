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

// Importando os componentes das abas
import PrimeiroTurno from "./1turno";
import SegundoTurno from "./2turno";
import Processamento from "./Processamento";
import ResultadosFinais from "./ResultadosFinais";
import Produtos from "./Produtos";
import Sistema from "./Sistema";

// Importando os modais para produtos sem classificação
import ProdutosSemClassificacaoModal from "@/components/PCP/ProdutosSemClassificacaoModal";
import AdicionarProdutoModal from "@/components/PCP/AdicionarProdutoModal";

const COLORS = [
  "hsl(var(--primary))", 
  "hsl(var(--success))", 
  "hsl(var(--warning))", 
  "hsl(var(--info))", 
  "hsl(var(--secondary))", 
  "hsl(var(--accent))", 
  "hsl(var(--muted))"
];

// Cor específica para "Sem classificação"
const getBarColor = (setor: string, index: number) => {
  if (setor === "Sem classificação" || setor === "Não classificado") {
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
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "ano">("hoje");
  
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
    fetchPCPData(period);
  }, [period]);

  // Configurar listener em tempo real
  useEffect(() => {
    const unsubscribe = setupRealtimeListener(period);
    return () => unsubscribe();
  }, [period]);

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
      if (item.classificacao === "Sem classificação" || item.classificacao === "Não classificado" || !item.classificacao) {
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

  // Função para lidar com clique na barra "Sem classificação"
  const handleBarClick = (data: any) => {
    if (data && (data.setor === "Sem classificação" || data.setor === "Não classificado")) {
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
    fetchPCPData(period);
    setShowProdutosSemClassificacao(false);
    setProdutoSelecionado(null);
  };

  // Obter métricas e dados dos gráficos
  const metrics = getMetrics(period);
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

            {error && (
              <Card className="mb-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <p className="text-lg font-medium text-red-600">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                  <Button onClick={() => fetchPCPData(period)} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </Card>
            )}

            {/* Cards de estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard
                title="Produtos Sem Classificação"
                value={metrics.produtosSemClassificacao.toString()}
                icon={<Package className="h-4 w-4" />}
                trend={{
                  value: metrics.produtosCadastrados > 0 ? (metrics.produtosSemClassificacao / metrics.produtosCadastrados * 100) : 0,
                  positive: metrics.produtosSemClassificacao === 0,
                  label: metrics.produtosSemClassificacao === 0 ? "Todos classificados!" : "Precisam atenção"
                }}
                description="Produtos para classificar"
                className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10"
              />
              
              <StatsCard
                title="Total Cadastrados"
                value={metrics.produtosCadastrados.toString()}
                icon={<Boxes className="h-4 w-4" />}
                trend={{
                  value: metrics.produtosCadastrados > 0 ? ((metrics.produtosCadastrados - metrics.produtosSemClassificacao) / metrics.produtosCadastrados * 100) : 0,
                  positive: true,
                  label: `${metrics.produtosCadastrados - metrics.produtosSemClassificacao} com classificação`
                }}
                description="Total no sistema"
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
              />
             
              <StatsCard
                title="Eficiência Média"
                value={`${metrics.eficienciaMedia}%`}
                icon={<BarChart2 className="h-4 w-4" />}
                trend={{
                  value: metrics.eficienciaMedia,
                  positive: metrics.eficienciaMedia >= 85,
                  label: metrics.eficienciaMedia >= 85 ? "Acima da meta" : "Abaixo da meta"
                }}
                description="Meta: 85%"
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10"
              />

              <StatsCard
                title="Produção Total"
                value={metrics.producaoTotal.toLocaleString()}
                icon={<Package className="h-4 w-4" />}
                trend={{
                  value: 15,
                  positive: true,
                  label: `${period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Esta semana' : period === 'mes' ? 'Este mês' : 'Este ano'}`
                }}
                description="Unidades produzidas"
                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/10"
              />
            </div>

            {/* Gráficos */}
            {chartData.turnosChart.length > 0 && (
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
                               data={chartData.setoresChart}
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
                               />
                               <Bar 
                                 dataKey="producao_real" 
                                 name="Produção (un)"
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
                {chartData.performanceChart.length > 0 && (
                  <Card className="w-full">
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
        {activeTab === "sistema" && <Sistema />}

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