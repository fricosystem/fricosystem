
import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText, Loader2 } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import EmptyState from "@/components/EmptyState";

const Dashboard = () => {
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes">("semana");
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  // Load data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setLoadingProgress(0);
      setError(null);
      
      try {
        // Get total products
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('*');
          
        if (produtosError) {
          console.error("Error loading products:", produtosError);
          // Continue with placeholder data instead of throwing
          setLoadingProgress(25);
        }
        
        // Calculate total value
        const valorTotal = produtos
          ? produtos.reduce((sum, p) => sum + (p.quantidade_atual * p.valor_unitario), 0)
          : 0;
          
        // Get products with low stock
        const produtosBaixoEstoque = produtos
          ? produtos.filter(p => p.quantidade_atual <= p.quantidade_minima)
            .map(p => ({
              id: p.id,
              nome: p.nome,
              quantidadeAtual: p.quantidade_atual,
              quantidadeMinima: p.quantidade_minima
            }))
          : [];
        setLoadingProgress(50);
            
        // Get latest movements
        const { data: movimentacoes, error: movimentacoesError } = await supabase
          .from('movimentacoes')
          .select('*')
          .order('data', { ascending: false })
          .limit(5);
          
        if (movimentacoesError) {
          console.error("Error loading movements:", movimentacoesError);
          // Continue with empty movements
        }
        setLoadingProgress(75);
        
        // Get latest invoices
        const { data: notasFiscais, error: notasFiscaisError } = await supabase
          .from('notas_fiscais')
          .select('*')
          .order('data', { ascending: false })
          .limit(3);
          
        if (notasFiscaisError) {
          console.error("Error loading invoices:", notasFiscaisError);
          // Continue with empty invoices
        }
        setLoadingProgress(100);
        
        // Process latest movements
        let ultimasMovimentacoes = [];
        if (movimentacoes && movimentacoes.length > 0) {
          ultimasMovimentacoes = await Promise.all(movimentacoes.map(async mov => {
            let nomeProduto = "Produto não encontrado";
            
            if (produtos) {
              const produto = produtos.find(p => p.id === mov.produto_id);
              if (produto) nomeProduto = produto.nome;
            }
            
            return {
              id: mov.id,
              produto: nomeProduto,
              tipo: mov.tipo,
              quantidade: mov.quantidade,
              data: formatRelativeDate(mov.data)
            };
          }));
        }
        
        // Format invoices
        const ultimasNotasFiscais = notasFiscais
          ? notasFiscais.map(nota => ({
              id: nota.id,
              fornecedor: nota.fornecedor,
              valor: `R$ ${nota.valor.toFixed(2).replace('.', ',').replace(/\d(?=(\d{3})+,)/g, '$&.')}`,
              data: formatRelativeDate(nota.data),
              status: nota.status
            }))
          : [];
        
        // Update dashboard data
        setDashboardData({
          totalProdutos: produtos ? produtos.length.toString() : "0",
          valorEstoque: `R$ ${valorTotal.toFixed(2).replace('.', ',').replace(/\d(?=(\d{3})+,)/g, '$&.')}`,
          movimentacoes: movimentacoes ? movimentacoes.length.toString() : "0",
          alertas: produtosBaixoEstoque.length.toString(),
          produtosBaixoEstoque,
          ultimasMovimentacoes,
          ultimasNotasFiscais
        });
        
      } catch (error: any) {
        console.error("Error loading dashboard data:", error);
        setError("Não foi possível carregar os dados do dashboard. Verifique sua conexão ou tente novamente mais tarde.");
        
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
  
  // Helper function to format relative dates
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `hoje, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return `ontem, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

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
      ) : error ? (
        <EmptyState
          title="Erro ao carregar dados"
          description={error}
        />
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
          {dashboardData.produtosBaixoEstoque.length > 0 && (
            <div className="mb-6">
              <AlertaBaixoEstoque produtos={dashboardData.produtosBaixoEstoque} />
            </div>
          )}

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
