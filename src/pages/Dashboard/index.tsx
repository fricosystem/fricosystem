import { useState, useEffect, useMemo, useCallback } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, FileText, Loader2, Users, Warehouse, Truck, Boxes, ClipboardList, BarChart2, Map, Calendar, Clock, Layers, Wrench, Factory, RefreshCw } from "lucide-react";
import { ManutencaoCharts } from "./components/ManutencaoCharts";
import { PCPCharts } from "./components/PCPCharts";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { usePostMessageFix } from "@/hooks/usePostMessageFix";

// Tipos para os dados do Firestore
type Usuario = {
  nome: string;
  ativo: boolean;
};
type Produto = {
  valor_unitario: number | string;
  deposito?: string;
  unidade?: string;
  fornecedor_nome?: string;
  nome?: string;
  data_criacao?: any;
  quantidade?: number;
};
type Transferencia = {
  data_transferencia: any;
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
  createdAt?: any;
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
  data_criacao: any;
  valor_total: number;
};
type Relatorio = {
  id: string;
  centro_de_custo?: string;
  quantidade?: number;
  valor_total?: number;
  valor_unitario?: number;
  status?: 'entrada' | 'saida';
  unidade?: string;
  data_saida?: any;
  data_registro?: any;
};

type Period = "hoje" | "semana" | "mes" | "ano" | "personalizado";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

// ---------- Formatadores (pt-BR) ----------
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});
const numberFormatter = new Intl.NumberFormat('pt-BR');

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);
const formatNumber = (value: number) => numberFormatter.format(Number.isFinite(value) ? value : 0);
const formatPercent = (value: number, digits = 1) =>
  `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)}%`;
const formatCompactCurrency = (value: number) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1_000_000) return `R$ ${formatNumber(Number((v / 1_000_000).toFixed(1)))} mi`;
  if (Math.abs(v) >= 1_000) return `R$ ${formatNumber(Number((v / 1_000).toFixed(1)))} mil`;
  return formatCurrency(v);
};

// Converte timestamp do Firestore (ou cache serializado) para Date; retorna null se inválido
const toDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;
  if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
    try {
      const d = timestamp.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    const ms = Number(timestamp.seconds) * 1000 + Math.floor(Number(timestamp.nanoseconds || 0) / 1e6);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof timestamp === 'number') {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const parseCurrencyValue = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;
  const raw = value.toString().trim();
  // Formato pt-BR: 1.234,56 | Formato en-US: 1234.56
  const cleaned = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')
    : raw.replace(/[^0-9.\-]/g, '');
  const result = parseFloat(cleaned);
  return Number.isFinite(result) ? result : 0;
};

const truncateLabel = (value: string, max = 14) =>
  value && value.length > max ? `${value.slice(0, max - 1)}…` : value;

const CHART_HEIGHT = "h-[260px] sm:h-[300px]";

const tooltipProps = {
  contentStyle: {
    background: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    borderRadius: 'var(--radius)',
    color: 'hsl(var(--foreground))',
    fontSize: '12px'
  },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--foreground))' }
};

const EmptyChart = ({ message = "Sem dados registrados no período" }: { message?: string }) => (
  <div className={cn(CHART_HEIGHT, "flex items-center justify-center text-center text-sm text-muted-foreground px-4")}>
    {message}
  </div>
);

const Dashboard = () => {
  usePostMessageFix();

  const [period, setPeriod] = useState<Period>("hoje");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [usuariosAtivos, setUsuariosAtivos] = useState(0);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);

  // ---------- Cache ----------
  const CACHE_KEYS = {
    dashboard: 'dashboard_data_cache',
    timestamp: 'dashboard_cache_timestamp',
    version: 'dashboard_cache_version'
  };
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  const CACHE_VERSION = '2.0';

  const applyData = useCallback((data: any) => {
    setTotalUsuarios(data.totalUsuarios || 0);
    setUsuariosAtivos(data.usuariosAtivos || 0);
    setUnidades(data.unidades || []);
    setFornecedores(data.fornecedores || []);
    setTransferencias(data.transferencias || []);
    setProdutos(data.produtos || []);
    setDepositos(data.depositos || []);
    setRequisicoes(data.requisicoes || []);
    setRelatorios(data.relatorios || []);
  }, []);

  const loadFromCache = useCallback(() => {
    try {
      const cacheTimestamp = localStorage.getItem(CACHE_KEYS.timestamp);
      const cacheVersion = localStorage.getItem(CACHE_KEYS.version);
      if (!cacheTimestamp || cacheVersion !== CACHE_VERSION) return false;
      if (Date.now() - parseInt(cacheTimestamp, 10) >= CACHE_DURATION) return false;

      const cachedData = localStorage.getItem(CACHE_KEYS.dashboard);
      if (!cachedData) return false;
      applyData(JSON.parse(cachedData));
      setLastUpdate(new Date(parseInt(cacheTimestamp, 10)));
      return true;
    } catch (error) {
      console.error("Erro ao carregar cache do dashboard:", error);
      localStorage.removeItem(CACHE_KEYS.dashboard);
      localStorage.removeItem(CACHE_KEYS.timestamp);
      return false;
    }
  }, [applyData]);

  const fetchFirestoreData = useCallback(async () => {
    setLoading(true);
    try {
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

      const usuariosData = usuariosSnapshot.docs.map(doc => doc.data() as Usuario);

      const produtosData: Produto[] = produtosSnapshot.docs.map(doc => {
        const data = doc.data() as Produto;
        return {
          ...data,
          nome: (data.nome || '').toString().trim() || undefined,
          unidade: (data.unidade || '').toString().trim() || undefined,
          fornecedor_nome: (data.fornecedor_nome || '').toString().trim() || undefined,
          valor_unitario: parseCurrencyValue(data.valor_unitario),
          quantidade: Number(data.quantidade) || 0,
          data_criacao: data.data_criacao ?? null
        };
      });

      const transferenciasData = transferenciasSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, quantidade: Number(data.quantidade) || 0 } as Transferencia;
      });

      const depositosData = depositosSnapshot.docs.map(doc => doc.data() as Deposito);
      const unidadesData = [...new Set(
        depositosData.map(d => (d.unidade || '').toString().trim()).filter(Boolean)
      )];

      const fornecedoresData = fornecedoresSnapshot.docs.map(doc => {
        const data = doc.data() as Fornecedor;
        return { ...data, razao_social: data.razao_social || data.nome };
      });

      const requisicoesData = requisicoesSnapshot.docs.map(doc => doc.data() as Requisicao);

      const relatoriosData: Relatorio[] = relatoriosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          centro_de_custo: (data.centro_de_custo || '').toString().trim() || undefined,
          unidade: (data.unidade || '').toString().trim() || undefined,
          status: data.status,
          quantidade: Number(data.quantidade) || 0,
          valor_unitario: parseCurrencyValue(data.valor_unitario),
          valor_total: parseCurrencyValue(data.valor_total),
          data_registro: data.data_registro ?? null,
          data_saida: data.data_saida ?? null
        };
      });

      const payload = {
        totalUsuarios: usuariosData.length,
        usuariosAtivos: usuariosData.filter(u => u.ativo).length,
        unidades: unidadesData,
        fornecedores: fornecedoresData,
        transferencias: transferenciasData,
        produtos: produtosData,
        depositos: depositosData,
        requisicoes: requisicoesData,
        relatorios: relatoriosData
      };

      applyData(payload);
      setLastUpdate(new Date());

      try {
        localStorage.setItem(CACHE_KEYS.dashboard, JSON.stringify(payload));
        localStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
        localStorage.setItem(CACHE_KEYS.version, CACHE_VERSION);
      } catch (error) {
        console.warn("Não foi possível salvar o cache do dashboard:", error);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do Firestore.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [applyData, toast]);

  useEffect(() => {
    if (!loadFromCache()) {
      fetchFirestoreData();
    }
  }, [loadFromCache, fetchFirestoreData]);

  // ---------- Intervalo do período selecionado ----------
  const range = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    switch (period) {
      case 'hoje':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'semana':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'ano':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'personalizado':
      default:
        if (!customStartDate || !customEndDate) return null;
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  }, [period, customStartDate, customEndDate]);

  const isInPeriod = useCallback((value: any) => {
    if (!range) return false;
    const date = toDate(value);
    if (!date) return false;
    return date >= range.start && date <= range.end;
  }, [range]);

  // Rótulos do eixo X conforme o período
  const timeLabels = useMemo(() => {
    const now = new Date();
    if (period === "hoje") return Array.from({ length: 24 }, (_, i) => `${i}h`);
    if (period === "semana") return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    if (period === "mes") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    }
    if (period === "ano") return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    // personalizado: agrupa por dia dentro do intervalo
    if (!range) return [];
    const labels: string[] = [];
    const cursor = new Date(range.start);
    while (cursor <= range.end && labels.length < 92) {
      labels.push(format(cursor, "dd/MM"));
      cursor.setDate(cursor.getDate() + 1);
    }
    return labels;
  }, [period, range]);

  const labelIndexOf = useCallback((date: Date) => {
    if (period === "hoje") return date.getHours();
    if (period === "semana") return date.getDay();
    if (period === "mes") return date.getDate() - 1;
    if (period === "ano") return date.getMonth();
    if (!range) return -1;
    const diff = Math.floor((date.getTime() - range.start.getTime()) / 86400000);
    return diff;
  }, [period, range]);

  // ---------- Métricas derivadas (100% reais) ----------
  const totalProdutos = produtos.length;
  const valorEstoque = useMemo(
    () => produtos.reduce((total, p) => total + (Number(p.valor_unitario) || 0) * (Number(p.quantidade) || 0), 0),
    [produtos]
  );
  const produtosBaixoEstoque = useMemo(
    () => produtos.filter(p => (Number(p.quantidade) || 0) < 5).sort((a, b) => (Number(a.quantidade) || 0) - (Number(b.quantidade) || 0)),
    [produtos]
  );
  const produtosNoPeriodo = useMemo(
    () => produtos.filter(p => isInPeriod(p.data_criacao)).length,
    [produtos, isInPeriod]
  );

  const porcentagemAtivos = totalUsuarios > 0 ? (usuariosAtivos / totalUsuarios) * 100 : 0;
  const porcentagemBaixoEstoque = totalProdutos > 0 ? (produtosBaixoEstoque.length / totalProdutos) * 100 : 0;

  const relatoriosPeriodo = useMemo(
    () => relatorios.filter(r => isInPeriod(r.data_registro ?? r.data_saida)),
    [relatorios, isInPeriod]
  );

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'hoje': return 'Hoje por hora';
      case 'semana': return 'Esta semana por dia';
      case 'mes': return 'Este mês por dia';
      case 'ano': return 'Este ano por mês';
      default:
        return range ? `${format(range.start, "dd/MM/yyyy")} a ${format(range.end, "dd/MM/yyyy")}` : 'Selecione um intervalo';
    }
  }, [period, range]);

  // ---------- Dados dos gráficos ----------
  const produtosPorFornecedor = useMemo(() => {
    const map: Record<string, number> = {};
    produtos.forEach(p => {
      if (!p.fornecedor_nome) return;
      map[p.fornecedor_nome] = (map[p.fornecedor_nome] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [produtos]);

  const fornecedoresPorEstado = useMemo(() => {
    const map: Record<string, number> = {};
    fornecedores.forEach(f => {
      const estado = (f.endereco?.estado || '').toString().trim();
      if (!estado) return;
      map[estado] = (map[estado] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [fornecedores]);

  const movimentacaoPorCentroCusto = useMemo(() => {
    if (!range || relatoriosPeriodo.length === 0 || timeLabels.length === 0) {
      return { data: [] as Record<string, any>[], centrosCusto: [] as string[] };
    }
    const centros = [...new Set(relatoriosPeriodo.map(r => r.centro_de_custo).filter(Boolean) as string[])];
    if (centros.length === 0) return { data: [], centrosCusto: [] };

    const base = timeLabels.map(label => {
      const row: Record<string, any> = { name: label };
      centros.forEach(c => { row[c] = 0; });
      return row;
    });

    relatoriosPeriodo.forEach(r => {
      const date = toDate(r.data_registro ?? r.data_saida);
      if (!date || !r.centro_de_custo) return;
      const idx = labelIndexOf(date);
      if (idx < 0 || idx >= base.length) return;
      base[idx][r.centro_de_custo] += Number(r.quantidade) || 0;
    });

    return { data: base, centrosCusto: centros };
  }, [relatoriosPeriodo, timeLabels, labelIndexOf, range]);

  const movimentacoesPorStatus = useMemo(() => {
    const entradas = relatoriosPeriodo.filter(r => r.status === 'entrada').length;
    const saidas = relatoriosPeriodo.filter(r => r.status === 'saida').length;
    if (entradas === 0 && saidas === 0) return [];
    return [
      { name: 'Entradas', value: entradas, fill: COLORS[1] },
      { name: 'Saídas', value: saidas, fill: COLORS[3] }
    ];
  }, [relatoriosPeriodo]);

  const valorPorCentroDeCusto = useMemo(() => {
    const map: Record<string, number> = {};
    relatoriosPeriodo.forEach(r => {
      if (!r.centro_de_custo) return;
      const valor = Number(r.valor_total) || (Number(r.valor_unitario) || 0) * (Number(r.quantidade) || 0);
      map[r.centro_de_custo] = (map[r.centro_de_custo] || 0) + valor;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [relatoriosPeriodo]);

  const quantidadePorCentroCusto = useMemo(() => {
    const map: Record<string, number> = {};
    relatoriosPeriodo.forEach(r => {
      if (!r.centro_de_custo) return;
      map[r.centro_de_custo] = (map[r.centro_de_custo] || 0) + (Number(r.quantidade) || 0);
    });
    return Object.entries(map)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [relatoriosPeriodo]);

  const produtosPorUnidade = useMemo(() => {
    const map: Record<string, number> = {};
    produtos.forEach(p => {
      if (!p.unidade) return;
      map[p.unidade] = (map[p.unidade] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [produtos]);

  const valorEstoquePorUnidade = useMemo(() => {
    const map: Record<string, { valor: number; quantidade: number }> = {};
    produtos.forEach(p => {
      if (!p.unidade) return;
      if (!map[p.unidade]) map[p.unidade] = { valor: 0, quantidade: 0 };
      map[p.unidade].valor += (Number(p.valor_unitario) || 0) * (Number(p.quantidade) || 0);
      map[p.unidade].quantidade += Number(p.quantidade) || 0;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, valor: data.valor, quantidade: data.quantidade }))
      .sort((a, b) => b.valor - a.valor);
  }, [produtos]);

  const resumoInventario = useMemo(() => ([
    { label: 'Produtos cadastrados', value: formatNumber(totalProdutos) },
    { label: 'Itens em estoque', value: formatNumber(produtos.reduce((s, p) => s + (Number(p.quantidade) || 0), 0)) },
    { label: 'Fornecedores', value: formatNumber(fornecedores.length) },
    { label: 'Unidades', value: formatNumber(unidades.length) },
    { label: 'Depósitos', value: formatNumber(depositos.length) },
    { label: 'Transferências', value: formatNumber(transferencias.length) },
    { label: 'Requisições', value: formatNumber(requisicoes.length) },
    { label: `Novos produtos (${period === 'personalizado' ? 'período' : periodLabel.split(' ')[0].toLowerCase()})`, value: formatNumber(produtosNoPeriodo) }
  ]), [totalProdutos, produtos, fornecedores.length, unidades.length, depositos.length, transferencias.length, requisicoes.length, produtosNoPeriodo, period, periodLabel]);

  return (
    <AppLayout title="Dashboard Geral">
      {/* Seletor de período */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lastUpdate ? `Atualizado em ${format(lastUpdate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : 'Carregando dados...'}
          </p>
          <Button variant="outline" size="sm" onClick={fetchFirestoreData} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar dados
          </Button>
        </div>

        <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
          <TabsList className="flex w-full overflow-x-auto justify-start gap-1 h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="hoje" className="flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm px-3 py-2">
              <Clock className="h-4 w-4" /> Hoje
            </TabsTrigger>
            <TabsTrigger value="semana" className="flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm px-3 py-2">
              <Calendar className="h-4 w-4" /> Semana
            </TabsTrigger>
            <TabsTrigger value="mes" className="flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm px-3 py-2">
              <Layers className="h-4 w-4" /> Mês
            </TabsTrigger>
            <TabsTrigger value="ano" className="flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm px-3 py-2">
              <BarChart2 className="h-4 w-4" /> Ano
            </TabsTrigger>
            <TabsTrigger value="personalizado" className="flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm px-3 py-2">
              <Calendar className="h-4 w-4" /> Personalizado
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {period === 'personalizado' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Período Personalizado</CardTitle>
              <CardDescription>Selecione o intervalo de datas desejado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        disabled={(date) => date > new Date() || (!!customEndDate && date > customEndDate)}
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
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) => date > new Date() || (!!customStartDate && date < customStartDate)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {!range && (
                <p className="mt-3 text-sm text-muted-foreground">Selecione as duas datas para calcular os indicadores.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {loading ? (
        <Card className="mb-6">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
            <p className="text-base sm:text-lg font-medium text-center">Carregando dados do dashboard...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* ===== SEÇÃO DE ESTOQUE ===== */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 flex-shrink-0" /> Estoque
            </h2>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
              <StatsCard
                title="Usuários Ativos"
                value={`${formatNumber(usuariosAtivos)}/${formatNumber(totalUsuarios)}`}
                icon={<Users className="h-5 w-5" />}
                trend={{ value: porcentagemAtivos, positive: porcentagemAtivos > 70, label: `${formatPercent(porcentagemAtivos, 0)} de ativos` }}
                description={`${formatPercent(porcentagemAtivos, 0)} da equipe ativa`}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
              />
              <StatsCard
                title="Total de Produtos"
                value={formatNumber(totalProdutos)}
                icon={<Package className="h-5 w-5" />}
                description="Diversidade de itens cadastrados"
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
                value={formatNumber(produtosBaixoEstoque.length)}
                icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
                trend={{ value: porcentagemBaixoEstoque, positive: false, label: formatPercent(porcentagemBaixoEstoque) }}
                description="Itens com menos de 5 unidades"
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/10"
              />
            </div>

            {/* Primeira linha */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 mb-6">
              <Card className="xl:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Truck className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Movimentação por Centro de Custo</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {movimentacaoPorCentroCusto.data.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={movimentacaoPorCentroCusto.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            {movimentacaoPorCentroCusto.centrosCusto.map((centro, index) => (
                              <linearGradient key={centro} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={8} />
                          <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v) => formatNumber(Number(v))} />
                          <Tooltip {...tooltipProps} formatter={(value, name) => [`${formatNumber(Number(value))} itens`, name]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {movimentacaoPorCentroCusto.centrosCusto.map((centro, index) => (
                            <Area key={centro} type="monotone" dataKey={centro} stackId="1" stroke={COLORS[index % COLORS.length]} fillOpacity={1} fill={`url(#color-${index})`} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Boxes className="h-5 w-5 flex-shrink-0" /> Resumo do Inventário
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Números reais cadastrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-3">
                    {resumoInventario.map(item => (
                      <div key={item.label} className="rounded-lg border border-border bg-muted/40 p-3">
                        <dt className="text-xs text-muted-foreground leading-tight">{item.label}</dt>
                        <dd className="text-base sm:text-lg font-semibold mt-1 break-words">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ClipboardList className="h-5 w-5 flex-shrink-0" /> Top Fornecedores
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Por quantidade de produtos</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {produtosPorFornecedor.length === 0 ? (
                    <EmptyChart message="Nenhum fornecedor vinculado a produtos" />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={produtosPorFornecedor} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} tickFormatter={(v) => truncateLabel(String(v), 12)} />
                          <Tooltip {...tooltipProps} formatter={value => [`${formatNumber(Number(value))} produtos`, 'Quantidade']} />
                          <Bar dataKey="value" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Map className="h-5 w-5 flex-shrink-0" /> Fornecedores por Estado
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Distribuição geográfica</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {fornecedoresPorEstado.length === 0 ? (
                    <EmptyChart message="Nenhum fornecedor com estado informado" />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fornecedoresPorEstado}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            outerRadius="70%"
                            innerRadius="40%"
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {fornecedoresPorEstado.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip {...tooltipProps} formatter={(value, name) => [`${formatNumber(Number(value))} fornecedores`, name]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Valor por Centro de Custo</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Movimentações — {periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {valorPorCentroDeCusto.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={valorPorCentroDeCusto} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(Number(v))} />
                          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} tickFormatter={(v) => truncateLabel(String(v), 12)} />
                          <Tooltip {...tooltipProps} formatter={value => [formatCurrency(Number(value)), 'Valor total']} />
                          <Bar dataKey="value" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Terceira linha */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Movimentações por Centro de Custo</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Quantidade movimentada — {periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {quantidadePorCentroCusto.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quantidadePorCentroCusto} margin={{ top: 5, right: 8, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10 }} tickFormatter={(v) => truncateLabel(String(v), 10)} />
                          <YAxis tick={{ fontSize: 11 }} width={44} allowDecimals={false} tickFormatter={(v) => formatNumber(Number(v))} />
                          <Tooltip {...tooltipProps} formatter={value => [`${formatNumber(Number(value))} itens`, 'Quantidade']} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {quantidadePorCentroCusto.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Warehouse className="h-5 w-5 flex-shrink-0" /> Produtos por Unidade
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Distribuição por localização</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {produtosPorUnidade.length === 0 ? (
                    <EmptyChart message="Nenhum produto com unidade informada" />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={produtosPorUnidade} margin={{ top: 5, right: 8, left: 0, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} interval={0} tick={{ fontSize: 10 }} tickFormatter={(v) => truncateLabel(String(v), 10)} />
                          <YAxis tick={{ fontSize: 11 }} width={44} allowDecimals={false} tickFormatter={(v) => formatNumber(Number(v))} />
                          <Tooltip {...tooltipProps} formatter={value => [`${formatNumber(Number(value))} produtos`, 'Quantidade']} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {produtosPorUnidade.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <DollarSign className="h-5 w-5 flex-shrink-0" /> Valor por Unidade
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Valor e itens em estoque por local</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {valorEstoquePorUnidade.length === 0 ? (
                    <EmptyChart message="Nenhum produto com unidade informada" />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={valorEstoquePorUnidade} margin={{ top: 10, right: 8, left: 0, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} interval={0} tick={{ fontSize: 10 }} tickFormatter={(v) => truncateLabel(String(v), 10)} />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10 }} width={52} tickFormatter={(v) => formatCompactCurrency(Number(v))} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => formatNumber(Number(v))} />
                          <Tooltip
                            {...tooltipProps}
                            formatter={(value, name) => name === 'Valor'
                              ? [formatCurrency(Number(value)), 'Valor']
                              : [`${formatNumber(Number(value))} itens`, 'Itens']}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar yAxisId="left" dataKey="valor" name="Valor" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="quantidade" name="Itens" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Listas */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" /> Produtos com Baixo Estoque
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Itens que precisam de reposição</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {produtosBaixoEstoque.length > 0 ? produtosBaixoEstoque.slice(0, 5).map((produto, index) => (
                      <div key={`${produto.nome ?? 'produto'}-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{produto.nome || 'Produto sem nome'}</p>
                          <p className="text-sm text-muted-foreground truncate">{produto.fornecedor_nome || 'Fornecedor não informado'}</p>
                        </div>
                        <div className="sm:text-right flex-shrink-0">
                          <p className="font-bold text-yellow-600">{formatNumber(Number(produto.quantidade) || 0)} un.</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(Number(produto.valor_unitario) || 0)} cada</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum produto com estoque baixo encontrado
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-5 w-5 flex-shrink-0" /> Movimentações por Status
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Entradas e saídas — {periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {movimentacoesPorStatus.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className={CHART_HEIGHT}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={movimentacoesPorStatus}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            outerRadius="70%"
                            innerRadius="40%"
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {movimentacoesPorStatus.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip {...tooltipProps} formatter={(value, name) => [`${formatNumber(Number(value))} movimentações`, name]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="my-6 sm:my-8 border-t border-border" />

          {/* ===== MANUTENÇÃO ===== */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 flex-shrink-0" /> Manutenção
            </h2>
            <ManutencaoCharts period={period === "personalizado" ? "mes" : period} />
          </div>

          <div className="my-6 sm:my-8 border-t border-border" />

          {/* ===== PCP ===== */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Factory className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Planejamento e Controle de Produção (PCP)</span>
            </h2>
            <PCPCharts period={period === "personalizado" ? "mes" : period} />
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Dashboard;
