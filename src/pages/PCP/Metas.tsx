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
import { HistoricoTendenciasCard } from "@/components/HistoricoTendenciasCard";
import { usePCPConfig } from "@/hooks/usePCPConfig";
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { doc, getDoc, collection, getDocs, query, orderBy, where, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { usePCPOptimized } from "@/hooks/usePCPOptimized";
import { useProcessamentoStatus } from "@/hooks/useProcessamentoStatus";
const configSchema = z.object({
  meta_minima_mensal: z.number().min(1, "Meta mínima mensal deve ser maior que 0"),
  dias_uteis_mes: z.number().min(1, "Dias úteis deve ser maior que 0").max(31, "Máximo de 31 dias")
});
type ConfigFormData = z.infer<typeof configSchema>;
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"];
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
interface MetaPorClassificacao {
  classificacao: string;
  meta: number;
  realizado: number;
  percentual: number;
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

  // Hook para verificar status de processamento
  const {
    temPendenciaHoje,
    loading: processamentoLoading,
    verificarDatasNaoProcessadas
  } = useProcessamentoStatus();

  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [metasPorClassificacao, setMetasPorClassificacao] = useState<MetaPorClassificacao[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [usandoDadosOntem, setUsandoDadosOntem] = useState(false);

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

  // Metas padrão baseadas na configuração do sistema e dados reais
  const metasPadrao = useMemo(() => {
    const metaBase = config?.meta_minima_mensal || 100000;

    // Calcular distribuição baseada nos dados históricos reais
    const producaoPorClassificacao = new Map<string, number>();
    let totalProducaoHistorica = 0;
    pcpData.forEach(item => {
      const classificacao = item.classificacao || item.setor || 'Sem classificação';
      const producao = item.quantidade_produzida || 0;
      producaoPorClassificacao.set(classificacao, (producaoPorClassificacao.get(classificacao) || 0) + producao);
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
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  const parseNumero = (valor: string): number => {
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
      setMetaMensalFormatada(formatarNumeroInput(metaMinima));
      setDiasUteisFormatados(formatarNumeroInput(diasUteis));
    }
  }, [config, configLoading, form]);
  const onSubmit = async (data: ConfigFormData) => {
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
  // Função para calcular produção do dia atual por classificação
  // Filtrar apenas dados processados (campo "processado" = "sim")
  const dadosProcessados = useMemo(() => {
    // Aqui filtramos dados já processados
    // Como os dados PCP vêm dos documentos que já foram processados, mantemos todos
    return pcpData;
  }, [pcpData]);
  const calcularRealizadoDiaAtual = (classificacao: string): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Usar padrão 00:00
    const dataHoje = hoje.toISOString().split('T')[0];

    // Buscar nos dados PCP carregados pelo hook usePCP
    const dadosHoje = pcpData.filter(item => {
      let dataItem = '';
      if (item.data_inicio && typeof item.data_inicio === 'object' && item.data_inicio.toDate) {
        dataItem = item.data_inicio.toDate().toISOString().split('T')[0];
      }
      return dataItem === dataHoje && (item.classificacao || item.setor || 'Sem classificação') === classificacao;
    });
    return dadosHoje.reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
  };
  const calcularRealizadoDiaAnterior = (classificacao: string): number => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0); // Usar padrão 00:00
    const dataOntem = ontem.toISOString().split('T')[0];

    // Buscar nos dados PCP carregados pelo hook usePCP
    const dadosOntem = pcpData.filter(item => {
      let dataItem = '';
      if (item.data_inicio && typeof item.data_inicio === 'object' && item.data_inicio.toDate) {
        dataItem = item.data_inicio.toDate().toISOString().split('T')[0];
      }
      return dataItem === dataOntem && (item.classificacao || item.setor || 'Sem classificação') === classificacao;
    });
    return dadosOntem.reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
  };
  const inicializarMetas = async () => {
    if (pcpLoading) return;
    try {
      // Carregar metas salvas do Firestore primeiro
      const metasSalvas = await carregarMetasDoFirestore();
      console.log('Metas carregadas do Firestore:', metasSalvas);
      const classificacoesUnicas = [...new Set(dadosProcessados.map(item => item.classificacao || item.setor || 'Sem classificação'))].filter(Boolean);

      // Se há dados PCP mas nenhuma classificação, usar dados padrão
      if (classificacoesUnicas.length === 0 && dadosProcessados.length === 0) {
        const classificacoesPadrao = Object.keys(metasPadrao);
        classificacoesUnicas.push(...classificacoesPadrao);
      }
      const metasComRealizado: MetaPorClassificacao[] = [];
      let temProducaoHoje = false;
      for (const classificacao of classificacoesUnicas) {
        const realizadoDiaAtual = calcularRealizadoDiaAtual(classificacao);
        const realizadoDiaAnterior = await calcularRealizadoDiaAnterior(classificacao);

        // Verificar se há produção hoje para qualquer classificação
        if (realizadoDiaAtual > 0) {
          temProducaoHoje = true;
        }

        // Priorizar meta salva, depois padrão, depois cálculo baseado na meta mensal
        let metaDiaria = 0;
        if (metasSalvas && metasSalvas[classificacao]) {
          // Se há meta salva, usar ela (já é diária)
          metaDiaria = metasSalvas[classificacao];
          console.log(`Meta salva encontrada para ${classificacao}: ${metaDiaria}`);
        } else {
          // Calcular meta diária baseada na meta mensal padrão
          const metaMensal = metasPadrao[classificacao] || (config?.meta_minima_mensal || 100000) * 0.1;
          metaDiaria = config?.dias_uteis_mes ? metaMensal / config.dias_uteis_mes : metaMensal / 22;
          console.log(`Meta calculada para ${classificacao}: ${metaDiaria} (mensal: ${metaMensal})`);
        }

        // Usar dia atual se há produção, senão usar dia anterior
        const realizadoFinal = realizadoDiaAtual > 0 ? realizadoDiaAtual : realizadoDiaAnterior;
        const percentual = metaDiaria > 0 ? realizadoFinal / metaDiaria * 100 : 0;
        metasComRealizado.push({
          classificacao,
          meta: metaDiaria,
          realizado: realizadoFinal,
          percentual: Math.round(percentual * 100) / 100
        });
      }

      // Definir se estamos usando dados do dia anterior baseado na produção geral
      setUsandoDadosOntem(!temProducaoHoje);

      // Verificar se estamos usando dados do dia anterior
      // setUsandoDadosOntem(!temProducaoHoje); // Movido para cima

      // Incluir todas as metas, mesmo as que não têm produção no dia atual
      setMetasPorClassificacao(metasComRealizado);
      console.log('Metas inicializadas:', metasComRealizado);
    } catch (error) {
      console.error('Erro ao inicializar metas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas. Usando valores padrão.",
        variant: "destructive"
      });
    }
  };
  const handleEditarMeta = (classificacao: string, metaAtual: number) => {
    setEditandoMeta(classificacao);
    setNovaMetaTemp(metaAtual);
  };
  const handleSalvarMeta = async (classificacao: string) => {
    try {
      // Atualizar estado local
      const novasMetasLocal = metasPorClassificacao.map(meta => meta.classificacao === classificacao ? {
        ...meta,
        meta: novaMetaTemp,
        percentual: novaMetaTemp > 0 ? meta.realizado / novaMetaTemp * 100 : 0
      } : meta);
      setMetasPorClassificacao(novasMetasLocal);

      // Salvar no Firestore
      await salvarMetasNoFirestore(novasMetasLocal);
      setEditandoMeta(null);
      toast({
        title: "Meta atualizada",
        description: `Meta diária para ${classificacao} atualizada para ${novaMetaTemp.toLocaleString()} kg`
      });
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleCancelarEdicao = () => {
    setEditandoMeta(null);
    setNovaMetaTemp(0);
  };

  // Função para salvar metas no Firestore
  const salvarMetasNoFirestore = async (metas: MetaPorClassificacao[]) => {
    try {
      const metasParaSalvar: Record<string, number> = {};
      metas.forEach(meta => {
        metasParaSalvar[meta.classificacao] = meta.meta;
      });
      console.log('Salvando metas no Firestore:', metasParaSalvar);
      const docRef = doc(db, "PCP_configuracoes", "metas");
      await setDoc(docRef, {
        metas: metasParaSalvar,
        dataAtualizacao: new Date(),
        metaMensalTotal: config?.meta_minima_mensal || 0
      }, {
        merge: true
      });
      console.log('Metas salvas com sucesso no Firestore');
    } catch (error) {
      console.error("Erro ao salvar metas no Firestore:", error);
      throw error;
    }
  };

  // Função para carregar metas do Firestore
  const carregarMetasDoFirestore = async (): Promise<Record<string, number> | null> => {
    try {
      const docRef = doc(db, "PCP_configuracoes", "metas");
      console.log('Tentando carregar metas da coleção PCP_configuracoes...');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Documento de metas encontrado:', data);
        if (data.metas && typeof data.metas === 'object') {
          console.log('Metas carregadas com sucesso:', data.metas);
          return data.metas;
        } else {
          console.log('Estrutura de metas inválida no documento');
          return null;
        }
      } else {
        console.log('Documento de metas não encontrado');
        return null;
      }
    } catch (error) {
      console.error("Erro ao carregar metas do Firestore:", error);
      return null;
    }
  };

  // Carregar dados dos parâmetros de produção usando dados PCP reais
  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        const producaoTotalReal = dadosProcessados.reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
        setTotalProducao(producaoTotalReal);
        const metaDiariaReal = await carregarMetaDiariaRealizada();
        setMetaDiariaRealizada(metaDiariaReal);
        const documentosCount = await contarDocumentosPCP();
        setDiasTrabalhados(documentosCount);
      } catch (error) {
        console.error('Erro ao carregar dados reais:', error);
      }
    };
    if (!pcpLoading && dadosProcessados.length > 0) {
      carregarDadosReais();
    }
  }, [dadosProcessados, pcpLoading, carregarMetaDiariaRealizada, contarDocumentosPCP]);

  // Calcular valores derivados quando os parâmetros mudam
  useEffect(() => {
    if (!config) return;
    const metaMinimaMensal = config.meta_minima_mensal || 0;
    const diasUteisMes = config.dias_uteis_mes || 0;
    const diasRestantes = Math.max(0, diasUteisMes - diasTrabalhados);
    const volumeRestante = Math.max(0, metaMinimaMensal - totalProducao);
    const progresso = metaMinimaMensal > 0 ? totalProducao / metaMinimaMensal * 100 : 0;
    setDiasParaFecharMes(diasRestantes);
    setVolumeDiasRestantes(volumeRestante);
    setProgressoMensal(progresso);
  }, [config, diasTrabalhados, totalProducao]);

  // Carregar dados PCP reais
  useEffect(() => {
    fetchPCPData('mes');
    const unsubscribe = setupRealtimeListener('mes');
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchPCPData, setupRealtimeListener]);

  // Carregar produtos e inicializar metas
  useEffect(() => {
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
      }
    };
    loadProdutos();
  }, []);
  useEffect(() => {
    if (!pcpLoading && dadosProcessados.length >= 0) {
      inicializarMetas();
      setLoading(false);
    }
  }, [dadosProcessados, pcpLoading, metasPadrao, config]);
  if (loading || configLoading || pcpLoading || processamentoLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando metas e dados de produção...</p>
        </div>
      </div>;
  }
  if (pcpError) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{pcpError}</p>
          <Button onClick={() => fetchPCPData('mes')}>
            Tentar novamente
          </Button>
        </div>
      </div>;
  }
  return <div className="space-y-8">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Gestão de Metas
          </h1>
          <p className="text-muted-foreground mt-2">Acompanhe e gerencie as metas de produção em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
          fetchPCPData('mes');
          inicializarMetas();
          verificarDatasNaoProcessadas();
        }} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
        </div>
      </div>

      {/* SEÇÃO 1: CONFIGURAÇÕES PRINCIPAIS */}
      <div className="space-y-6">
        
        {/* Alerta de Processamento Pendente */}
        {temPendenciaHoje && <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    Processamento Pendente
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Há dados de produção do dia atual que ainda não foram processados. 
                    Acesse a aba <strong>Processamento</strong> para processar a produção do dia.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
              // Disparar evento customizado para mudar a aba
              const event = new CustomEvent('changeTab', {
                detail: 'processamento'
              });
              window.dispatchEvent(event);
            }} className="ml-auto border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20">
                  Processar Agora
                </Button>
              </div>
            </CardContent>
          </Card>}
        
        {/* Controle e Progresso da Meta Mensal Unificado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Controle e Progresso da Meta Mensal
            </CardTitle>
            <CardDescription>
              Configure parâmetros e acompanhe o progresso em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="meta_minima_mensal" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Meta Mínima Mensal (KG)</FormLabel>
                          <FormControl>
                            <Input {...field} value={metaMensalFormatada} onChange={e => {
                        setMetaMensalFormatada(e.target.value);
                        field.onChange(parseNumero(e.target.value));
                      }} disabled={!editandoMetaMensal} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <FormField control={form.control} name="dias_uteis_mes" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Dias Úteis do Mês</FormLabel>
                          <FormControl>
                            <Input {...field} value={diasUteisFormatados} onChange={e => {
                        setDiasUteisFormatados(e.target.value);
                        field.onChange(parseNumero(e.target.value));
                      }} disabled={!editandoDiasUteis} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    {!editandoMetaMensal && !editandoDiasUteis && <Button type="button" variant="outline" onClick={() => {
                    setEditandoMetaMensal(true);
                    setEditandoDiasUteis(true);
                  }} className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Editar Configurações
                      </Button>}
                    
                    {(editandoMetaMensal || editandoDiasUteis) && <>
                        <Button type="submit" className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Salvar
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                      setEditandoMetaMensal(false);
                      setEditandoDiasUteis(false);
                      if (config) {
                        setMetaMensalFormatada(formatarNumeroInput(config.meta_minima_mensal || 0));
                        setDiasUteisFormatados(formatarNumeroInput(config.dias_uteis_mes || 0));
                      }
                    }} className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </>}
                  </div>
                </div>
              </form>
            </Form>
            
            <Separator />
            
            {/* Resumo do Progresso Mensal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo do Progresso Mensal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dias Trabalhados</p>
                        <p className="text-2xl font-bold">{diasTrabalhados}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dias Restantes</p>
                        <p className="text-2xl font-bold">{diasParaFecharMes}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Produzido</p>
                        <p className="text-2xl font-bold">{formatarNumero(totalProducao)} kg</p>
                      </div>
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                        <p className="text-2xl font-bold">{progressoMensal.toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Meta Mensal de Produção</span>
                  <span>{progressoMensal.toFixed(1)}%</span>
                </div>
                <Progress value={progressoMensal} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* Por Classificação */}
      <div className="space-y-6">
        
        
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
                  <TableHead className="text-center">Meta Diária (kg)</TableHead>
                  <TableHead className="text-right">Realizado (kg)</TableHead>
                  <TableHead className="text-right">Diferença (Kg)</TableHead>
                  <TableHead className="text-center">Progresso do Dia {usandoDadosOntem ? 'Anterior' : 'Atual'}</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metasPorClassificacao.map(meta => <TableRow key={meta.classificacao}>
                    <TableCell className="font-medium">{meta.classificacao}</TableCell>
                    <TableCell className="text-center">
                      {editandoMeta === meta.classificacao ? <div className="flex justify-center">
                          <Input type="number" value={novaMetaTemp} onChange={e => setNovaMetaTemp(Number(e.target.value))} className="w-24 text-center" />
                        </div> : formatarNumero(meta.meta)}
                    </TableCell>
                    <TableCell className="text-right">{formatarNumero(meta.realizado)}</TableCell>
                    <TableCell className="text-right">
                      <span className={meta.realizado >= meta.meta ? "text-green-600" : "text-red-600"}>
                        {formatarNumero(meta.realizado - meta.meta)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={Math.min(100, meta.percentual)} className="flex-1" />
                          <span className="text-sm w-12">{meta.percentual.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {usandoDadosOntem ? 'Produzido ontem:' : 'Realizado hoje:'} {formatarNumero(meta.realizado)} kg
                          <br />
                          Falta: {formatarNumero(Math.max(0, meta.meta - meta.realizado))} kg
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {editandoMeta === meta.classificacao ? <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSalvarMeta(meta.classificacao)} className="p-1 h-8 w-8">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelarEdicao} className="p-1 h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                          </div> : <Button size="sm" variant="outline" onClick={() => handleEditarMeta(meta.classificacao, meta.meta)} className="p-1 h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Gráfico de Progresso por Classificação */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Classificação</CardTitle>
            <CardDescription>
              Visualização do progresso das metas por categoria
            </CardDescription>
          </CardHeader>
           <CardContent>
             {/* Verificar se há dados de produção */}
             {metasPorClassificacao.length === 0 || metasPorClassificacao.every(meta => meta.percentual === 0) ? <div className="flex flex-col items-center justify-center py-12 space-y-4">
                 <AlertTriangle className="h-16 w-16 text-muted-foreground" />
                 <div className="text-center">
                   <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                     Nenhum dado de produção encontrado
                   </h3>
                   <p className="text-muted-foreground">
                     Não existem dados de produção para os últimos dois dias.
                     <br />
                     Verifique se já foram processados dados de produção.
                   </p>
                 </div>
               </div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Gráfico de Pizza */}
                 <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                         <Pie data={metasPorClassificacao.slice(0, 8)} cx="50%" cy="50%" labelLine={true} label={({
                    classificacao,
                    percentual
                  }) => {
                    // Só exibir label se o percentual for maior que 3% para evitar sobreposição
                    if (percentual < 3) return '';
                    return `${classificacao}: ${percentual.toFixed(1)}%`;
                  }} outerRadius={120} fill="#8884d8" dataKey="percentual">
                          {metasPorClassificacao.slice(0, 8).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value.toFixed(1) + "%", "Progresso"]} labelFormatter={label => `Classificação: ${label}`} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>

                 {/* Lista de Classificações */}
                 <div className="space-y-3">
                   <h3 className="text-lg font-semibold mb-4">Ranking por Produção</h3>
                   <div className="space-y-2">
                     {metasPorClassificacao.slice(0, 8).sort((a, b) => b.percentual - a.percentual).map((meta, index) => {
                  const originalIndex = metasPorClassificacao.findIndex(m => m.classificacao === meta.classificacao);
                  const color = COLORS[originalIndex % COLORS.length];
                  return <div key={meta.classificacao} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                             <div className="w-4 h-4 rounded-full flex-shrink-0" style={{
                      backgroundColor: color
                    }} />
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium truncate">{meta.classificacao}</p>
                               <p className="text-xs text-muted-foreground">
                                 {formatarNumero(meta.realizado)} kg / {formatarNumero(meta.meta)} kg
                               </p>
                             </div>
                             <div className="text-right flex-shrink-0">
                               <p className={`text-sm font-semibold ${meta.percentual >= 80 ? "text-green-600" : meta.percentual >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                 {meta.percentual.toFixed(1)}%
                               </p>
                             </div>
                           </div>;
                })}
                   </div>
                 </div>
               </div>}
           </CardContent>
        </Card>
      </div>

      {/* Histórico e Tendências */}
      <div className="space-y-6">
        
        
        <HistoricoTendenciasCard />
      </div>
    </div>;
};
export default Metas;