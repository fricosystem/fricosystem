import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, Calendar, TrendingUp, Edit, Save, X, RefreshCw, Settings, BarChart3, AlertTriangle, CheckCircle2, Clock, Zap, Trophy } from "lucide-react";
import { usePCPConfig } from "@/hooks/usePCPConfig";
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import usePCPOptimized from "@/hooks/usePCPOptimized";
const configSchema = z.object({
  meta_minima_mensal: z.number().min(1, "Meta mínima mensal deve ser maior que 0"),
  dias_uteis_mes: z.number().min(1, "Dias úteis deve ser maior que 0").max(31, "Máximo de 31 dias")
});
type ConfigFormData = z.infer<typeof configSchema>;
interface Produto {
  id: string;
  batch_receita_kg: string;
  batch_receita_un: string;
  classificacao: string;
  codigo: string;
  cx_respectiva: string;
  descricao_produto: string;
  embalagem: string;
  maquina: string;
  peso_liq_unit_kg: string;
  un_cx: string;
}
interface ProcessamentoData {
  id: string;
  dataProcessamento: string;
  turnosProcessados: string[];
  kgTotal: number;
  kgTurno1: number;
  kgTurno2: number;
  planejadoTurno1: number;
  planejadoTurno2: number;
  planoDiario: number;
  timestamp: Date;
}
interface MetaPorClassificacao {
  classificacao: string;
  meta: number;
  realizado: number;
  percentual: number;
}
interface PeriodoFilter {
  inicio: string;
  fim: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'personalizado';
}
const Metas = () => {
  const {
    config,
    metaMensal,
    saveConfig,
    loading: configLoading,
    carregarProducaoTotal,
    carregarMetaDiariaRealizada,
    contarDocumentosPCP,
    getCurrentMonth,
    salvarConfigSistema,
    calcularProgressoMensal,
    gerarMetaMensal
  } = usePCPConfig();

  // Hook otimizado para dados PCP reais
  const {
    pcpData,
    pcpProdutos,
    loading: pcpLoading,
    error: pcpError,
    fetchPCPData,
    setupRealtimeListener,
    getMetrics
  } = usePCPOptimized();
  
  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [processamentos, setProcessamentos] = useState<ProcessamentoData[]>([]);
  const [metasPorClassificacao, setMetasPorClassificacao] = useState<MetaPorClassificacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para período
  const [periodo, setPeriodo] = useState<PeriodoFilter>({
    inicio: format(new Date(), 'yyyy-MM-dd'),
    fim: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'mensal'
  });
  
  // Estados para edição
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null);
  const [novaMetaTemp, setNovaMetaTemp] = useState<number>(0);
  const [editandoMetaMensal, setEditandoMetaMensal] = useState(false);
  const [editandoDiasUteis, setEditandoDiasUteis] = useState(false);
  
  // Estados para métricas de produção (dados reais)
  const [diasTrabalhados, setDiasTrabalhados] = useState(0);
  const [diasParaFecharMes, setDiasParaFecharMes] = useState(0);
  const [totalProducao, setTotalProducao] = useState(0);
  const [volumeDiasRestantes, setVolumeDiasRestantes] = useState(0);
  const [metaDiariaRealizada, setMetaDiariaRealizada] = useState(0);
  const [progressoMensal, setProgressoMensal] = useState(0);
  const [eficienciaGeral, setEficienciaGeral] = useState(0);
  const [tendenciaProducao, setTendenciaProducao] = useState<'crescente' | 'estavel' | 'decrescente'>('estavel');

  // Estados para controlar valores formatados dos inputs
  const [metaMensalFormatada, setMetaMensalFormatada] = useState('0');
  const [diasUteisFormatados, setDiasUteisFormatados] = useState('0');
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      meta_minima_mensal: 0,
      dias_uteis_mes: 0
    }
  });

  // Cache para documentos já carregados
  const [documentCache, setDocumentCache] = useState<Record<string, any>>({});

  // Metas padrão baseadas na configuração do sistema e dados reais
  const metasPadrao = useMemo(() => {
    const metaBase = config?.meta_minima_mensal || 100000;
    
    // Calcular distribuição baseada nos dados históricos reais
    const producaoPorClassificacao = new Map<string, number>();
    let totalProducaoHistorica = 0;

    pcpData.forEach(item => {
      const classificacao = item.classificacao || item.setor || 'Sem classificação';
      const producao = item.quantidade_produzida || 0;
      producaoPorClassificacao.set(
        classificacao, 
        (producaoPorClassificacao.get(classificacao) || 0) + producao
      );
      totalProducaoHistorica += producao;
    });

    // Se não há dados históricos, usar distribuição padrão
    if (totalProducaoHistorica === 0) {
      return {
        'FRESCAIS GROSSAS': metaBase * 0.4,
        'FRESCAIS FINAS': metaBase * 0.18,
        'CALABRESA': metaBase * 0.22,
        'PRESUNTARIA': metaBase * 0.16,
        'MORTADELA': metaBase * 0.08,
        'BACON': metaBase * 0.05,
        'FRESCAIS BANDEJAS': metaBase * 0.03,
        'FATIADOS': metaBase * 0.03
      };
    }

    // Calcular metas proporcionais baseadas na produção histórica
    const metasCalculadas: Record<string, number> = {};
    producaoPorClassificacao.forEach((producao, classificacao) => {
      const proporcao = producao / totalProducaoHistorica;
      metasCalculadas[classificacao] = metaBase * proporcao;
    });

    return metasCalculadas;
  }, [config, pcpData]);

  // Funções utilitárias para formatação brasileira
  const formatarNumero = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  const formatarNumeroInput = (valor: number): string => {
    return valor.toLocaleString('pt-BR');
  };
  const parseNumero = (valor: string): number => {
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const cleanValue = valor.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  // Atualizar form quando config carrega
  useEffect(() => {
    if (!configLoading && config) {
      const metaMinima = config.meta_minima_mensal || 0;
      const diasUteis = config.dias_uteis_mes || 0;
      form.reset({
        meta_minima_mensal: metaMinima,
        dias_uteis_mes: diasUteis
      });

      // Atualizar valores formatados
      setMetaMensalFormatada(formatarNumeroInput(metaMinima));
      setDiasUteisFormatados(formatarNumeroInput(diasUteis));
    }
  }, [config, configLoading, form]);
  const onSubmit = async (data: ConfigFormData) => {
    // Converter valores formatados para números
    const dataToSave = {
      meta_minima_mensal: parseNumero(metaMensalFormatada),
      dias_uteis_mes: parseNumero(diasUteisFormatados)
    };
    const success = await salvarConfigSistema(dataToSave);
    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas na coleção PCP_configuracoes!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    }
  };

  // Função para normalizar códigos
  const normalizeCode = (code: string | undefined): string => {
    return (code || "").trim().toLowerCase();
  };

  // Função para carregar documento com cache
  const getDocumentWithCache = async (docId: string) => {
    if (documentCache[docId]) {
      return documentCache[docId];
    }
    try {
      const docRef = doc(db, "PCP", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocumentCache(prev => ({
          ...prev,
          [docId]: data
        }));
        return data;
      }
    } catch (error) {
      console.error(`Erro ao carregar documento ${docId}:`, error);
    }
    return null;
  };
  const loadProdutos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: Produto[] = [];
      querySnapshot.forEach(doc => {
        produtosData.push({
          id: doc.id,
          ...doc.data()
        } as Produto);
      });
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive"
      });
    }
  };
  const loadProcessamentos = async () => {
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, orderBy("Processamento.timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const processamentosData: ProcessamentoData[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data().Processamento;
        if (data) {
          processamentosData.push({
            id: doc.id,
            dataProcessamento: data.dataProcessamento,
            turnosProcessados: data.turnosProcessados,
            kgTotal: data.kgTotal || 0,
            kgTurno1: data.kgTurno1 || 0,
            kgTurno2: data.kgTurno2 || 0,
            planejadoTurno1: data.planejadoTurno1 || 0,
            planejadoTurno2: data.planejadoTurno2 || 0,
            planoDiario: data.planoDiario || 0,
            timestamp: data.timestamp.toDate()
          });
        }
      });
      setProcessamentos(processamentosData);
    } catch (error) {
      console.error("Erro ao carregar processamentos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar processamentos",
        variant: "destructive"
      });
    }
  };
  const calcularRealizadoPorClassificacao = (classificacao: string): number => {
    // Usar dados PCP reais diretamente
    return pcpData
      .filter(item => (item.classificacao || item.setor || 'Sem classificação') === classificacao)
      .reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
  };
  const inicializarMetas = () => {
    if (pcpLoading) return;

    // Obter classificações únicas dos dados PCP reais
    const classificacoesUnicas = [...new Set(pcpData.map(item => 
      item.classificacao || item.setor || 'Sem classificação'
    ))].filter(Boolean);

    const metasComRealizado: MetaPorClassificacao[] = [];
    
    for (const classificacao of classificacoesUnicas) {
      const meta = metasPadrao[classificacao] || (config?.meta_minima_mensal || 0) * 0.1; // 10% como fallback
      const realizado = calcularRealizadoPorClassificacao(classificacao);
      const percentual = meta > 0 ? realizado / meta * 100 : 0;
      
      metasComRealizado.push({
        classificacao,
        meta,
        realizado,
        percentual: Math.round(percentual * 100) / 100
      });
    }
    
    setMetasPorClassificacao(metasComRealizado.filter(m => m.realizado > 0 || m.meta > 0));
  };
  const handlePeriodoChange = (tipo: string) => {
    const hoje = new Date();
    let inicio: string;
    let fim: string;
    switch (tipo) {
      case 'diario':
        inicio = format(hoje, 'yyyy-MM-dd');
        fim = format(hoje, 'yyyy-MM-dd');
        break;
      case 'semanal':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        inicio = format(inicioSemana, 'yyyy-MM-dd');
        fim = format(fimSemana, 'yyyy-MM-dd');
        break;
      case 'mensal':
        inicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
        fim = format(endOfMonth(hoje), 'yyyy-MM-dd');
        break;
      default:
        return;
    }
    setPeriodo({
      inicio,
      fim,
      tipo: tipo as any
    });
  };
  const handleEditarMeta = (classificacao: string, metaAtual: number) => {
    setEditandoMeta(classificacao);
    setNovaMetaTemp(metaAtual);
  };
  const handleSalvarMeta = (classificacao: string) => {
    setMetasPorClassificacao(prev => prev.map(meta => meta.classificacao === classificacao ? {
      ...meta,
      meta: novaMetaTemp,
      percentual: novaMetaTemp > 0 ? meta.realizado / novaMetaTemp * 100 : 0
    } : meta));
    setEditandoMeta(null);
    toast({
      title: "Meta atualizada",
      description: `Meta para ${classificacao} atualizada para ${novaMetaTemp.toLocaleString()} kg`
    });
  };
  const handleCancelarEdicao = () => {
    setEditandoMeta(null);
    setNovaMetaTemp(0);
  };

  // Funções para edição dos cards principais
  const handleEditarMetaMensal = () => {
    setEditandoMetaMensal(true);
  };

  const handleSalvarMetaMensal = async () => {
    const dataToSave = {
      meta_minima_mensal: parseNumero(metaMensalFormatada),
      dias_uteis_mes: config?.dias_uteis_mes || 0
    };
    const success = await salvarConfigSistema(dataToSave);
    if (success) {
      setEditandoMetaMensal(false);
      toast({
        title: "Meta mensal atualizada",
        description: "A meta mínima mensal foi atualizada com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta mensal.",
        variant: "destructive"
      });
    }
  };

  const handleCancelarMetaMensal = () => {
    setEditandoMetaMensal(false);
    // Restaurar valor original
    if (config) {
      setMetaMensalFormatada(formatarNumeroInput(config.meta_minima_mensal || 0));
    }
  };

  const handleEditarDiasUteis = () => {
    setEditandoDiasUteis(true);
  };

  const handleSalvarDiasUteis = async () => {
    const dataToSave = {
      meta_minima_mensal: config?.meta_minima_mensal || 0,
      dias_uteis_mes: parseNumero(diasUteisFormatados)
    };
    const success = await salvarConfigSistema(dataToSave);
    if (success) {
      setEditandoDiasUteis(false);
      toast({
        title: "Dias úteis atualizados",
        description: "Os dias úteis do mês foram atualizados com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dias úteis.",
        variant: "destructive"
      });
    }
  };

  const handleCancelarDiasUteis = () => {
    setEditandoDiasUteis(false);
    // Restaurar valor original
    if (config) {
      setDiasUteisFormatados(formatarNumeroInput(config.dias_uteis_mes || 0));
    }
  };

  // Carregar dados dos parâmetros de produção usando dados PCP reais
  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        // Calcular produção total a partir dos dados PCP reais
        const producaoTotalReal = pcpData.reduce((total, item) => 
          total + (item.quantidade_produzida || 0), 0);
        setTotalProducao(producaoTotalReal);

        // Carregar meta diária realizada do último processamento
        const metaDiariaReal = await carregarMetaDiariaRealizada();
        setMetaDiariaRealizada(metaDiariaReal);

        // Contar documentos PCP criados (dias trabalhados)
        const documentosCount = await contarDocumentosPCP();
        setDiasTrabalhados(documentosCount);
      } catch (error) {
        console.error('Erro ao carregar dados reais:', error);
      }
    };
    
    if (!pcpLoading && pcpData.length > 0) {
      carregarDadosReais();
    }
  }, [pcpData, pcpLoading, carregarMetaDiariaRealizada, contarDocumentosPCP]);

  // Calcular valores derivados quando os parâmetros mudam
  useEffect(() => {
    if (!config) return;
    const metaMinimaMensal = config.meta_minima_mensal || 0;
    const diasUteisMes = config.dias_uteis_mes || 0;

    // Cálculos baseados nos dados reais
    const diasRestantes = Math.max(0, diasUteisMes - diasTrabalhados);
    const volumeRestante = Math.max(0, metaMinimaMensal - totalProducao);
    const progresso = metaMinimaMensal > 0 ? totalProducao / metaMinimaMensal * 100 : 0;
    setDiasParaFecharMes(diasRestantes);
    setVolumeDiasRestantes(volumeRestante);
    setProgressoMensal(progresso);
  }, [config, diasTrabalhados, totalProducao]);

  // Carregar dados PCP reais
  useEffect(() => {
    fetchPCPData('mes'); // Carregar dados do mês atual
    
    // Setup listener para atualizações em tempo real
    const unsubscribe = setupRealtimeListener('mes');
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchPCPData, setupRealtimeListener]);

  // Inicializar metas quando dados PCP estiverem carregados
  useEffect(() => {
    if (!pcpLoading && pcpData.length > 0) {
      inicializarMetas();
      setLoading(false);
    }
  }, [pcpData, pcpLoading, metasPadrao]);
  const formatarKg = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };
  const getCorStatus = (percentual: number) => {
    if (percentual >= 100) return "bg-green-500";
    if (percentual >= 80) return "bg-yellow-500";
    if (percentual >= 60) return "bg-orange-500";
    return "bg-red-500";
  };
  const getTextStatus = (percentual: number) => {
    if (percentual >= 100) return "text-green-700";
    if (percentual >= 80) return "text-yellow-700";
    if (percentual >= 60) return "text-orange-700";
    return "text-red-700";
  };
  const totalMeta = metasPorClassificacao.reduce((acc, item) => acc + item.meta, 0);
  const totalRealizado = metasPorClassificacao.reduce((acc, item) => acc + item.realizado, 0);
  const percentualGeral = totalMeta > 0 ? totalRealizado / totalMeta * 100 : 0;
  // Cores para os gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  // Métricas calculadas
  const metricas = useMemo(() => {
    const metaMensalConfig = config?.meta_minima_mensal || 0;
    const diasUteisConfig = config?.dias_uteis_mes || 0;
    const progresso = calcularProgressoMensal(totalProducao);
    
    const metaDiariaEsperada = diasUteisConfig > 0 ? metaMensalConfig / diasUteisConfig : 0;
    const producaoMediaDiaria = diasTrabalhados > 0 ? totalProducao / diasTrabalhados : 0;
    const eficienciaAtual = metaDiariaEsperada > 0 ? (producaoMediaDiaria / metaDiariaEsperada) * 100 : 0;
    
    return {
      metaMensal: metaMensalConfig,
      metaDiariaEsperada,
      producaoMediaDiaria,
      eficienciaAtual,
      diasRestantes: Math.max(0, diasUteisConfig - diasTrabalhados),
      volumeNecessarioRestante: Math.max(0, metaMensalConfig - totalProducao),
      progresso: progresso.progresso,
      projecao: progresso.projecao,
      status: progresso.status
    };
  }, [config, totalProducao, diasTrabalhados, calcularProgressoMensal]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    const classificacaoChart = metasPorClassificacao.map(item => ({
      name: item.classificacao.slice(0, 15) + (item.classificacao.length > 15 ? '...' : ''),
      meta: item.meta,
      realizado: item.realizado,
      percentual: item.percentual,
      gap: Math.max(0, item.meta - item.realizado)
    }));

    // Calcular tendência baseada nos dados PCP reais dos últimos 7 dias
    const tendenciaChart = Array.from({ length: 7 }, (_, i) => {
      const dia = new Date();
      dia.setDate(dia.getDate() - (6 - i));
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      
      // Filtrar dados PCP do dia específico
      const dadosDia = pcpData.filter(item => {
        const dataItem = item.data_inicio?.toDate() || item.createdAt?.toDate() || new Date();
        return format(dataItem, 'yyyy-MM-dd') === diaFormatado;
      });
      
      const realizadoDia = dadosDia.reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
      const planejadoDia = dadosDia.reduce((total, item) => total + (item.quantidade_planejada || 0), 0);
      const eficienciaDia = planejadoDia > 0 ? (realizadoDia / planejadoDia) * 100 : 0;
      
      return {
        dia: format(dia, 'dd/MM'),
        meta: metricas.metaDiariaEsperada,
        realizado: realizadoDia,
        eficiencia: eficienciaDia
      };
    });

    return { classificacaoChart, tendenciaChart };
  }, [metasPorClassificacao, metricas]);

  if (loading || configLoading || pcpLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando metas e dados de produção...</p>
        </div>
      </div>
    );
  }

  if (pcpError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{pcpError}</p>
          <Button onClick={() => fetchPCPData('mes')}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Gestão de Metas
          </h1>
          <p className="text-muted-foreground mt-2">Acompanhe e gerencie as metas de produção em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchPCPData('mes');
              inicializarMetas();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => gerarMetaMensal()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Gerar Meta Mensal
          </Button>
        </div>
      </div>

      {/* Dashboard Principal */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Dashboard</h2>
        </div>
        
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={editandoMetaMensal ? handleCancelarMetaMensal : handleEditarMetaMensal}
                className="h-6 w-6 p-0"
              >
                {editandoMetaMensal ? <X className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
              </Button>
              {editandoMetaMensal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSalvarMetaMensal}
                  className="h-6 w-6 p-0"
                >
                  <Save className="h-3 w-3 text-green-600" />
                </Button>
              )}
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {editandoMetaMensal ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={metaMensalFormatada}
                  onChange={(e) => setMetaMensalFormatada(e.target.value)}
                  placeholder="Ex: 100.000"
                  className="text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground">Meta Mínima Mensal (KG)</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatarNumero(metricas.metaMensal)} kg</div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </>
            )}
          </CardContent>
        </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produção Atual</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(totalProducao)} kg</div>
              <div className="flex items-center gap-1">
                <Badge 
                  variant={metricas.status === 'otimo' ? 'default' : 
                          metricas.status === 'bom' ? 'secondary' : 
                          metricas.status === 'atencao' ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {metricas.progresso.toFixed(1)}% da meta
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.eficienciaAtual.toFixed(1)}%</div>
              <div className="flex items-center gap-1">
                {metricas.eficienciaAtual >= 100 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : metricas.eficienciaAtual >= 80 ? (
                  <Clock className="h-3 w-3 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                )}
                <span className="text-xs text-muted-foreground">vs meta diária</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Restantes</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={editandoDiasUteis ? handleCancelarDiasUteis : handleEditarDiasUteis}
                  className="h-6 w-6 p-0"
                >
                  {editandoDiasUteis ? <X className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                </Button>
                {editandoDiasUteis && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSalvarDiasUteis}
                    className="h-6 w-6 p-0"
                  >
                    <Save className="h-3 w-3 text-green-600" />
                  </Button>
                )}
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {editandoDiasUteis ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={diasUteisFormatados}
                    onChange={(e) => setDiasUteisFormatados(e.target.value)}
                    placeholder="Ex: 22"
                    className="text-lg font-bold"
                  />
                  <p className="text-xs text-muted-foreground">Dias Úteis no Mês</p>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metricas.diasRestantes}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatarNumero(metricas.volumeNecessarioRestante)} kg necessários
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progresso Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso da Meta Mensal
            </CardTitle>
            <CardDescription>
              Acompanhamento em tempo real do cumprimento das metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso Atual</span>
                <span className="text-sm text-muted-foreground">
                  {formatarNumero(totalProducao)} / {formatarNumero(metricas.metaMensal)} kg
                </span>
              </div>
              <Progress value={metricas.progresso} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{metricas.progresso.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Concluído</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{formatarNumero(metricas.producaoMediaDiaria)} kg</div>
                  <div className="text-xs text-muted-foreground">Média Diária</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{formatarNumero(metricas.projecao)} kg</div>
                  <div className="text-xs text-muted-foreground">Projeção Final</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Tendência */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência Semanal</CardTitle>
              <CardDescription>Comparação entre meta e produção realizada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGraficos.tendenciaChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatarNumero(value) + ' kg', '']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Meta Diária"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realizado" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Produção Real"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico Pizza - Status das Metas */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Metas por Classificação</CardTitle>
              <CardDescription>Distribuição do cumprimento das metas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metasPorClassificacao.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ classificacao, percentual }) => `${classificacao.slice(0, 10)}: ${percentual.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentual"
                  >
                    {metasPorClassificacao.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toFixed(1) + '%', 'Progresso']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Por Classificação */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Por Classificação</h2>
        </div>
        
        {/* Configuração de Parâmetros */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parâmetros de Produção
                </CardTitle>
                <CardDescription>
                  Configure as metas e parâmetros básicos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="meta_minima_mensal" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Mínima Mensal (KG)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            value={metaMensalFormatada} 
                            onChange={(e) => {
                              const valor = e.target.value;
                              setMetaMensalFormatada(valor);
                              field.onChange(parseNumero(valor));
                            }} 
                            placeholder="Ex: 100.000" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="dias_uteis_mes" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dias Úteis no Mês</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            value={diasUteisFormatados} 
                            onChange={(e) => {
                              const valor = e.target.value;
                              setDiasUteisFormatados(valor);
                              field.onChange(parseNumero(valor));
                            }} 
                            placeholder="Ex: 22" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* Tabela de Metas por Classificação */}
        <Card>
          <CardHeader>
            <CardTitle>Metas por Classificação</CardTitle>
            <CardDescription>
              Gerencie as metas individuais por categoria de produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classificação</TableHead>
                  <TableHead className="text-right">Meta (kg)</TableHead>
                  <TableHead className="text-right">Realizado (kg)</TableHead>
                  <TableHead className="text-right">Diferença (Kg)</TableHead>
                  <TableHead className="text-right">Progresso</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metasPorClassificacao.map((item) => (
                  <TableRow key={item.classificacao}>
                    <TableCell className="font-medium">{item.classificacao}</TableCell>
                    <TableCell className="text-right">
                      {editandoMeta === item.classificacao ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={novaMetaTemp}
                            onChange={(e) => setNovaMetaTemp(Number(e.target.value))}
                            className="w-24 text-right"
                          />
                          <Button size="sm" onClick={() => handleSalvarMeta(item.classificacao)}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelarEdicao}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        formatarKg(item.meta)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatarKg(item.realizado)}</TableCell>
                    <TableCell className="text-right">
                      {formatarKg(Math.max(0, item.meta - item.realizado))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentual} className="w-16 h-2" />
                        <span className="text-sm">{item.percentual.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          item.percentual >= 100 ? 'default' :
                          item.percentual >= 80 ? 'secondary' :
                          item.percentual >= 60 ? 'outline' : 'destructive'
                        }
                      >
                        {item.percentual >= 100 ? 'Atingida' :
                         item.percentual >= 80 ? 'Boa' :
                         item.percentual >= 60 ? 'Atenção' : 'Crítica'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditarMeta(item.classificacao, item.meta)}
                        disabled={editandoMeta !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Comparação Meta vs Realizado */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação: Meta vs Realizado</CardTitle>
            <CardDescription>Análise visual do desempenho por classificação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosGraficos.classificacaoChart} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatarNumero(value) + ' kg', 
                    name === 'meta' ? 'Meta' : 
                    name === 'realizado' ? 'Realizado' : 'Gap'
                  ]}
                  labelStyle={{ color: 'black' }}
                />
                <Legend />
                <Bar dataKey="meta" fill="#3B82F6" name="Meta" />
                <Bar dataKey="realizado" fill="#10B981" name="Realizado" />
                <Bar dataKey="gap" fill="#EF4444" name="Gap" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Histórico */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Histórico</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Metas</CardTitle>
            <CardDescription>
              Acompanhe a evolução das metas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>Funcionalidade de histórico em desenvolvimento</p>
              <p className="text-sm">Em breve você poderá visualizar tendências e comparações históricas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Metas;