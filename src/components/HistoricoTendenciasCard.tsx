import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Target, Calendar, AlertTriangle, CheckCircle2, Zap, BarChart3 } from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { doc, getDoc, collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePCPConfig } from "@/hooks/usePCPConfig";

interface ProducaoHistorica {
  data: string;
  producao: number;
  meta: number;
  eficiencia: number;
}

interface TendenciaAnalise {
  tendencia: 'crescente' | 'estavel' | 'decrescente';
  variacao: number;
  confiabilidade: number;
  previsaoMeta: boolean;
  diasRestantes: number;
  producaoNecessariaDiaria: number;
  probabilidadeSuccess: number;
  bateuMetaHoje?: boolean;
  pendenteHoje?: number;
  producaoHoje?: number;
  metaDiariaHoje?: number;
}

export const HistoricoTendenciasCard = () => {
  const { config, metaMensal, getCurrentMonth } = usePCPConfig();
  const [historico, setHistorico] = useState<ProducaoHistorica[]>([]);
  const [tendencia, setTendencia] = useState<TendenciaAnalise | null>(null);
  const [loading, setLoading] = useState(true);
  const [producaoTotal, setProducaoTotal] = useState(0);
  const [metaMensalAtual, setMetaMensalAtual] = useState(0);

  useEffect(() => {
    carregarDadosHistoricos();
  }, []);

  const carregarDadosHistoricos = async () => {
    try {
      setLoading(true);
      
      // Carregar metas por classificação da coleção PCP_configuracoes
      const metasRef = doc(db, "PCP_configuracoes", "metas");
      const metasSnapshot = await getDoc(metasRef);
      const metasPorClassificacao = metasSnapshot.exists() ? metasSnapshot.data()?.metas || {} : {};
      
      console.log('Metas carregadas por classificação:', metasPorClassificacao);
      
      // Carregar dados dos últimos 30 dias do mês atual
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      
      // Buscar TODOS os documentos PCP do mês atual (não apenas processamentos)
      const pcpQuery = query(
        collection(db, "PCP"),
        orderBy("__name__")
      );
      
      const pcpSnapshot = await getDocs(pcpQuery);
      const dadosHistoricos: ProducaoHistorica[] = [];
      let totalProducaoMes = 0;
      let metaDiariaTotal = 0;
      
      // Calcular meta diária total somando todas as classificações
      Object.values(metasPorClassificacao).forEach((meta: any) => {
        if (typeof meta === 'number') {
          metaDiariaTotal += meta;
        }
      });
      
      pcpSnapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();
        
        // Verificar se o docId é uma data válida (formato YYYY-MM-DD)
        const dateMatch = docId.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dateMatch) return;
        
        const dataProcessamento = new Date(docId);
        
        // Filtrar apenas dados do mês atual
        if (isAfter(dataProcessamento, inicioMes) || dataProcessamento.getTime() === inicioMes.getTime()) {
          let producaoDia = 0;
          
          // Verificar se existe processamento
          if (data.Processamento && data.Processamento.kgTotal) {
            producaoDia = data.Processamento.kgTotal;
          } else {
            // Calcular manualmente dos turnos
            let kgTurno1 = 0;
            let kgTurno2 = 0;
            
            // Processar 1º turno
            if (data['1_turno'] && Array.isArray(data['1_turno'])) {
              kgTurno1 = data['1_turno'].reduce((sum: number, item: any) => {
                return sum + (parseFloat(item.kg) || 0);
              }, 0);
            }
            
            // Processar 2º turno
            if (data['2_turno'] && Array.isArray(data['2_turno'])) {
              kgTurno2 = data['2_turno'].reduce((sum: number, item: any) => {
                return sum + (parseFloat(item.kg) || 0);
              }, 0);
            }
            
            producaoDia = kgTurno1 + kgTurno2;
          }
          
          // Usar meta diária baseada nas classificações ou fallback
          const metaDiaria = metaDiariaTotal > 0 ? metaDiariaTotal : (config?.meta_diaria_global || 2000);
          const eficiencia = metaDiaria > 0 ? (producaoDia / metaDiaria) * 100 : 0;
          
          dadosHistoricos.push({
            data: format(dataProcessamento, 'yyyy-MM-dd'),
            producao: producaoDia,
            meta: metaDiaria,
            eficiencia: eficiencia
          });
          
          totalProducaoMes += producaoDia;
        }
      });

      // Ordenar por data
      dadosHistoricos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      console.log('Dados históricos processados:', dadosHistoricos.length, 'dias');
      console.log('Produção total do mês:', totalProducaoMes);
      
      setHistorico(dadosHistoricos);
      setProducaoTotal(totalProducaoMes);
      
      // Calcular meta mensal usando as metas das classificações
      let metaMensalCalculada: number;
      if (metaDiariaTotal > 0) {
        const diasUteisMes = config?.dias_uteis_mes || 22;
        metaMensalCalculada = metaDiariaTotal * diasUteisMes;
      } else if (config?.meta_minima_mensal && config.meta_minima_mensal > 0) {
        metaMensalCalculada = config.meta_minima_mensal;
      } else {
        const diasUteisMes = config?.dias_uteis_mes || 22;
        const metaDiariaGlobal = config?.meta_diaria_global || 2000;
        metaMensalCalculada = diasUteisMes * metaDiariaGlobal;
      }
      setMetaMensalAtual(metaMensalCalculada);
      
      // Analisar tendências
      const analise = analisarTendencias(dadosHistoricos, metaMensalCalculada, totalProducaoMes);
      setTendencia(analise);
      
    } catch (error) {
      console.error('Erro ao carregar dados históricos:', error);
    } finally {
      setLoading(false);
    }
  };

  const analisarTendencias = (
    dados: ProducaoHistorica[], 
    metaMensal: number, 
    producaoAtual: number
  ): TendenciaAnalise => {
    if (dados.length < 1) {
      return {
        tendencia: 'estavel',
        variacao: 0,
        confiabilidade: 0,
        previsaoMeta: false,
        diasRestantes: 0,
        producaoNecessariaDiaria: 0,
        probabilidadeSuccess: 0
      };
    }

    // Analisar produção dos últimos dias disponíveis
    const dadosRecentes = dados.slice(-7); // Últimos 7 dias ou menos se houver menos dados
    const dadosAnteriores = dados.slice(-14, -7);
    
    const mediaRecente = dadosRecentes.reduce((sum, d) => sum + d.producao, 0) / dadosRecentes.length;
    const mediaAnterior = dadosAnteriores.length > 0 
      ? dadosAnteriores.reduce((sum, d) => sum + d.producao, 0) / dadosAnteriores.length
      : mediaRecente;
    
    const variacao = mediaAnterior > 0 ? ((mediaRecente - mediaAnterior) / mediaAnterior) * 100 : 0;
    
    let tendenciaCalculada: 'crescente' | 'estavel' | 'decrescente' = 'estavel';
    if (variacao > 5) tendenciaCalculada = 'crescente';
    else if (variacao < -5) tendenciaCalculada = 'decrescente';
    
    // Verificar meta diária HOJE
    const hoje = new Date();
    const hojeDateString = format(hoje, 'yyyy-MM-dd');
    const dadosHoje = dados.find(d => d.data === hojeDateString);
    
    const producaoHoje = dadosHoje?.producao || 0;
    const metaDiariaHoje = dadosHoje?.meta || (dadosRecentes.length > 0 ? dadosRecentes[dadosRecentes.length - 1].meta : 2000);
    const bateuMetaHoje = producaoHoje >= metaDiariaHoje;
    const pendenteHoje = Math.max(0, metaDiariaHoje - producaoHoje);
    
    // Calcular dias restantes no mês
    const fimMes = endOfMonth(hoje);
    const diasRestantes = differenceInDays(fimMes, hoje);
    
    // Calcular produção necessária por dia
    const producaoRestante = Math.max(0, metaMensal - producaoAtual);
    const producaoNecessariaDiaria = diasRestantes > 0 ? producaoRestante / diasRestantes : 0;
    
    // Análise da meta mensal baseada na performance diária
    let previsaoMeta = true;
    let probabilidadeSuccess = 85; // Base alta se estiver batendo metas diárias
    
    // Se não está batendo meta diária hoje, ajustar análise
    if (!bateuMetaHoje && dados.length > 0) {
      // Verificar quantos dos últimos 7 dias bateram a meta
      const diasComMeta = dadosRecentes.filter(d => d.producao >= d.meta).length;
      const percentualSucesso = (diasComMeta / dadosRecentes.length) * 100;
      
      if (percentualSucesso < 70) { // Se menos de 70% dos dias batem a meta
        // Projeção baseada na média recente (mais conservadora)
        const projecaoTotal = producaoAtual + (mediaRecente * diasRestantes);
        previsaoMeta = projecaoTotal >= metaMensal;
        
        // Calcular probabilidade baseada na consistência das metas diárias
        if (previsaoMeta) {
          probabilidadeSuccess = Math.min(90, 50 + percentualSucesso);
        } else {
          const deficit = (metaMensal - projecaoTotal) / metaMensal;
          probabilidadeSuccess = Math.max(10, percentualSucesso - (deficit * 100));
        }
      } else {
        // Se geralmente bate as metas, manter otimismo mesmo com dia ruim
        const projecaoTotal = producaoAtual + (metaDiariaHoje * diasRestantes);
        previsaoMeta = projecaoTotal >= metaMensal;
        probabilidadeSuccess = Math.max(70, percentualSucesso);
      }
    } else {
      // Se está batendo meta hoje, usar projeção otimista
      const projecaoTotal = producaoAtual + (metaDiariaHoje * diasRestantes);
      previsaoMeta = projecaoTotal >= metaMensal;
      
      if (previsaoMeta) {
        probabilidadeSuccess = Math.min(95, 80 + (dadosRecentes.filter(d => d.producao >= d.meta).length / dadosRecentes.length) * 20);
      }
    }
    
    return {
      tendencia: tendenciaCalculada,
      variacao: Math.abs(variacao),
      confiabilidade: Math.min(100, dados.length * 8), // Mais dados = mais confiável
      previsaoMeta,
      diasRestantes,
      producaoNecessariaDiaria,
      probabilidadeSuccess: Math.round(probabilidadeSuccess),
      // Dados adicionais para exibição
      bateuMetaHoje,
      pendenteHoje,
      producaoHoje,
      metaDiariaHoje
    };
  };

  const calcularDesvioPadrao = (valores: number[]): number => {
    const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
    return Math.sqrt(variancia);
  };

  const getTendenciaIcon = () => {
    if (!tendencia) return <Minus className="h-4 w-4" />;
    
    switch (tendencia.tendencia) {
      case 'crescente':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrescente':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTendenciaColor = () => {
    if (!tendencia) return 'secondary';
    
    switch (tendencia.tendencia) {
      case 'crescente':
        return 'default'; // Verde
      case 'decrescente':
        return 'destructive'; // Vermelho
      default:
        return 'secondary'; // Amarelo
    }
  };

  const getStatusMetaIcon = () => {
    if (!tendencia) return <Target className="h-4 w-4" />;
    
    if (tendencia.previsaoMeta) {
      if (tendencia.probabilidadeSuccess >= 80) {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      } else {
        return <Zap className="h-4 w-4 text-yellow-500" />;
      }
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const progressoMensal = metaMensalAtual > 0 ? (producaoTotal / metaMensalAtual) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Histórico e Tendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Analisando tendências...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Histórico e Tendências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tendência de Produção */}
          <StatsCard
            title="Tendência de Produção"
            value={
              <div className="flex items-center gap-2">
                {getTendenciaIcon()}
                <span className="capitalize">
                  {tendencia?.tendencia || 'Calculando...'}
                </span>
              </div>
            }
            icon={<TrendingUp />}
            description={
              tendencia ? `Variação de ${tendencia.variacao.toFixed(1)}% nos últimos 7 dias` : undefined
            }
            trend={
              tendencia ? {
                value: tendencia.variacao,
                positive: tendencia.tendencia === 'crescente',
                label: `Confiabilidade: ${tendencia.confiabilidade}%`
              } : undefined
            }
          />

          {/* Previsão da Meta */}
          <StatsCard
            title="Previsão da Meta"
            value={
              <div className="flex items-center gap-2">
                {getStatusMetaIcon()}
                <span className={
                  tendencia?.previsaoMeta ? 'text-green-600' : 'text-red-600'
                }>
                  {tendencia?.previsaoMeta ? 'Meta Atingível' : 'Meta em Risco'}
                </span>
              </div>
            }
            icon={<Target />}
            description={
              tendencia ? `Probabilidade de sucesso: ${tendencia.probabilidadeSuccess}%` : undefined
            }
          />
        </div>

        {/* Métricas Detalhadas - Foco no Dia Atual */}
        {tendencia && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className={`h-4 w-4 ${tendencia.bateuMetaHoje ? 'text-green-500' : 'text-orange-500'}`} />
                <span className="text-sm font-medium">Desempenho de Ontem</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${tendencia.bateuMetaHoje ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatNumber(tendencia.producaoHoje || 0)} kg
                </p>
                <span className="text-sm text-muted-foreground">
                  / {formatNumber(tendencia.metaDiariaHoje || 0)} kg
                </span>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={Math.min(100, ((tendencia.producaoHoje || 0) / (tendencia.metaDiariaHoje || 1)) * 100)} 
                  className="h-2" 
                />
                <p className={`text-xs font-medium ${tendencia.bateuMetaHoje ? 'text-green-600' : 'text-orange-600'}`}>
                  {tendencia.bateuMetaHoje 
                    ? `Meta atingida! +${formatNumber((tendencia.producaoHoje || 0) - (tendencia.metaDiariaHoje || 0))} kg` 
                    : `Faltam ${formatNumber(tendencia.pendenteHoje || 0)} kg para meta`
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Média Últimos 7 Dias</span>
              </div>
              <p className="text-2xl font-bold">
                {historico.length > 0 
                  ? formatNumber(historico.slice(-7).reduce((sum, d) => sum + d.producao, 0) / Math.min(7, historico.slice(-7).length))
                  : '0'
                } kg/dia
              </p>
              <p className="text-xs text-muted-foreground">
                {historico.length > 0 && (() => {
                  const ultimos7 = historico.slice(-7);
                  const diasComMeta = ultimos7.filter(d => d.producao >= d.meta).length;
                  const percentual = Math.round((diasComMeta / ultimos7.length) * 100);
                  return `${diasComMeta}/${ultimos7.length} dias bateram meta (${percentual}%)`;
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Status da Tendência */}
        {tendencia && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Análise</span>
              <Badge variant={getTendenciaColor()}>
                {tendencia.previsaoMeta ? 'Positiva' : 'Atenção Necessária'}
              </Badge>
            </div>
            
            {(!tendencia.previsaoMeta || (tendencia.bateuMetaHoje === false && tendencia.pendenteHoje && tendencia.pendenteHoje > 0)) && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    {tendencia.bateuMetaHoje === false ? (
                      <>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Meta diária não atingida!
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          Faltam {formatNumber(tendencia.pendenteHoje || 0)} kg para completar a meta de hoje.
                          {tendencia.diasRestantes > 0 && (
                            <> Para o mês, é necessário produzir {formatNumber(tendencia.producaoNecessariaDiaria)} kg/dia nos próximos {tendencia.diasRestantes} dias.</>
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Meta mensal em risco!
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          É necessário aumentar a produção diária para {formatNumber(tendencia.producaoNecessariaDiaria)} kg 
                          para atingir a meta mensal.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};