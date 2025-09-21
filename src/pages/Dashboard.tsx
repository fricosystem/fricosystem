import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText, Loader2, Users, Warehouse, Truck, Boxes, ClipboardList, BarChart2, PieChart as PieChartIcon, Map, Calendar, Clock, Layers } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, ComposedChart, FunnelChart, Funnel, Label } from "recharts";
import { Badge } from "@/components/ui/badge";

// Tipos para os dados do Firestore
type Usuario = {
  nome: string;
  ativo: boolean;
};

type Produto = {
  valor_unitario: number | string;
  deposito: string;
  unidade: string;
  fornecedor_nome: string;
  nome?: string;
  data_criacao?: string;
  quantidade?: number;
};

type Transferencia = {
  data_transferencia: Date | { toDate: () => Date };
  quantidade: number;
};

type Deposito = {
  unidade: string;
};

type Fornecedor = {
  nome: string;
  razao_social?: string;
  endereco?: {
    estado?: string;
  };
  createdAt?: Date | { toDate: () => Date };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

const Dashboard = () => {
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "ano">("hoje");
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();

  // Dados do dashboard
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [usuariosAtivos, setUsuariosAtivos] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [produtosEsteMes, setProdutosEsteMes] = useState(0);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<Produto[]>([]);

  // FunÃ§Ã£o para converter timestamp do Firestore para Date
  const convertFirebaseTimestamp = (timestamp: Date | { toDate: () => Date }): Date => {
    return timestamp instanceof Date ? timestamp : timestamp.toDate();
  };

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // FunÃ§Ã£o para converter string de valor para nÃºmero
  const parseCurrencyValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    
    // Remove pontos de milhar e substitui vÃ­rgula decimal por ponto
    const cleanedValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedValue) || 0;
  };

  // Carregar dados do Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingProgress(0);
      
      try {
        // 1. Carregar usuÃ¡rios
        setLoadingProgress(10);
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        const usuariosData = usuariosSnapshot.docs.map(doc => doc.data() as Usuario);
        setTotalUsuarios(usuariosData.length);
        const ativos = usuariosData.filter(u => u.ativo).length;
        setUsuariosAtivos(ativos);

        // 2. Carregar produtos
        setLoadingProgress(30);
        const produtosSnapshot = await getDocs(collection(db, "produtos"));
        const produtosData = produtosSnapshot.docs.map(doc => {
          const data = doc.data() as Produto;
          // Converter valor_unitario para nÃºmero
          data.valor_unitario = parseCurrencyValue(data.valor_unitario?.toString() || '0');
          return data;
        });
        setProdutos(produtosData);
        setTotalProdutos(produtosData.length);
        
        // Calcular valor total do estoque
        const valorTotal = produtosData.reduce((sum, produto) => {
          const valorUnitario = Number(produto.valor_unitario);
          const quantidade = produto.quantidade || 1;
          return sum + (valorUnitario * quantidade);
        }, 0);
        setValorEstoque(valorTotal);

        // Identificar produtos com baixo estoque (quantidade < 5)
        const baixoEstoque = produtosData.filter(p => p.quantidade && p.quantidade < 5);
        setProdutosBaixoEstoque(baixoEstoque);

        // Calcular produtos baseado no perÃ­odo selecionado
        const now = new Date();
        
        const produtosFiltrados = produtosData.filter(produto => {
          if (!produto.data_criacao) return false;
          
          const dataCriacao = new Date(produto.data_criacao);
          
          if (period === 'hoje') {
            // Alterar para mostrar dados do dia anterior
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endOfYesterday = new Date(startOfYesterday);
            endOfYesterday.setHours(23, 59, 59, 999);
            return dataCriacao >= startOfYesterday && dataCriacao <= endOfYesterday;
          } else if (period === 'semana') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return dataCriacao >= startOfWeek && dataCriacao <= endOfWeek;
          } else if (period === 'mes') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            return dataCriacao >= startOfMonth && dataCriacao <= endOfMonth;
          } else if (period === 'ano') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            endOfYear.setHours(23, 59, 59, 999);
            return dataCriacao >= startOfYear && dataCriacao <= endOfYear;
          }
          
          return false;
        }).length;
        
        setProdutosEsteMes(produtosFiltrados);

        // 3. Carregar transferÃªncias
        setLoadingProgress(50);
        const transferenciasSnapshot = await getDocs(collection(db, "transferencias"));
        const transferenciasData = transferenciasSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            data_transferencia: data.data_transferencia
          } as Transferencia;
        });
        setTransferencias(transferenciasData);

        // 4. Carregar depÃ³sitos
        setLoadingProgress(70);
        const depositosSnapshot = await getDocs(collection(db, "depositos"));
        const depositosData = depositosSnapshot.docs.map(doc => doc.data() as Deposito);
        setDepositos(depositosData);
        
        const unidadesUnicas = [...new Set(depositosData.map(d => d.unidade))];
        setUnidades(unidadesUnicas);

        // 5. Carregar fornecedores
        setLoadingProgress(90);
        const fornecedoresSnapshot = await getDocs(collection(db, "fornecedores"));
        const fornecedoresData = fornecedoresSnapshot.docs.map(doc => {
          const data = doc.data() as Fornecedor;
          if (!data.razao_social && data.nome) {
            data.razao_social = data.nome;
          }
          return data;
        });
        setFornecedores(fornecedoresData);

        setLoadingProgress(100);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "NÃ£o foi possÃ­vel carregar os dados do Firestore.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, toast]); // Recarregar quando o perÃ­odo mudar

  // Calcular porcentagem de usuÃ¡rios ativos
  const porcentagemAtivos = totalUsuarios > 0 ? (usuariosAtivos / totalUsuarios) * 100 : 0;

  // Calcular porcentagem de produtos cadastrados no perÃ­odo
  const porcentagemProdutosPeriodo = totalProdutos > 0 ? (produtosEsteMes / totalProdutos) * 100 : 0;
  
  // Texto baseado no perÃ­odo
  const getPeriodText = () => {
    switch (period) {
      case 'hoje': return 'hoje';
      case 'semana': return 'esta semana';
      case 'mes': return 'este mÃªs';
      case 'ano': return 'este ano';
      default: return 'no perÃ­odo';
    }
  };

  // Preparar dados para grÃ¡ficos
  const produtosPorFornecedor = () => {
    const fornecedorCount: Record<string, number> = {};
    
    produtos.forEach(produto => {
      if (produto.fornecedor_nome) {
        const nomeFornecedor = produto.fornecedor_nome.trim();
        fornecedorCount[nomeFornecedor] = (fornecedorCount[nomeFornecedor] || 0) + 1;
      }
    });
    
    return Object.entries(fornecedorCount).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const produtosPorUnidade = () => {
    const unidadeCount: Record<string, number> = {};
    
    produtos.forEach(produto => {
      if (produto.unidade) {
        unidadeCount[produto.unidade] = (unidadeCount[produto.unidade] || 0) + 1;
      }
    });
    
    return Object.entries(unidadeCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const fornecedoresPorEstado = () => {
    const estadoCount: Record<string, number> = {};
    
    fornecedores.forEach(fornecedor => {
      const estado = fornecedor.endereco?.estado || 'NÃ£o informado';
      estadoCount[estado] = (estadoCount[estado] || 0) + 1;
    });
    
    return Object.entries(estadoCount).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  };

  const transferenciasPorPeriodo = () => {
    const now = new Date();
    let data: { name: string; transferencias: number }[] = [];
    
    if (period === "hoje") {
      // Filtro para o dia anterior
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      // Por hora ontem
      const hours = Array.from({ length: 24 }, (_, i) => i);
      data = hours.map(hour => ({
        name: `${hour}h`,
        transferencias: transferencias.filter(t => {
          const date = convertFirebaseTimestamp(t.data_transferencia);
          return date >= startOfYesterday && date <= endOfYesterday && date.getHours() === hour;
        }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
      }));
    } else if (period === "semana") {
      // Por dia na semana - semana atual
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      data = days.map((day, i) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const endOfDay = new Date(dayDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        return {
          name: day,
          transferencias: transferencias.filter(t => {
            const date = convertFirebaseTimestamp(t.data_transferencia);
            return date >= dayDate && date <= endOfDay;
          }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
        };
      });
    } else if (period === "mes") {
      // Por dia no mÃªs atual
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInMonth = endOfMonth.getDate();
      
      data = Array.from({ length: daysInMonth }, (_, i) => {
        const dayDate = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const endOfDay = new Date(dayDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        return {
          name: `${i + 1}`,
          transferencias: transferencias.filter(t => {
            const date = convertFirebaseTimestamp(t.data_transferencia);
            return date >= dayDate && date <= endOfDay;
          }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
        };
      });
    } else {
      // Por mÃªs no ano atual
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
      data = months.map((month, i) => {
        const startOfMonth = new Date(now.getFullYear(), i, 1);
        const endOfMonth = new Date(now.getFullYear(), i + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        return {
          name: month,
          transferencias: transferencias.filter(t => {
            const date = convertFirebaseTimestamp(t.data_transferencia);
            return date >= startOfMonth && date <= endOfMonth;
          }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
        };
      });
    }
    
    return data;
  };

  const tempoCadastroFornecedores = () => {
    const now = new Date();
    return fornecedores
      .filter(f => f.createdAt && (f.razao_social || f.nome))
      .map(fornecedor => {
        const createdAt = fornecedor.createdAt ? convertFirebaseTimestamp(fornecedor.createdAt) : now;
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          name: fornecedor.razao_social || fornecedor.nome || 'Fornecedor sem nome',
          dias: diffDays
        };
      })
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 5);
  };

  // Contar produtos por fornecedor
  const contarProdutosPorFornecedor = (fornecedorNome: string) => {
    return produtos.filter(p => 
      p.fornecedor_nome && p.fornecedor_nome.trim() === fornecedorNome.trim()
    ).length;
  };

  // Dados para grÃ¡fico de radar (anÃ¡lise de estoque)
  const dadosAnaliseEstoque = () => {
    return [
      {
        subject: 'Valor Total',
        A: Math.min(valorEstoque / 10000, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
      {
        subject: 'Produtos',
        A: Math.min(totalProdutos / 100, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
      {
        subject: 'Fornecedores',
        A: Math.min(fornecedores.length / 10, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
      {
        subject: 'Unidades',
        A: Math.min(unidades.length / 5, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
      {
        subject: 'TransferÃªncias',
        A: Math.min(transferencias.length / 50, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
    ];
  };

  // Dados para grÃ¡fico de dispersÃ£o (valor vs quantidade)
  const dadosValorQuantidade = () => {
    if (!produtos || produtos.length === 0) {
      return [{ x: 0, y: 0, z: 20, name: 'Sem dados' }];
    }
    return produtos
      .filter(p => p.valor_unitario && p.quantidade)
      .slice(0, 50)
      .map(p => ({
        x: Number(p.valor_unitario) || 0,
        y: p.quantidade || 1,
        z: 20,
        name: p.nome || 'Produto sem nome'
      }));
  };

  // Dados para grÃ¡fico de produtos por unidade (barras)
  const dadosProdutosPorUnidade = () => {
    const data = produtosPorUnidade();
    if (!data || data.length === 0) {
      return [{ name: 'Sem dados', value: 0 }];
    }
    return data.map((item, index) => ({
      name: item.name || 'Unidade sem nome',
      value: item.value || 0,
      fill: COLORS[index % COLORS.length]
    }));
  };

  // Dados para grÃ¡fico composto (valor do estoque por unidade)
  const dadosValorEstoquePorUnidade = () => {
    if (!produtos || produtos.length === 0) {
      return [{ name: 'Sem dados', valor: 0, quantidade: 0 }];
    }
    
    const unidadeMap: Record<string, number> = {};
    
    produtos.forEach(produto => {
      if (produto.unidade) {
        const valor = Number(produto.valor_unitario || 0) * (produto.quantidade || 1);
        unidadeMap[produto.unidade] = (unidadeMap[produto.unidade] || 0) + valor;
      }
    });
    
    if (Object.keys(unidadeMap).length === 0) {
      return [{ name: 'Sem unidades', valor: 0, quantidade: 0 }];
    }
    
    return Object.entries(unidadeMap).map(([name, value]) => ({
      name: name || 'Unidade sem nome',
      valor: value || 0,
      quantidade: produtos.filter(p => p.unidade === name).length || 0
    }));
  };

  return (
    <AppLayout title="Dashboard Geral ( Teste IDE )">
      {/* Seletor de perÃ­odo */}
      <div className="mb-6">
        <Tabs defaultValue="hoje" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes" | "ano")}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="hoje" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Hoje
            </TabsTrigger>
            <TabsTrigger value="semana" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Semana
            </TabsTrigger>
            <TabsTrigger value="mes" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> MÃªs
            </TabsTrigger>
            <TabsTrigger value="ano" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Ano
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
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
          {/* Cards de estatÃ­sticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="UsuÃ¡rios Ativos"
              value={`${usuariosAtivos}/${totalUsuarios}`}
              icon={<Users className="h-5 w-5" />}
              trend={{
                value: porcentagemAtivos,
                positive: porcentagemAtivos > 70,
                label: `${porcentagemAtivos.toFixed(0)}% de ativos`
              }}
              description="EficiÃªncia da equipe"
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
            />
            <StatsCard
              title="Total de Produtos"
              value={totalProdutos.toString()}
              icon={<Package className="h-5 w-5" />}
              description="Diversidade de itens"
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10"
            />
            <StatsCard
              title="Valor em Estoque"
              value={formatCurrency(valorEstoque)}
              icon={<DollarSign className="h-5 w-5" />}
              description="Valor total do inventÃ¡rio"
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10"
            />
            <StatsCard
              title="Baixo Estoque"
              value={produtosBaixoEstoque.length.toString()}
              icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
              trend={{
                value: (produtosBaixoEstoque.length / totalProdutos) * 100,
                positive: false,
                label: `${((produtosBaixoEstoque.length / totalProdutos) * 100).toFixed(1)}%`
              }}
              description="Itens com estoque crÃ­tico"
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/10"
            />
          </div>

          {/* Primeira linha de grÃ¡ficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
            {/* TransferÃªncias por perÃ­odo - GrÃ¡fico de Ãrea */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" /> MovimentaÃ§Ã£o de Estoque
                    </CardTitle>
                    <CardDescription>
                      {period === "hoje" ? "Ontem por hora" : 
                       period === "semana" ? "Esta semana por dia" :
                       period === "mes" ? "Este mÃªs por dia" : "Este ano por mÃªs"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {transferencias.length} transferÃªncias
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={transferenciasPorPeriodo()}>
                      <defs>
                        <linearGradient id="colorTransferencias" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value} itens`, 'Quantidade']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="transferencias" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorTransferencias)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AnÃ¡lise de Estoque - GrÃ¡fico de Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" /> SaÃºde do Estoque
                </CardTitle>
                <CardDescription>MÃ©tricas-chave do inventÃ¡rio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dadosAnaliseEstoque()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value}%`, 'Ãndice']}
                      />
                      <Radar 
                        name="Estoque" 
                        dataKey="A" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de grÃ¡ficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
            {/* Produtos por fornecedor - GrÃ¡fico de Barras Horizontais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" /> Top Fornecedores
                </CardTitle>
                <CardDescription>Por quantidade de produtos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={produtosPorFornecedor()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value} produtos`, 'Quantidade']}
                      />
                      <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fornecedores por estado - GrÃ¡fico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" /> Fornecedores por Estado
                </CardTitle>
                <CardDescription>DistribuiÃ§Ã£o geogrÃ¡fica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fornecedoresPorEstado()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {fornecedoresPorEstado().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value} fornecedores`, 'Quantidade']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Valor vs Quantidade - GrÃ¡fico de DispersÃ£o */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" /> Valor vs Quantidade
                </CardTitle>
                <CardDescription>RelaÃ§Ã£o entre valor unitÃ¡rio e estoque</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" dataKey="x" name="Valor" unit="R$" />
                      <YAxis type="number" dataKey="y" name="Quantidade" />
                      <ZAxis type="number" dataKey="z" range={[20, 100]} />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value, name, props) => {
                          if (name === 'x') return [formatCurrency(Number(value)), 'Valor'];
                          if (name === 'y') return [value, 'Quantidade'];
                          return [value, name];
                        }}
                      />
                      <Scatter name="Produtos" data={dadosValorQuantidade()} fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de grÃ¡ficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-6">
            {/* Produtos por unidade - GrÃ¡fico de Funil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" /> Produtos por Unidade
                </CardTitle>
                <CardDescription>DistribuiÃ§Ã£o por localizaÃ§Ã£o</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosProdutosPorUnidade()}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value} produtos`, 'Quantidade']}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Valor do estoque por unidade - GrÃ¡fico Composto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Valor por Unidade
                </CardTitle>
                <CardDescription>Valor total do estoque por local</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={dadosValorEstoquePorUnidade()}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value, name) => {
                          if (name === 'valor') return [formatCurrency(Number(value)), 'Valor'];
                          if (name === 'quantidade') return [value, 'Produtos'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="valor" name="Valor" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="quantidade" name="Produtos" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listas de informaÃ§Ãµes */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* Lista de produtos com baixo estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" /> Produtos com Baixo Estoque
                </CardTitle>
                <CardDescription>Itens que precisam de reposiÃ§Ã£o</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {produtosBaixoEstoque.length > 0 ? (
                    produtosBaixoEstoque.slice(0, 5).map((produto, index) => (
                      <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div>
                          <p className="font-medium">{produto.nome || 'Produto sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{produto.fornecedor_nome || 'Fornecedor nÃ£o especificado'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-yellow-600">{produto.quantidade} un.</p>
                          <p className="text-sm">{formatCurrency(Number(produto.valor_unitario))} cada</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhum produto com estoque baixo encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de fornecedores mais antigos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Fornecedores Mais Antigos
                </CardTitle>
                <CardDescription>Por tempo de relacionamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tempoCadastroFornecedores().length > 0 ? (
                    tempoCadastroFornecedores().map((fornecedor, index) => {
                      const estado = fornecedores.find(f => 
                        (f.razao_social || f.nome) === fornecedor.name
                      )?.endereco?.estado || 'NÃ£o informado';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div>
                            <p className="font-medium">{fornecedor.name}</p>
                            <p className="text-sm text-muted-foreground">{estado}</p>
                          </div>
                          <Badge variant="secondary" className="px-3 py-1">
                            {fornecedor.dias} dias
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhum fornecedor cadastrado
                    </div>
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