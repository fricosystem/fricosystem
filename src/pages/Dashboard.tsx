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

type Requisicao = {
  requisicao_id: string;
  status: string;
  itens: Array<{
    nome: string;
    codigo_material: string;
    quantidade: number;
    valor_unitario: number;
    centro_de_custo: string;
  }>;
  data_criacao: Date | { toDate: () => Date };
  valor_total: number;
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
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);

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

  // Função para converter string de valor para número
  const parseCurrencyValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    
    // Remove pontos de milhar e substitui vírgula decimal por ponto
    const cleanedValue = value.toString().replace(/\./g, '').replace(',', '.');
    const result = parseFloat(cleanedValue) || 0;
    
    console.log(`parseCurrencyValue: "${value}" -> "${cleanedValue}" -> ${result}`);
    return result;
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
        console.log(`=== CARREGAMENTO DE PRODUTOS ===`);
        console.log(`Documentos encontrados: ${produtosSnapshot.docs.length}`);
        
        const produtosData = produtosSnapshot.docs.map((doc, index) => {
          const data = doc.data() as Produto;
          console.log(`[${index + 1}] Documento ${doc.id}:`, data);
          
          // Converter valor_unitario para número
          const valorOriginal = data.valor_unitario;
          data.valor_unitario = parseCurrencyValue(data.valor_unitario?.toString() || '0');
          
          console.log(`  Valor original: ${valorOriginal}, Valor convertido: ${data.valor_unitario}`);
          
          return data;
        });
        setProdutos(produtosData);
        setTotalProdutos(produtosData.length);
        
        // Calcular valor total do estoque
        console.log('=== INÍCIO DO CÁLCULO DE VALOR EM ESTOQUE ===');
        console.log(`Total de produtos encontrados: ${produtosData.length}`);
        
        let valorTotal = 0;
        let produtosComValor = 0;
        let produtosSemValor = 0;
        
        produtosData.forEach((produto, index) => {
          const valorUnitarioOriginal = produto.valor_unitario;
          const quantidadeOriginal = produto.quantidade;
          
          const valorUnitario = Number(produto.valor_unitario) || 0;
          const quantidade = Number(produto.quantidade) || 0;
          const valorTotalProduto = valorUnitario * quantidade;
          
          if (valorUnitario > 0 && quantidade > 0) {
            produtosComValor++;
          } else {
            produtosSemValor++;
          }
          
          valorTotal += valorTotalProduto;
          
          console.log(`[${index + 1}] ${produto.nome}`);
          console.log(`  - Valor Original: ${valorUnitarioOriginal} (tipo: ${typeof valorUnitarioOriginal})`);
          console.log(`  - Quantidade Original: ${quantidadeOriginal} (tipo: ${typeof quantidadeOriginal})`);
          console.log(`  - Valor Convertido: ${valorUnitario}`);
          console.log(`  - Quantidade Convertida: ${quantidade}`);
          console.log(`  - Total do Produto: ${valorTotalProduto}`);
          console.log(`  - Valor Acumulado: ${valorTotal}`);
          console.log('  ---');
        });
        
        console.log(`=== RESUMO DO CÁLCULO ===`);
        console.log(`Produtos com valor: ${produtosComValor}`);
        console.log(`Produtos sem valor: ${produtosSemValor}`);
        console.log(`Valor total final: ${valorTotal}`);
        console.log('=== FIM DO CÁLCULO ===');
        
        setValorEstoque(valorTotal);

        // Identificar produtos com baixo estoque (quantidade < 5)
        const baixoEstoque = produtosData.filter(p => p.quantidade && p.quantidade < 5);
        setProdutosBaixoEstoque(baixoEstoque);

        // Calcular produtos baseado no período selecionado
        const now = new Date();
        
        const produtosFiltrados = produtosData.filter(produto => {
          if (!produto.data_criacao) return false;
          
          const dataCriacao = new Date(produto.data_criacao);
          
          if (period === 'hoje') {
            // Mostrar dados de hoje
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(startOfToday);
            endOfToday.setHours(23, 59, 59, 999);
            return dataCriacao >= startOfToday && dataCriacao <= endOfToday;
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
        setLoadingProgress(80);
        const fornecedoresSnapshot = await getDocs(collection(db, "fornecedores"));
        const fornecedoresData = fornecedoresSnapshot.docs.map(doc => {
          const data = doc.data() as Fornecedor;
          if (!data.razao_social && data.nome) {
            data.razao_social = data.nome;
          }
          return data;
        });
        setFornecedores(fornecedoresData);

        // 6. Carregar requisições
        setLoadingProgress(90);
        const requisicoesSnapshot = await getDocs(collection(db, "requisicoes"));
        const requisicoesData = requisicoesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            data_criacao: data.data_criacao
          } as Requisicao;
        });
        setRequisicoes(requisicoesData);

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
  }, [period, toast]); // Recarregar quando o período mudar

  // Calcular porcentagem de usuários ativos
  const porcentagemAtivos = totalUsuarios > 0 ? (usuariosAtivos / totalUsuarios) * 100 : 0;

  // Calcular porcentagem de produtos cadastrados no período
  const porcentagemProdutosPeriodo = totalProdutos > 0 ? (produtosEsteMes / totalProdutos) * 100 : 0;
  
  // Texto baseado no período
  const getPeriodText = () => {
    switch (period) {
      case 'hoje': return 'hoje';
      case 'semana': return 'esta semana';
      case 'mes': return 'este mês';
      case 'ano': return 'este ano';
      default: return 'no período';
    }
  };

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

  const requisicoesMovimentacaoPorPeriodo = () => {
    const now = new Date();
    let timeLabels: string[] = [];
    let data: Record<string, any>[] = [];

    // Definir intervalos de tempo baseado no período
    if (period === "hoje") {
      timeLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);
    } else if (period === "semana") {
      timeLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    } else if (period === "mes") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      timeLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    } else {
      timeLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
    }

    // Filtrar requisições por período
    const filteredRequisicoes = requisicoes.filter(requisicao => {
      if (!requisicao.data_criacao) return false;
      
      const dataCriacao = convertFirebaseTimestamp(requisicao.data_criacao);
      
      if (period === 'hoje') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        return dataCriacao >= startOfToday && dataCriacao <= endOfToday;
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
    });

    // Extrair todos os centros de custo únicos
    const centrosCusto = new Set<string>();
    filteredRequisicoes.forEach(requisicao => {
      if (requisicao.itens && Array.isArray(requisicao.itens)) {
        requisicao.itens.forEach(item => {
          if (item.centro_de_custo) {
            centrosCusto.add(item.centro_de_custo);
          }
        });
      }
    });

    // Criar estrutura de dados para cada label de tempo
    data = timeLabels.map((label, labelIndex) => {
      const timeData: Record<string, any> = { name: label };
      
      // Para cada centro de custo, calcular as requisições neste período
      Array.from(centrosCusto).forEach(centroCusto => {
        let quantidade = 0;
        
        filteredRequisicoes.forEach(requisicao => {
          const dataCriacao = convertFirebaseTimestamp(requisicao.data_criacao);
          let matches = false;

          // Verificar se a requisição está no período correto
          if (period === "hoje") {
            matches = dataCriacao.getHours() === labelIndex;
          } else if (period === "semana") {
            const dayOfWeek = dataCriacao.getDay();
            matches = dayOfWeek === labelIndex;
          } else if (period === "mes") {
            const dayOfMonth = dataCriacao.getDate();
            matches = dayOfMonth === labelIndex + 1;
          } else {
            const month = dataCriacao.getMonth();
            matches = month === labelIndex;
          }

          if (matches && requisicao.itens) {
            requisicao.itens.forEach(item => {
              if (item.centro_de_custo === centroCusto) {
                quantidade += item.quantidade || 0;
              }
            });
          }
        });

        timeData[centroCusto] = quantidade;
      });

      return timeData;
    });

    return {
      data,
      centrosCusto: Array.from(centrosCusto)
    };
  };

  const transferenciasPorPeriodo = () => {
    const now = new Date();
    let data: { name: string; transferencias: number }[] = [];
    
    if (period === "hoje") {
      // Filtro para hoje
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Por hora hoje
      const hours = Array.from({ length: 24 }, (_, i) => i);
      data = hours.map(hour => ({
        name: `${hour}h`,
        transferencias: transferencias.filter(t => {
          const date = convertFirebaseTimestamp(t.data_transferencia);
          return date >= startOfToday && date <= endOfToday && date.getHours() === hour;
        }).reduce((sum, t) => sum + (t.quantidade || 0), 0)
      }));
    } else if (period === "semana") {
      // Por dia na semana - semana atual
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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
      // Por dia no mês atual
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
      // Por mês no ano atual
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

  // Dados para gráfico de radar (análise de estoque)
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
        subject: 'Transferências',
        A: Math.min(transferencias.length / 50, 100), // Normalizado para escala 0-100
        fullMark: 100,
      },
    ];
  };

  // Dados para gráfico de dispersão (valor vs quantidade)
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

  // Dados para gráfico de produtos por unidade (barras)
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

  // Dados para gráfico composto (valor do estoque por unidade)
  const dadosValorEstoquePorUnidade = () => {
    if (!produtos || produtos.length === 0) {
      return [{ name: 'Sem dados', valor: 0, quantidade: 0 }];
    }
    
    const unidadeMap: Record<string, number> = {};
    
    produtos.forEach(produto => {
      if (produto.unidade) {
        const valorUnitario = Number(produto.valor_unitario) || 0;
        const quantidade = Number(produto.quantidade) || 0;
        const valor = valorUnitario * quantidade;
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

  // Dados para gráfico de requisições por centro de custo
  const requisicoesPorentoCusto = () => {
    if (!requisicoes || requisicoes.length === 0) {
      return [];
    }

    const now = new Date();
    const filteredRequisicoes = requisicoes.filter(requisicao => {
      if (!requisicao.data_criacao) return false;
      
      const dataCriacao = convertFirebaseTimestamp(requisicao.data_criacao);
      
      if (period === 'hoje') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        return dataCriacao >= startOfToday && dataCriacao <= endOfToday;
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
    });

    const centroCustoMap: Record<string, number> = {};
    
    filteredRequisicoes.forEach(requisicao => {
      if (requisicao.itens && Array.isArray(requisicao.itens)) {
        requisicao.itens.forEach(item => {
          if (item.centro_de_custo) {
            centroCustoMap[item.centro_de_custo] = (centroCustoMap[item.centro_de_custo] || 0) + item.quantidade;
          }
        });
      }
    });
    
    return Object.entries(centroCustoMap).map(([name, value], index) => ({
      name: name || 'Centro não definido',
      value: value || 0,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  };

  return (
    <AppLayout title="Dashboard Geral">
      {/* Seletor de período */}
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
              <Layers className="h-4 w-4" /> Mês
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
          {/* Cards de estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="Usuários Ativos"
              value={`${usuariosAtivos}/${totalUsuarios}`}
              icon={<Users className="h-5 w-5" />}
              trend={{
                value: porcentagemAtivos,
                positive: porcentagemAtivos > 70,
                label: `${porcentagemAtivos.toFixed(0)}% de ativos`
              }}
              description="Eficiência da equipe"
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
              description="Valor total do inventário"
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
              description="Itens com estoque crítico"
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/10"
            />
          </div>

          {/* Primeira linha de gráficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
            {/* Movimentação por Centro de Custo - Gráfico de Área Múltipla */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" /> Movimentação por Centro de Custo
                    </CardTitle>
                    <CardDescription>
                      {period === "hoje" ? "Hoje por hora" : 
                       period === "semana" ? "Esta semana por dia" :
                       period === "mes" ? "Este mês por dia" : "Este ano por mês"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {requisicoesMovimentacaoPorPeriodo().centrosCusto.length} centros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={requisicoesMovimentacaoPorPeriodo().data}>
                      <defs>
                        {requisicoesMovimentacaoPorPeriodo().centrosCusto.map((centro, index) => (
                          <linearGradient key={centro} id={`color${centro.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                          </linearGradient>
                        ))}
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
                        formatter={(value, name) => [`${value} itens`, name]}
                      />
                      <Legend />
                      {requisicoesMovimentacaoPorPeriodo().centrosCusto.map((centro, index) => (
                        <Area 
                          key={centro}
                          type="monotone" 
                          dataKey={centro} 
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]} 
                          fillOpacity={1} 
                          fill={`url(#color${centro.replace(/\s+/g, '')})`}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Análise de Estoque - Gráfico de Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" /> Saúde do Estoque
                </CardTitle>
                <CardDescription>Métricas-chave do inventário</CardDescription>
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
                        formatter={(value) => [`${value}%`, 'Índice']}
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

          {/* Segunda linha de gráficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
            {/* Produtos por fornecedor - Gráfico de Barras Horizontais */}
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

            {/* Fornecedores por estado - Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" /> Fornecedores por Estado
                </CardTitle>
                <CardDescription>Distribuição geográfica</CardDescription>
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

            {/* Valor vs Quantidade - Gráfico de Dispersão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" /> Valor vs Quantidade
                </CardTitle>
                <CardDescription>Relação entre valor unitário e estoque</CardDescription>
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

          {/* Terceira linha de gráficos */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
            {/* Requisições por Centro de Custo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Requisições por Centro de Custo
                </CardTitle>
                <CardDescription>Distribuição de requisições {getPeriodText()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={requisicoesPorentoCusto()}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value) => [`${value} itens`, 'Quantidade']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Produtos por unidade - Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" /> Produtos por Unidade
                </CardTitle>
                <CardDescription>Distribuição por localização</CardDescription>
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

            {/* Valor do estoque por unidade - Gráfico Composto */}
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

          {/* Listas de informações */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* Lista de produtos com baixo estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" /> Produtos com Baixo Estoque
                </CardTitle>
                <CardDescription>Itens que precisam de reposição</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {produtosBaixoEstoque.length > 0 ? (
                    produtosBaixoEstoque.slice(0, 5).map((produto, index) => (
                      <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div>
                          <p className="font-medium">{produto.nome || 'Produto sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{produto.fornecedor_nome || 'Fornecedor não especificado'}</p>
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
                      )?.endereco?.estado || 'Não informado';
                      
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