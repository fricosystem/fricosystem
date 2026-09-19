import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText, Loader2, Users, Warehouse, Truck, Boxes, ClipboardList, BarChart2, PieChart as PieChartIcon, Map, Calendar, Clock, Layers, Wrench, Factory } from "lucide-react";
import { ManutencaoCharts } from "@/components/Dashboard/ManutencaoCharts";
import { PCPCharts } from "@/components/Dashboard/PCPCharts";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, ComposedChart, FunnelChart, Funnel, Label } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePostMessageFix } from "@/hooks/usePostMessageFix";

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
  data_transferencia: Date | {
    toDate: () => Date;
  };
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
  createdAt?: Date | {
    toDate: () => Date;
  };
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
  data_criacao: Date | {
    toDate: () => Date;
  };
  valor_total: number;
};
type Relatorio = {
  id: string;
  requisicao_id: string;
  produto_id: string;
  codigo_material: string;
  nome_produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: 'entrada' | 'saida';
  tipo?: string;
  solicitante: {
    id: string;
    nome: string;
    cargo: string;
  };
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  deposito?: string;
  prateleira?: string;
  centro_de_custo: string;
  unidade: string;
  data_saida: Date | {
    toDate: () => Date;
  };
  data_registro: Date | {
    toDate: () => Date;
  };
};
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

const Dashboard = () => {
  // Aplica correção para DataCloneError
  usePostMessageFix();

  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "ano" | "personalizado">("hoje");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
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
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);

  // Função para converter timestamp do Firestore para Date
  const convertFirebaseTimestamp = (timestamp: any): Date => {
    if (!timestamp) {
      console.warn('convertFirebaseTimestamp: timestamp is null/undefined, using current date');
      return new Date();
    }
    
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Formato específico do Firestore com seconds e nanoseconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      try {
        // Converter segundos para milissegundos e adicionar nanossegundos convertidos
        const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
        const date = new Date(milliseconds);
        return date;
      } catch (error) {
        console.warn('convertFirebaseTimestamp: error converting Firestore timestamp:', error);
        return new Date();
      }
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    if (typeof timestamp === 'string') {
      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        console.warn('convertFirebaseTimestamp: invalid date string:', timestamp);
        return new Date();
      }
      return parsedDate;
    }
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      try {
        return timestamp.toDate();
      } catch (error) {
        console.warn('convertFirebaseTimestamp: error calling toDate():', error);
        return new Date();
      }
    }
    
    console.warn('convertFirebaseTimestamp: unexpected timestamp type:', typeof timestamp, timestamp);
    return new Date();
  };

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
    return result;
  };

  // Cache keys
  const CACHE_KEYS = {
    dashboard: 'dashboard_data_cache',
    timestamp: 'dashboard_cache_timestamp',
    version: 'dashboard_cache_version'
  };

  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
  const CACHE_VERSION = '1.0';

  // Verificar se o cache é válido
  const isCacheValid = () => {
    const cacheTimestamp = localStorage.getItem(CACHE_KEYS.timestamp);
    const cacheVersion = localStorage.getItem(CACHE_KEYS.version);
    
    if (!cacheTimestamp || !cacheVersion || cacheVersion !== CACHE_VERSION) {
      return false;
    }
    
    const now = Date.now();
    const timestamp = parseInt(cacheTimestamp);
    return (now - timestamp) < CACHE_DURATION;
  };

  // Carregar dados do cache
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEYS.dashboard);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setTotalUsuarios(data.totalUsuarios || 0);
        setUsuariosAtivos(data.usuariosAtivos || 0);
        setTotalProdutos(data.totalProdutos || 0);
        setValorEstoque(data.valorEstoque || 0);
        setUnidades(data.unidades || []);
        setFornecedores(data.fornecedores || []);
        setTransferencias(data.transferencias || []);
        setProdutos(data.produtos || []);
        setDepositos(data.depositos || []);
        setProdutosEsteMes(data.produtosEsteMes || 0);
        setProdutosBaixoEstoque(data.produtosBaixoEstoque || []);
        setRequisicoes(data.requisicoes || []);
        setRelatorios(data.relatorios || []);
        setDataLoaded(true);
        return true;
      }
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
      localStorage.removeItem(CACHE_KEYS.dashboard);
      localStorage.removeItem(CACHE_KEYS.timestamp);
    }
    return false;
  };

  // Salvar dados no cache
  const saveToCache = (data: any) => {
    try {
      localStorage.setItem(CACHE_KEYS.dashboard, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
      localStorage.setItem(CACHE_KEYS.version, CACHE_VERSION);
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  };

  // Carregar dados do Firestore
  const fetchFirestoreData = async () => {
    setLoading(true);
    try {
      // Realizar todas as consultas em paralelo para melhor performance
      const [
        usuariosSnapshot,
        produtosSnapshot,
        transferenciasSnapshot,
        depositosSnapshot,
        fornecedoresSnapshot,
        requisicoesSnapshot,
        relatoriosSnapshot
      ] = await Promise.all([
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "produtos")),
        getDocs(collection(db, "transferencias")),
        getDocs(collection(db, "depositos")),
        getDocs(collection(db, "fornecedores")),
        getDocs(collection(db, "requisicoes")),
        getDocs(collection(db, "relatorios"))
      ]);

      // Processar usuários
      const usuariosData = usuariosSnapshot.docs.map(doc => doc.data() as Usuario);
      const totalUsuarios = usuariosData.length;
      const usuariosAtivos = usuariosData.filter(u => u.ativo).length;

      // Processar produtos
      const produtosData = produtosSnapshot.docs.map((doc) => {
        const data = doc.data() as Produto;
        data.valor_unitario = parseCurrencyValue(data.valor_unitario?.toString() || '0');
        return data;
      });
      const totalProdutos = produtosData.length;

      // Calcular valor total do estoque de forma otimizada
      const valorEstoque = produtosData.reduce((total, produto) => {
        const valorUnitario = Number(produto.valor_unitario) || 0;
        const quantidade = Number(produto.quantidade) || 0;
        return total + (valorUnitario * quantidade);
      }, 0);

      // Produtos com baixo estoque
      const produtosBaixoEstoque = produtosData.filter(p => p.quantidade && p.quantidade < 5);

      // Processar transferências
      const transferenciasData = transferenciasSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, data_transferencia: data.data_transferencia } as Transferencia;
      });

      // Processar depósitos
      const depositosData = depositosSnapshot.docs.map(doc => doc.data() as Deposito);
      const unidades = [...new Set(depositosData.map(d => d.unidade))];

      // Processar fornecedores
      const fornecedoresData = fornecedoresSnapshot.docs.map(doc => {
        const data = doc.data() as Fornecedor;
        if (!data.razao_social && data.nome) {
          data.razao_social = data.nome;
        }
        return data;
      });

      // Processar requisições
      const requisicoesData = requisicoesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, data_criacao: data.data_criacao } as Requisicao;
      });

      // Processar relatórios
      const relatoriosData = relatoriosSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          ...data, 
          data_registro: data.data_registro,
          data_saida: data.data_saida 
        } as Relatorio;
      });

      // Calcular produtos do período atual (otimizado)
      const produtosEsteMes = calculatePeriodProducts(produtosData);

      // Dados para cache
      const dataToCache = {
        totalUsuarios,
        usuariosAtivos,
        totalProdutos,
        valorEstoque,
        unidades,
        fornecedores: fornecedoresData,
        transferencias: transferenciasData,
        produtos: produtosData,
        depositos: depositosData,
        produtosEsteMes,
        produtosBaixoEstoque,
        requisicoes: requisicoesData,
        relatorios: relatoriosData
      };

      // Atualizar estados
      setTotalUsuarios(totalUsuarios);
      setUsuariosAtivos(usuariosAtivos);
      setTotalProdutos(totalProdutos);
      setValorEstoque(valorEstoque);
      setUnidades(unidades);
      setFornecedores(fornecedoresData);
      setTransferencias(transferenciasData);
      setProdutos(produtosData);
      setDepositos(depositosData);
      setProdutosEsteMes(produtosEsteMes);
      setProdutosBaixoEstoque(produtosBaixoEstoque);
      setRequisicoes(requisicoesData);
      setRelatorios(relatoriosData);
      setDataLoaded(true);

      // Salvar no cache
      saveToCache(dataToCache);

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do Firestore.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função otimizada para calcular produtos do período
  const calculatePeriodProducts = (produtosData: Produto[]) => {
    if (!produtosData.length) return 0;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'hoje':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'personalizado':
        if (!customStartDate || !customEndDate) return 0;
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return 0;
    }

    return produtosData.filter(produto => {
      if (!produto.data_criacao) return false;
      const dataCriacao = new Date(produto.data_criacao);
      return dataCriacao >= startDate && dataCriacao <= endDate;
    }).length;
  };

  // Carregar dados inicial
  useEffect(() => {
    if (isCacheValid() && loadFromCache()) {
      // Cache carregado com sucesso
    } else {
      fetchFirestoreData();
    }
  }, []); // Carregar apenas uma vez

  // Recalcular apenas produtos do período quando mudar
  useEffect(() => {
    if (dataLoaded && produtos.length > 0) {
      const produtosNoPeriodo = calculatePeriodProducts(produtos);
      setProdutosEsteMes(produtosNoPeriodo);
    }
  }, [period, produtos, dataLoaded, customStartDate, customEndDate]);

  // Calcular porcentagem de usuários ativos
  const porcentagemAtivos = totalUsuarios > 0 ? usuariosAtivos / totalUsuarios * 100 : 0;

  // Calcular porcentagem de produtos cadastrados no período
  const porcentagemProdutosPeriodo = totalProdutos > 0 ? produtosEsteMes / totalProdutos * 100 : 0;

  // Texto baseado no período
  const getPeriodText = () => {
    switch (period) {
      case 'hoje':
        return 'hoje';
      case 'semana':
        return 'esta semana';
      case 'mes':
        return 'este mês';
      case 'ano':
        return 'este ano';
      default:
        return 'no período';
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

  const relatoriosMovimentacaoPorPeriodo = () => {
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

    // Verificar se existe dados reais na coleção
    if (!relatorios || relatorios.length === 0) {
      console.warn('Nenhum relatório encontrado na coleção');
      return {
        data: [],
        centrosCusto: []
      };
    }

    // Filtrar relatórios por período
    const filteredRelatorios = relatorios.filter(relatorio => {
      if (!relatorio.data_registro) {
        console.warn('Relatório sem data_registro:', relatorio.id);
        return false;
      }
      
      if (!relatorio.centro_de_custo) {
        console.warn('Relatório sem centro_de_custo:', relatorio.id);
        return false;
      }
      
      const dataRegistro = convertFirebaseTimestamp(relatorio.data_registro);
      
      // Verificar se a data convertida é válida
      if (isNaN(dataRegistro.getTime())) {
        console.warn('Data inválida no relatório:', relatorio.id, relatorio.data_registro);
        return false;
      }
      
      if (period === 'hoje') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        const isInPeriod = dataRegistro >= startOfToday && dataRegistro <= endOfToday;
        return isInPeriod;
      } else if (period === 'semana') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const isInPeriod = dataRegistro >= startOfWeek && dataRegistro <= endOfWeek;
        return isInPeriod;
      } else if (period === 'mes') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const isInPeriod = dataRegistro >= startOfMonth && dataRegistro <= endOfMonth;
        return isInPeriod;
      } else if (period === 'ano') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        const isInPeriod = dataRegistro >= startOfYear && dataRegistro <= endOfYear;
        return isInPeriod;
      } else if (period === 'personalizado' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        const isInPeriod = dataRegistro >= startDate && dataRegistro <= endDate;
        return isInPeriod;
      }
      return false;
    });

    // Extrair todos os centros de custo únicos dos relatórios
    const centrosCusto = new Set<string>();
    filteredRelatorios.forEach(relatorio => {
      if (relatorio.centro_de_custo) {
        centrosCusto.add(relatorio.centro_de_custo);
      }
    });

    // Criar estrutura de dados para cada label de tempo
    data = timeLabels.map((label, labelIndex) => {
      const timeData: Record<string, any> = {
        name: label
      };

      // Para cada centro de custo, calcular as movimentações neste período
      Array.from(centrosCusto).forEach(centroCusto => {
        let quantidade = 0;
        filteredRelatorios.forEach(relatorio => {
          const dataRegistro = convertFirebaseTimestamp(relatorio.data_registro);
          let matches = false;

          // Verificar se o relatório está no período correto
          if (period === "hoje") {
            matches = dataRegistro.getHours() === labelIndex;
          } else if (period === "semana") {
            const dayOfWeek = dataRegistro.getDay();
            matches = dayOfWeek === labelIndex;
          } else if (period === "mes") {
            const dayOfMonth = dataRegistro.getDate();
            matches = dayOfMonth === labelIndex + 1;
          } else if (period === "ano") {
            const month = dataRegistro.getMonth();
            matches = month === labelIndex;
          } else if (period === "personalizado") {
            // Para período personalizado, agrupamos por dias
            if (customStartDate && customEndDate) {
              const diffTime = Math.abs(customEndDate.getTime() - customStartDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays <= 31) {
                const dayOfMonth = dataRegistro.getDate();
                matches = dayOfMonth === labelIndex + 1;
              }
            }
          }
          
          if (matches && relatorio.centro_de_custo === centroCusto) {
            quantidade += relatorio.quantidade || 0;
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
    let data: { name: string; transferencias: number; }[] = [];
    
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

  // Dados para gráfico de movimentações por status (entrada vs saída)
  const movimentacoesPorStatus = () => {
    if (!relatorios || relatorios.length === 0) {
      return [{
        name: 'Entradas',
        value: 0,
        fill: '#82ca9d'
      }, {
        name: 'Saídas',
        value: 0,
        fill: '#8dd1e1'
      }];
    }
    
    const entradas = relatorios.filter(r => r.status === 'entrada').length;
    const saidas = relatorios.filter(r => r.status === 'saida').length;
    
    return [{
      name: 'Entradas',
      value: entradas,
      fill: '#82ca9d'
    }, {
      name: 'Saídas',
      value: saidas,
      fill: '#8dd1e1'
    }];
  };

  // Contar produtos por fornecedor
  const contarProdutosPorFornecedor = (fornecedorNome: string) => {
    return produtos.filter(p => p.fornecedor_nome && p.fornecedor_nome.trim() === fornecedorNome.trim()).length;
  };

  // Dados para gráfico de radar (análise de estoque)
  const dadosAnaliseEstoque = () => {
    return [{
      subject: 'Valor Total',
      A: Math.min(valorEstoque / 10000, 100),
      fullMark: 100
    }, {
      subject: 'Produtos',
      A: Math.min(totalProdutos / 100, 100),
      fullMark: 100
    }, {
      subject: 'Fornecedores',
      A: Math.min(fornecedores.length / 10, 100),
      fullMark: 100
    }, {
      subject: 'Unidades',
      A: Math.min(unidades.length / 5, 100),
      fullMark: 100
    }, {
      subject: 'Transferências',
      A: Math.min(transferencias.length / 50, 100),
      fullMark: 100
    }];
  };

  // Dados para gráfico de valor total por centro de custo
  const valorPorCentroDeCusto = () => {
    if (!relatorios || relatorios.length === 0) {
      return [{
        name: 'Sem dados',
        value: 0
      }];
    }
    
    const centroCustoMap: Record<string, number> = {};
    
    relatorios.forEach(rel => {
      const centro = rel.centro_de_custo || 'Não definido';
      const valor = rel.valor_total || 0;
      
      if (!centroCustoMap[centro]) {
        centroCustoMap[centro] = 0;
      }
      centroCustoMap[centro] += valor;
    });
    
    return Object.entries(centroCustoMap)
      .map(([name, value]) => ({
        name: name,
        value: value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Dados para gráfico de produtos por unidade (barras)
  const dadosProdutosPorUnidade = () => {
    const data = produtosPorUnidade();
    if (!data || data.length === 0) {
      return [{
        name: 'Sem dados',
        value: 0
      }];
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
      return [{
        name: 'Sem dados',
        valor: 0,
        quantidade: 0
      }];
    }
    
    const unidadeMap: Record<string, { valor: number; quantidade: number }> = {};
    
    produtos.forEach(produto => {
      if (produto.unidade && produto.unidade.trim() !== '') {
        const unidadeNome = produto.unidade.trim();
        const valorUnitario = Number(produto.valor_unitario) || 0;
        const quantidadeProduto = Number(produto.quantidade) || 0;
        const valorTotal = valorUnitario * quantidadeProduto;
        
        if (!unidadeMap[unidadeNome]) {
          unidadeMap[unidadeNome] = { valor: 0, quantidade: 0 };
        }
        
        unidadeMap[unidadeNome].valor += valorTotal;
        unidadeMap[unidadeNome].quantidade += 1; // Conta o número de produtos
      }
    });
    
    if (Object.keys(unidadeMap).length === 0) {
      return [{
        name: 'Sem unidades',
        valor: 0,
        quantidade: 0
      }];
    }
    
    return Object.entries(unidadeMap).map(([name, data]) => ({
      name: name || 'Unidade sem nome',
      valor: data.valor || 0,
      quantidade: data.quantidade || 0
    })).sort((a, b) => b.valor - a.valor);
  };

  // Dados para gráfico de relatórios por centro de custo
  const relatoriosPorCentroCusto = () => {
    if (!relatorios || relatorios.length === 0) {
      console.warn('Nenhum relatório disponível para centro de custo');
      // Retornar dados de exemplo baseados em produtos por centro de custo
      const centroCustoFromReqs: Record<string, number> = {};
      requisicoes.forEach(req => {
        req.itens?.forEach(item => {
          const centro = item.centro_de_custo || 'Não definido';
          centroCustoFromReqs[centro] = (centroCustoFromReqs[centro] || 0) + (item.quantidade || 0);
        });
      });
      
      const result = Object.entries(centroCustoFromReqs).map(([name, value], index) => ({
        name: name,
        value: value,
        fill: COLORS[index % COLORS.length]
      })).sort((a, b) => b.value - a.value).slice(0, 10);
      
      if (result.length > 0) return result;
      
      return [{
        name: 'Sem movimentações',
        value: 0,
        fill: COLORS[0]
      }];
    }
    
    const now = new Date();
    const last90Days = new Date(now);
    last90Days.setDate(now.getDate() - 90);
    
    // Filtrar apenas por data válida e últimos 90 dias, ignorando o filtro de período selecionado
    const filteredRelatorios = relatorios.filter(relatorio => {
      if (!relatorio.centro_de_custo) {
        return false;
      }
      
      if (!relatorio.data_registro) {
        return true; // Incluir relatórios sem data
      }
      
      const dataRegistro = convertFirebaseTimestamp(relatorio.data_registro);
      
      if (isNaN(dataRegistro.getTime())) {
        return true; // Incluir se data inválida
      }
      
      return dataRegistro >= last90Days; // Últimos 90 dias
    });
    
    const centroCustoMap: Record<string, number> = {};
    filteredRelatorios.forEach(relatorio => {
      if (relatorio.centro_de_custo) {
        const quantidade = relatorio.quantidade || 1;
        centroCustoMap[relatorio.centro_de_custo] = (centroCustoMap[relatorio.centro_de_custo] || 0) + quantidade;
      }
    });
    
    const result = Object.entries(centroCustoMap).map(([name, value], index) => ({
      name: name || 'Centro não definido',
      value: value || 0,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value).slice(0, 10);
    
    if (result.length === 0) {
      return [{
        name: 'Sem dados',
        value: 0,
        fill: COLORS[0]
      }];
    }
    
    return result;
  };

  return (
    <AppLayout title="Dashboard Geral">
      {/* Seletor de período */}
      <div className="mb-6">
        <Tabs defaultValue="hoje" value={period} onValueChange={v => setPeriod(v as "hoje" | "semana" | "mes" | "ano" | "personalizado")}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <TabsTrigger value="hoje" className="flex items-center gap-2 rounded-l-lg rounded-r-none">
              <Clock className="h-4 w-4" /> Hoje
            </TabsTrigger>
            <TabsTrigger value="semana" className="flex items-center gap-2 rounded-none">
              <Calendar className="h-4 w-4" /> Semana
            </TabsTrigger>
            <TabsTrigger value="mes" className="flex items-center gap-2 rounded-none">
              <Layers className="h-4 w-4" /> Mês
            </TabsTrigger>
            <TabsTrigger value="ano" className="flex items-center gap-2 rounded-none">
              <BarChart2 className="h-4 w-4" /> Ano
            </TabsTrigger>
            <TabsTrigger value="personalizado" className="flex items-center gap-2 rounded-r-lg rounded-l-none">
              <Calendar className="h-4 w-4" /> Personalizado
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Período personalizado */}
        {period === 'personalizado' && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Período Personalizado</CardTitle>
              <CardDescription>Selecione o intervalo de datas desejado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        disabled={(date) => date > new Date() || (customEndDate && date > customEndDate)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) => date > new Date() || (customStartDate && date < customStartDate)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading ? (
        <Card className="mb-6">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Carregando dados do dashboard...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* ===== SEÇÃO DE ESTOQUE ===== */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" /> Estoque
            </h2>
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
                  value: produtosBaixoEstoque.length / totalProdutos * 100,
                  positive: false,
                  label: `${(produtosBaixoEstoque.length / totalProdutos * 100).toFixed(1)}%`
                }} 
                description="Itens com estoque crítico" 
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/10" 
              />
            </div>

            {/* Primeira linha de gráficos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
              {/* Movimentação por Centro de Custo - Gráfico de Área Múltipla */}
              <Card className="col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Movimentação por Centro de Custo
                      </CardTitle>
                      <CardDescription>
                        {period === "hoje" ? "Hoje por hora" : period === "semana" ? "Esta semana por dia" : period === "mes" ? "Este mês por dia" : "Este ano por mês"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={relatoriosMovimentacaoPorPeriodo().data}>
                        <defs>
                          {relatoriosMovimentacaoPorPeriodo().centrosCusto.map((centro, index) => (
                            <linearGradient key={centro} id={`color${centro.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={(value, name) => [`${value} itens`, name]} 
                        />
                        <Legend />
                        {relatoriosMovimentacaoPorPeriodo().centrosCusto.map((centro, index) => (
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value}%`, 'Índice']} 
                        />
                        <Radar name="Estoque" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha de gráficos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value} produtos`, 'Quantidade']} 
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value} fornecedores`, 'Quantidade']} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Valor Total por Centro de Custo - Gráfico de Barras */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Valor Total por Centro de Custo
                  </CardTitle>
                  <CardDescription>Valor total das movimentações por centro de custo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={valorPorCentroDeCusto()} 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip 
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [formatCurrency(Number(value)), 'Valor Total']} 
                        />
                        <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terceira linha de gráficos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
              {/* Requisições por Centro de Custo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Movimentações por Centro de Custo
                  </CardTitle>
                  <CardDescription>Distribuição de movimentações (últimos 90 dias)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatoriosPorCentroCusto()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value} itens`, 'Quantidade']} 
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value} produtos`, 'Quantidade']} 
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
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }}
                          formatter={(value, name) => {
                            if (name === 'valor') return [<span style={{ color: '#82ca9d' }}>{formatCurrency(Number(value))}</span>, <span style={{ color: '#8dd1e1' }}>Valor</span>];
                            if (name === 'quantidade') return [<span style={{ color: '#82ca9d' }}>{value}</span>, <span style={{ color: '#8dd1e1' }}>Produtos</span>];
                            return [<span style={{ color: '#82ca9d' }}>{value}</span>, <span style={{ color: '#8dd1e1' }}>{name}</span>];
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              {/* Movimentações por Status - Gráfico de Pizza */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Movimentações por Status
                  </CardTitle>
                  <CardDescription>Distribuição de entradas e saídas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={movimentacoesPorStatus()} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          outerRadius={80} 
                          innerRadius={40} 
                          paddingAngle={5} 
                          dataKey="value" 
                          nameKey="name" 
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {movimentacoesPorStatus().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                          labelStyle={{ color: '#FFFFFF' }} 
                          itemStyle={{ color: '#82ca9d' }} 
                          formatter={value => [`${value} movimentações`, 'Quantidade']} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ===== DIVISÓRIA ===== */}
          <div className="my-8 border-t border-border" />

          {/* ===== SEÇÃO DE MANUTENÇÃO ===== */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Manutenção
            </h2>
            <ManutencaoCharts period={period === "personalizado" ? "mes" : period} />
          </div>

          {/* ===== DIVISÓRIA ===== */}
          <div className="my-8 border-t border-border" />

          {/* ===== SEÇÃO DE PCP ===== */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Factory className="h-5 w-5" /> Planejamento e Controle de Produção (PCP)
            </h2>
            <PCPCharts period={period === "personalizado" ? "mes" : period} />
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Dashboard;