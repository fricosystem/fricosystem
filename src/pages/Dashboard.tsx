import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText, Loader2, Users, Warehouse, Truck } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

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

  // Função para converter timestamp do Firestore para Date
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

  // Carregar dados do Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingProgress(0);
      
      try {
        // 1. Carregar usuários
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
          // Garantir que valor_unitario é um número
          if (typeof data.valor_unitario === 'string') {
            data.valor_unitario = parseFloat(data.valor_unitario.toString().replace(/\./g, '').replace(',', '.'));
          }
          return data;
        });
        setProdutos(produtosData);
        setTotalProdutos(produtosData.length);
        
        const valorTotal = produtosData.reduce((sum, produto) => sum + (Number(produto.valor_unitario) || 0), 0);
        setValorEstoque(valorTotal);

        // Calcular produtos deste mês
        const now = new Date();
        const mesAtual = now.getMonth();
        const anoAtual = now.getFullYear();
        
        const produtosMes = produtosData.filter(produto => {
          if (!produto.data_criacao) return false;
          
          const dataCriacao = new Date(produto.data_criacao);
          return dataCriacao.getMonth() === mesAtual && 
                 dataCriacao.getFullYear() === anoAtual;
        }).length;
        
        setProdutosEsteMes(produtosMes);

        // 3. Carregar transferências
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

        // 4. Carregar depósitos
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
          description: "Não foi possível carregar os dados do Firestore.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Calcular porcentagem de usuários ativos
  const porcentagemAtivos = totalUsuarios > 0 ? (usuariosAtivos / totalUsuarios) * 100 : 0;

  // Calcular porcentagem de produtos cadastrados este mês
  const porcentagemProdutosEsteMes = totalProdutos > 0 ? (produtosEsteMes / totalProdutos) * 100 : 0;

  // Preparar dados para gráficos
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
      const estado = fornecedor.endereco?.estado || 'Não informado';
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
      // Por hora hoje
      const hours = Array.from({ length: 24 }, (_, i) => i);
      data = hours.map(hour => ({
        name: `${hour}h`,
        transferencias: transferencias.filter(t => {
          const date = convertFirebaseTimestamp(t.data_transferencia);
          return date.getDate() === now.getDate() && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() && 
                 date.getHours() === hour;
        }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
      }));
    } else if (period === "semana") {
      // Por dia na semana
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      data = days.map((day, i) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        return {
          name: day,
          transferencias: transferencias.filter(t => {
            const date = convertFirebaseTimestamp(t.data_transferencia);
            return date.getDate() === dayDate.getDate() && 
                   date.getMonth() === dayDate.getMonth() && 
                   date.getFullYear() === dayDate.getFullYear();
          }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
        };
      });
    } else if (period === "mes") {
      // Por dia no mês
      const daysInMonth = getDaysInMonth(now.getMonth() + 1, now.getFullYear());
      data = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        transferencias: transferencias.filter(t => {
          const date = convertFirebaseTimestamp(t.data_transferencia);
          return date.getDate() === i + 1 && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear();
        }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
      }));
    } else {
      // Por mês no ano
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
      data = months.map((month, i) => ({
        name: month,
        transferencias: transferencias.filter(t => {
          const date = convertFirebaseTimestamp(t.data_transferencia);
          return date.getMonth() === i && 
                 date.getFullYear() === now.getFullYear();
        }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
      }));
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

  return (
    <AppLayout title="Dashboard">
      {/* Seletor de período */}
      <div className="mb-6 shadow-sm">
        <Tabs defaultValue="hoje" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes" | "ano")}>
          <TabsList className="shadow-sm">
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            <TabsTrigger value="mes">Este Mês</TabsTrigger>
            <TabsTrigger value="ano">Este Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <Card className="mb-6 p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-800">Carregando dados do dashboard...</p>
            <div className="w-full max-w-md">
              <Progress value={loadingProgress} className="h-2 shadow-sm" />
              <p className="text-sm text-muted-foreground text-center mt-2 shadow-sm">{loadingProgress}%</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Cards de estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="Usuários Ativos"
              value={`${usuariosAtivos}/${totalUsuarios}`}
              icon={<Users size={18} />}
              trend={{
                value: porcentagemAtivos,
                positive: true,
                label: `${porcentagemAtivos.toFixed(0)}% de usuários ativos`
              }}
              className="shadow-sm"
            />
            <StatsCard
              title="Total de Produtos"
              value={totalProdutos.toString()}
              icon={<Package size={18} />}
              trend={{
                value: porcentagemProdutosEsteMes,
                positive: true,
                label: `${produtosEsteMes} (${porcentagemProdutosEsteMes.toFixed(0)}%) cadastrados este mês`
              }}
              className="shadow-sm"
            />
            <StatsCard
              title="Valor Total em Estoque"
              value={formatCurrency(valorEstoque)}
              icon={<DollarSign size={18} />}
              className="shadow-sm"
            />
            <StatsCard
              title="Unidades Cadastradas"
              value={unidades.length.toString()}
              icon={<Warehouse size={18} />}
              className="shadow-sm"
            />
          </div>

          {/* Gráficos principais */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {/* Transferências por período */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Transferências por Período</CardTitle>
                <CardDescription className="text-gray-600">
                  {period === "hoje" ? "Hoje por hora" : 
                   period === "semana" ? "Esta semana por dia" : 
                   period === "mes" ? "Este mês por dia" : "Este ano por mês"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transferenciasPorPeriodo()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="transferencias" name="Transferências" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fornecedores por estado - Gráfico de Barras */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Fornecedores por Estado</CardTitle>
                <CardDescription className="text-gray-600">Distribuição geográfica dos fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fornecedoresPorEstado()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Fornecedores" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mais gráficos e informações */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Produtos por fornecedor */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Produtos por Fornecedor</CardTitle>
                <CardDescription className="text-gray-600">Top 5 fornecedores com mais produtos fornecidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={produtosPorFornecedor()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="name" type="category" width={80} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Produtos" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tempo de cadastro dos fornecedores */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Tempo de Cadastro</CardTitle>
                <CardDescription className="text-gray-600">Top 5 fornecedores mais antigos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempoCadastroFornecedores()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="dias" name="Dias cadastrado" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Produtos por unidade */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Produtos por Unidade</CardTitle>
                <CardDescription className="text-gray-600">Distribuição por unidade de medida</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={produtosPorUnidade()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {produtosPorUnidade().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listas de informações */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Lista de unidades */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <Warehouse size={18} /> Unidades com mais produtos
                </CardTitle>
                <CardDescription className="text-gray-600">Veja quais unidades tem mais produtos cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unidades.length > 0 ? (
                    unidades.map((unidade, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <p className="font-medium text-gray-800">{unidade}</p>
                        <p className="text-sm text-gray-600">
                          {produtos.filter(p => p.unidade === unidade).length} produtos
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-600">Nenhuma unidade cadastrada</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de fornecedores */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <Truck size={18} /> Fornecedores Cadastrados
                </CardTitle>
                <CardDescription className="text-gray-600">Informações sobre os fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fornecedores.length > 0 ? (
                    fornecedores
                      .filter(f => f.razao_social || f.nome)
                      .slice(0, 5)
                      .map((fornecedor, index) => {
                        const nomeFornecedor = fornecedor.razao_social || fornecedor.nome || 'Fornecedor sem nome';
                        const produtosCount = contarProdutosPorFornecedor(nomeFornecedor);
                        const estado = fornecedor.endereco?.estado || 'Não informado';
                        
                        return (
                          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium text-gray-800">{nomeFornecedor}</p>
                              <p className="text-xs text-gray-600">{estado}</p>
                            </div>
                            <div className="text-right">
                              {fornecedor.createdAt ? (
                                <p className="text-sm text-gray-600">
                                  Cadastrado em {formatDate(convertFirebaseTimestamp(fornecedor.createdAt))}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-600">Data não disponível</p>
                              )}
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 shadow-sm">
                                {produtosCount} produto{produtosCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-center py-4 text-gray-600">Nenhum fornecedor cadastrado</p>
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