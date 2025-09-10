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
import { usePCPOptimized } from "@/hooks/usePCPOptimized";
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
    return valor.toLocaleString('pt-BR');
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
  const calcularRealizadoPorClassificacao = (classificacao: string): number => {
    return pcpData.filter(item => (item.classificacao || item.setor || 'Sem classificação') === classificacao).reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
  };
  const inicializarMetas = () => {
    if (pcpLoading) return;
    const classificacoesUnicas = [...new Set(pcpData.map(item => item.classificacao || item.setor || 'Sem classificação'))].filter(Boolean);
    const metasComRealizado: MetaPorClassificacao[] = [];
    for (const classificacao of classificacoesUnicas) {
      const meta = metasPadrao[classificacao] || (config?.meta_minima_mensal || 0) * 0.1;
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

  // Carregar dados dos parâmetros de produção usando dados PCP reais
  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        const producaoTotalReal = pcpData.reduce((total, item) => total + (item.quantidade_produzida || 0), 0);
        setTotalProducao(producaoTotalReal);
        const metaDiariaReal = await carregarMetaDiariaRealizada();
        setMetaDiariaRealizada(metaDiariaReal);
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
    if (!pcpLoading && pcpData.length > 0) {
      inicializarMetas();
      setLoading(false);
    }
  }, [pcpData, pcpLoading, metasPadrao, config]);
  if (loading || configLoading || pcpLoading) {
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
        }} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => gerarMetaMensal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Gerar Meta Mensal
          </Button>
        </div>
      </div>

      {/* SEÇÃO 1: CONFIGURAÇÕES PRINCIPAIS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Configurações Principais</h2>
          
        </div>
        
        {/* Controle e Progresso da Meta Mensal Unificado */}
        <Card className="border-primary/20">
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
                      }} disabled={!editandoMetaMensal} className={editandoMetaMensal ? "border-primary" : ""} />
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
                      }} disabled={!editandoDiasUteis} className={editandoDiasUteis ? "border-primary" : ""} />
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

      <Separator className="my-8" />

      {/* Por Classificação */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Por Classificação</h2>
        </div>
        
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
                  <TableHead className="text-center">Progresso</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metasPorClassificacao.map(meta => <TableRow key={meta.classificacao}>
                    <TableCell className="font-medium">{meta.classificacao}</TableCell>
                    <TableCell className="text-right">
                      {editandoMeta === meta.classificacao ? <Input type="number" value={novaMetaTemp} onChange={e => setNovaMetaTemp(Number(e.target.value))} className="w-24 text-right" /> : formatarNumero(meta.meta)}
                    </TableCell>
                    <TableCell className="text-right">{formatarNumero(meta.realizado)}</TableCell>
                    <TableCell className="text-right">
                      <span className={meta.realizado >= meta.meta ? "text-green-600" : "text-red-600"}>
                        {formatarNumero(meta.realizado - meta.meta)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={Math.min(100, meta.percentual)} className="flex-1" />
                        <span className="text-sm w-12">{meta.percentual.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
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
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={metasPorClassificacao.slice(0, 8)} cx="50%" cy="50%" labelLine={true} label={({
                classificacao,
                percentual
              }) => `${classificacao}: ${percentual.toFixed(1)}%`} outerRadius={120} fill="#8884d8" dataKey="percentual">
                  {metasPorClassificacao.slice(0, 8).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toFixed(1) + '%', 'Progresso']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Histórico e Tendências */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Histórico e Tendências</h2>
          
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta seção mostrará tendências históricas e comparações de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>Funcionalidade de histórico em desenvolvimento</p>
              <p className="text-sm">Em breve você poderá visualizar tendências e comparações históricas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Metas;