import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText, Loader2 } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

// Mock data to replace Supabase data
const mockData = {
  hoje: {
    totalProdutos: "42",
    valorEstoque: "R$ 15.678,90",
    movimentacoes: "8",
    alertas: "3",
    produtosBaixoEstoque: [
      { id: 1, nome: "Produto A", quantidadeAtual: 5, quantidadeMinima: 10 },
      { id: 2, nome: "Produto B", quantidadeAtual: 3, quantidadeMinima: 8 },
      { id: 3, nome: "Produto C", quantidadeAtual: 2, quantidadeMinima: 5 }
    ],
    ultimasMovimentacoes: [
      { id: 1, produto: "Produto A", tipo: "saida", quantidade: 2, data: "hoje, 14:30" },
      { id: 2, produto: "Produto B", tipo: "entrada", quantidade: 10, data: "hoje, 11:15" },
      { id: 3, produto: "Produto D", tipo: "saida", quantidade: 5, data: "hoje, 09:20" }
    ],
    ultimasNotasFiscais: [
      { id: "NF-2345", fornecedor: "Fornecedor X", valor: "R$ 1.250,00", data: "hoje, 15:42", status: "pendente" },
      { id: "NF-2344", fornecedor: "Fornecedor Y", valor: "R$ 3.780,50", data: "hoje, 10:15", status: "processada" }
    ]
  },
  semana: {
    totalProdutos: "45",
    valorEstoque: "R$ 17.890,50",
    movimentacoes: "23",
    alertas: "2",
    produtosBaixoEstoque: [
      { id: 1, nome: "Produto A", quantidadeAtual: 5, quantidadeMinima: 10 },
      { id: 2, nome: "Produto C", quantidadeAtual: 2, quantidadeMinima: 5 }
    ],
    ultimasMovimentacoes: [
      { id: 1, produto: "Produto A", tipo: "saida", quantidade: 2, data: "hoje, 14:30" },
      { id: 2, produto: "Produto B", tipo: "entrada", quantidade: 10, data: "ontem, 11:15" },
      { id: 3, produto: "Produto D", tipo: "saida", quantidade: 5, data: "ontem, 09:20" },
      { id: 4, produto: "Produto E", tipo: "entrada", quantidade: 15, data: "há 2 dias" },
      { id: 5, produto: "Produto F", tipo: "saida", quantidade: 3, data: "há 3 dias" }
    ],
    ultimasNotasFiscais: [
      { id: "NF-2345", fornecedor: "Fornecedor X", valor: "R$ 1.250,00", data: "hoje, 15:42", status: "pendente" },
      { id: "NF-2344", fornecedor: "Fornecedor Y", valor: "R$ 3.780,50", data: "ontem, 10:15", status: "processada" },
      { id: "NF-2343", fornecedor: "Fornecedor Z", valor: "R$ 920,75", data: "há 3 dias", status: "processada" }
    ]
  },
  mes: {
    totalProdutos: "52",
    valorEstoque: "R$ 21.457,80",
    movimentacoes: "87",
    alertas: "1",
    produtosBaixoEstoque: [
      { id: 1, nome: "Produto A", quantidadeAtual: 5, quantidadeMinima: 10 }
    ],
    ultimasMovimentacoes: [
      { id: 1, produto: "Produto A", tipo: "saida", quantidade: 2, data: "hoje, 14:30" },
      { id: 2, produto: "Produto B", tipo: "entrada", quantidade: 10, data: "ontem, 11:15" },
      { id: 3, produto: "Produto D", tipo: "saida", quantidade: 5, data: "há 5 dias" },
      { id: 4, produto: "Produto E", tipo: "entrada", quantidade: 15, data: "há 7 dias" },
      { id: 5, produto: "Produto F", tipo: "saida", quantidade: 3, data: "há 12 dias" }
    ],
    ultimasNotasFiscais: [
      { id: "NF-2345", fornecedor: "Fornecedor X", valor: "R$ 1.250,00", data: "hoje, 15:42", status: "pendente" },
      { id: "NF-2344", fornecedor: "Fornecedor Y", valor: "R$ 3.780,50", data: "ontem, 10:15", status: "processada" },
      { id: "NF-2335", fornecedor: "Fornecedor W", valor: "R$ 5.430,25", data: "há 15 dias", status: "processada" }
    ]
  }
};

const Dashboard = () => {
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes">("semana");
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    totalProdutos: "0",
    valorEstoque: "R$ 0,00",
    movimentacoes: "0",
    alertas: "0",
    produtosBaixoEstoque: [],
    ultimasMovimentacoes: [],
    ultimasNotasFiscais: []
  });
  const { toast } = useToast();

  // Simulate loading progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Load mock data instead of fetching from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setLoadingProgress(0);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingProgress(50);
        
        // Simulate another delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingProgress(100);
        
        // Set mock data based on selected period
        setDashboardData(mockData[period]);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [period, toast]);

  return (
    <AppLayout title="Dashboard">
      {/* Seletor de período */}
      <div className="mb-6">
        <Tabs defaultValue="semana" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes")}>
          <TabsList>
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            <TabsTrigger value="mes">Este Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <Card className="mb-6 p-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
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
              title="Total de Produtos"
              value={dashboardData.totalProdutos}
              icon={<Package size={18} />}
              trend={{ value: 2.5, positive: true, label: "vs. período anterior" }}
            />
            <StatsCard
              title="Valor Total em Estoque"
              value={dashboardData.valorEstoque}
              icon={<DollarSign size={18} />}
              trend={{ value: 4.2, positive: true, label: "vs. período anterior" }}
            />
            <StatsCard
              title="Movimentações"
              value={dashboardData.movimentacoes}
              icon={<TrendingUp size={18} />}
              trend={{ value: 1.8, positive: true, label: "vs. período anterior" }}
            />
            <StatsCard
              title="Alertas de Estoque"
              value={dashboardData.alertas}
              icon={<AlertTriangle size={18} />}
              trend={{ value: 0.5, positive: false, label: "vs. período anterior" }}
              className={parseInt(dashboardData.alertas) > 0 ? "border-warning" : ""}
            />
          </div>

          {/* Alertas de baixo estoque */}
          <div className="mb-6">
            <AlertaBaixoEstoque produtos={dashboardData.produtosBaixoEstoque} />
          </div>

          {/* Grid com últimas atividades */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Últimas movimentações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart size={18} /> Últimas Movimentações
                </CardTitle>
                <CardDescription>Últimas entradas e saídas de estoque</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.ultimasMovimentacoes.length > 0 ? (
                    dashboardData.ultimasMovimentacoes.map(movimentacao => (
                      <div key={movimentacao.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{movimentacao.produto}</p>
                          <p className="text-xs text-muted-foreground">{movimentacao.data}</p>
                        </div>
                        <div className={`flex items-center ${movimentacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                          <span>{movimentacao.tipo === 'entrada' ? '+' : '-'}{movimentacao.quantidade}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Nenhuma movimentação recente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Últimas notas fiscais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText size={18} /> Últimas Notas Fiscais
                </CardTitle>
                <CardDescription>Notas fiscais recebidas recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.ultimasNotasFiscais.length > 0 ? (
                    dashboardData.ultimasNotasFiscais.map(nota => (
                      <div key={nota.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{nota.id}</p>
                          <p className="text-xs">{nota.fornecedor}</p>
                          <p className="text-xs text-muted-foreground">{nota.data}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{nota.valor}</p>
                          <span 
                            className={`text-xs px-2 py-1 rounded-full ${
                              nota.status === 'processada' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {nota.status === 'processada' ? 'Processada' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Nenhuma nota fiscal recente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Dashboard;