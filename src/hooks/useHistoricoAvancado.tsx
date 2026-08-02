import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subMonths, 
  subYears,
  differenceInDays, 
  isAfter, 
  isBefore,
  parseISO,
  isValid,
  eachDayOfInterval,
  isWeekend,
  addDays,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DadoProducaoDetalhado {
  data: string;
  producao: number;
  meta: number;
  eficiencia: number;
  turno1: number;
  turno2: number;
  classificacoes: Record<string, number>;
  diaSemana: number;
  diaUtil: boolean;
  bateuMeta: boolean;
  desvioMeta: number;
}

export interface AnaliseComparativa {
  periodo: 'mes' | 'ano';
  atual: {
    producao: number;
    meta: number;
    eficiencia: number;
    diasComMeta: number;
    totalDias: number;
    mediaProducaoDiaria: number;
    tendencia: 'crescente' | 'estavel' | 'decrescente';
  };
  anterior: {
    producao: number;
    meta: number;
    eficiencia: number;
    diasComMeta: number;
    totalDias: number;
    mediaProducaoDiaria: number;
  };
  comparacao: {
    producaoVariacao: number;
    eficienciaVariacao: number;
    metaVariacao: number;
    consistenciaVariacao: number;
  };
}

export interface PrevisaoAvancada {
  probabilidadeMetaMensal: number;
  probabilidadeMetaAnual: number;
  producaoNecessariaDiaria: number;
  diasRestantesMes: number;
  diasRestantesAno: number;
  cenarios: {
    conservador: number;
    realista: number;
    otimista: number;
  };
  recomendacoes: string[];
}

export interface MetricasConsistencia {
  desviopadrao: number;
  coeficienteVariacao: number;
  indiceConfiabilidade: number;
  frequenciaBateMeta: number;
  maiorSequenciaPositiva: number;
  maiorSequenciaNegativa: number;
}

export interface AnaliseDesempenho {
  melhorDia: DadoProducaoDetalhado;
  piorDia: DadoProducaoDetalhado;
  melhorSemana: {
    inicio: string;
    fim: string;
    producao: number;
    media: number;
  };
  piorSemana: {
    inicio: string;
    fim: string;
    producao: number;
    media: number;
  };
  padroesDiaSemana: Record<number, {
    producaoMedia: number;
    frequenciaBateMeta: number;
    amostras: number;
  }>;
}

export const useHistoricoAvancado = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para dados históricos
  const [dadosHistoricos, setDadosHistoricos] = useState<DadoProducaoDetalhado[]>([]);
  const [analiseComparativaMes, setAnaliseComparativaMes] = useState<AnaliseComparativa | null>(null);
  const [analiseComparativaAno, setAnaliseComparativaAno] = useState<AnaliseComparativa | null>(null);
  const [previsaoAvancada, setPrevisaoAvancada] = useState<PrevisaoAvancada | null>(null);
  const [metricasConsistencia, setMetricasConsistencia] = useState<MetricasConsistencia | null>(null);
  const [analiseDesempenho, setAnaliseDesempenho] = useState<AnaliseDesempenho | null>(null);

  // Carregar metas por classificação
  const carregarMetasPorClassificacao = useCallback(async () => {
    try {
      const metasRef = doc(db, "PCP_configuracoes", "metas");
      const metasSnapshot = await getDoc(metasRef);
      return metasSnapshot.exists() ? metasSnapshot.data()?.metas || {} : {};
    } catch (error) {
      console.error('Erro ao carregar metas por classificação:', error);
      return {};
    }
  }, []);

  // Carregar dados históricos detalhados
  const carregarDadosHistoricos = useCallback(async (periodoMeses: number = 3) => {
    try {
      setLoading(true);
      setError(null);

      const hoje = new Date();
      const dataInicio = subMonths(startOfMonth(hoje), periodoMeses - 1);
      
      // Carregar metas
      const metasPorClassificacao = await carregarMetasPorClassificacao();
      let metaDiariaTotal = 0;
      Object.values(metasPorClassificacao).forEach((meta: any) => {
        if (typeof meta === 'number') {
          metaDiariaTotal += meta;
        }
      });

      // Buscar dados PCP
      const pcpQuery = query(
        collection(db, "PCP"),
        orderBy("__name__")
      );
      
      const pcpSnapshot = await getDocs(pcpQuery);
      const dadosProcessados: DadoProducaoDetalhado[] = [];

      pcpSnapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();
        
        const dateMatch = docId.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dateMatch) return;
        
        const dataProcessamento = parseISO(docId);
        if (!isValid(dataProcessamento)) return;

        // Filtrar período
        if (isBefore(dataProcessamento, dataInicio)) return;

        let producaoDia = 0;
        let producaoTurno1 = 0;
        let producaoTurno2 = 0;
        const classificacoesDia: Record<string, number> = {};

        // Calcular produção por turno
        if (data['1_turno'] && Array.isArray(data['1_turno'])) {
          data['1_turno'].forEach((item: any) => {
            const kg = parseFloat(item.kg) || 0;
            producaoTurno1 += kg;
            const classificacao = item.classificacao || 'Sem classificação';
            classificacoesDia[classificacao] = (classificacoesDia[classificacao] || 0) + kg;
          });
        }

        if (data['2_turno'] && Array.isArray(data['2_turno'])) {
          data['2_turno'].forEach((item: any) => {
            const kg = parseFloat(item.kg) || 0;
            producaoTurno2 += kg;
            const classificacao = item.classificacao || 'Sem classificação';
            classificacoesDia[classificacao] = (classificacoesDia[classificacao] || 0) + kg;
          });
        }

        // Usar dados do processamento se disponível
        if (data.Processamento?.kgTotal) {
          producaoDia = data.Processamento.kgTotal;
        } else {
          producaoDia = producaoTurno1 + producaoTurno2;
        }

        const metaDiaria = metaDiariaTotal > 0 ? metaDiariaTotal : 2000;
        const eficiencia = metaDiaria > 0 ? (producaoDia / metaDiaria) * 100 : 0;
        const diaSemana = dataProcessamento.getDay();
        const diaUtil = !isWeekend(dataProcessamento);

        dadosProcessados.push({
          data: docId,
          producao: producaoDia,
          meta: metaDiaria,
          eficiencia,
          turno1: producaoTurno1,
          turno2: producaoTurno2,
          classificacoes: classificacoesDia,
          diaSemana,
          diaUtil,
          bateuMeta: producaoDia >= metaDiaria,
          desvioMeta: producaoDia - metaDiaria
        });
      });

      // Ordenar por data
      dadosProcessados.sort((a, b) => a.data.localeCompare(b.data));
      
      setDadosHistoricos(dadosProcessados);
      return dadosProcessados;

    } catch (error) {
      console.error('Erro ao carregar dados históricos:', error);
      setError('Erro ao carregar dados históricos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [carregarMetasPorClassificacao]);

  // Calcular métricas de consistência
  const calcularMetricasConsistencia = useCallback((dados: DadoProducaoDetalhado[]): MetricasConsistencia => {
    if (dados.length === 0) {
      return {
        desviopadrao: 0,
        coeficienteVariacao: 0,
        indiceConfiabilidade: 0,
        frequenciaBateMeta: 0,
        maiorSequenciaPositiva: 0,
        maiorSequenciaNegativa: 0
      };
    }

    const producoes = dados.map(d => d.producao);
    const media = producoes.reduce((sum, val) => sum + val, 0) / producoes.length;
    
    // Desvio padrão
    const variancia = producoes.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / producoes.length;
    const desviopadrao = Math.sqrt(variancia);
    
    // Coeficiente de variação
    const coeficienteVariacao = media > 0 ? (desviopadrao / media) * 100 : 0;
    
    // Frequência de bater meta
    const diasComMeta = dados.filter(d => d.bateuMeta).length;
    const frequenciaBateMeta = (diasComMeta / dados.length) * 100;
    
    // Sequências
    let sequenciaAtualPos = 0;
    let sequenciaAtualNeg = 0;
    let maiorSequenciaPositiva = 0;
    let maiorSequenciaNegativa = 0;
    
    dados.forEach(d => {
      if (d.bateuMeta) {
        sequenciaAtualPos++;
        sequenciaAtualNeg = 0;
        maiorSequenciaPositiva = Math.max(maiorSequenciaPositiva, sequenciaAtualPos);
      } else {
        sequenciaAtualNeg++;
        sequenciaAtualPos = 0;
        maiorSequenciaNegativa = Math.max(maiorSequenciaNegativa, sequenciaAtualNeg);
      }
    });
    
    // Índice de confiabilidade (0-100)
    const indiceConfiabilidade = Math.max(0, Math.min(100, 
      100 - coeficienteVariacao + frequenciaBateMeta * 0.3
    ));

    return {
      desviopadrao,
      coeficienteVariacao,
      indiceConfiabilidade,
      frequenciaBateMeta,
      maiorSequenciaPositiva,
      maiorSequenciaNegativa
    };
  }, []);

  // Análise comparativa por período
  const calcularAnaliseComparativa = useCallback((
    dados: DadoProducaoDetalhado[], 
    periodo: 'mes' | 'ano'
  ): AnaliseComparativa => {
    const hoje = new Date();
    let inicioAtual: Date, fimAtual: Date, inicioAnterior: Date, fimAnterior: Date;

    if (periodo === 'mes') {
      inicioAtual = startOfMonth(hoje);
      fimAtual = endOfMonth(hoje);
      inicioAnterior = startOfMonth(subMonths(hoje, 1));
      fimAnterior = endOfMonth(subMonths(hoje, 1));
    } else {
      inicioAtual = startOfYear(hoje);
      fimAtual = endOfYear(hoje);
      inicioAnterior = startOfYear(subYears(hoje, 1));
      fimAnterior = endOfYear(subYears(hoje, 1));
    }

    const dadosAtual = dados.filter(d => {
      const data = parseISO(d.data);
      return data >= inicioAtual && data <= fimAtual;
    });

    const dadosAnterior = dados.filter(d => {
      const data = parseISO(d.data);
      return data >= inicioAnterior && data <= fimAnterior;
    });

    const calcularEstatisticas = (dadosPeriodo: DadoProducaoDetalhado[]) => {
      if (dadosPeriodo.length === 0) {
        return {
          producao: 0,
          meta: 0,
          eficiencia: 0,
          diasComMeta: 0,
          totalDias: 0,
          mediaProducaoDiaria: 0
        };
      }

      const producaoTotal = dadosPeriodo.reduce((sum, d) => sum + d.producao, 0);
      const metaTotal = dadosPeriodo.reduce((sum, d) => sum + d.meta, 0);
      const diasComMeta = dadosPeriodo.filter(d => d.bateuMeta).length;
      const mediaProducaoDiaria = producaoTotal / dadosPeriodo.length;

      return {
        producao: producaoTotal,
        meta: metaTotal,
        eficiencia: metaTotal > 0 ? (producaoTotal / metaTotal) * 100 : 0,
        diasComMeta,
        totalDias: dadosPeriodo.length,
        mediaProducaoDiaria
      };
    };

    const estatisticasAtual = calcularEstatisticas(dadosAtual);
    const estatisticasAnterior = calcularEstatisticas(dadosAnterior);

    // Calcular tendência baseada nos últimos 7 dias
    const ultimos7Dias = dadosAtual.slice(-7);
    const primeiros7Dias = dadosAtual.slice(0, 7);
    
    let tendencia: 'crescente' | 'estavel' | 'decrescente' = 'estavel';
    if (ultimos7Dias.length >= 3 && primeiros7Dias.length >= 3) {
      const mediaRecente = ultimos7Dias.reduce((sum, d) => sum + d.producao, 0) / ultimos7Dias.length;
      const mediaInicial = primeiros7Dias.reduce((sum, d) => sum + d.producao, 0) / primeiros7Dias.length;
      
      const variacao = ((mediaRecente - mediaInicial) / mediaInicial) * 100;
      if (variacao > 5) tendencia = 'crescente';
      else if (variacao < -5) tendencia = 'decrescente';
    }

    return {
      periodo,
      atual: { ...estatisticasAtual, tendencia },
      anterior: estatisticasAnterior,
      comparacao: {
        producaoVariacao: estatisticasAnterior.producao > 0 
          ? ((estatisticasAtual.producao - estatisticasAnterior.producao) / estatisticasAnterior.producao) * 100 
          : 0,
        eficienciaVariacao: estatisticasAnterior.eficiencia > 0 
          ? estatisticasAtual.eficiencia - estatisticasAnterior.eficiencia 
          : 0,
        metaVariacao: estatisticasAnterior.meta > 0 
          ? ((estatisticasAtual.meta - estatisticasAnterior.meta) / estatisticasAnterior.meta) * 100 
          : 0,
        consistenciaVariacao: estatisticasAnterior.totalDias > 0 
          ? ((estatisticasAtual.diasComMeta / estatisticasAtual.totalDias) - 
             (estatisticasAnterior.diasComMeta / estatisticasAnterior.totalDias)) * 100
          : 0
      }
    };
  }, []);

  // Previsão avançada
  const calcularPrevisaoAvancada = useCallback((dados: DadoProducaoDetalhado[]): PrevisaoAvancada => {
    const hoje = new Date();
    const fimMes = endOfMonth(hoje);
    const fimAno = endOfYear(hoje);
    const diasRestantesMes = differenceInDays(fimMes, hoje);
    const diasRestantesAno = differenceInDays(fimAno, hoje);

    // Dados do mês atual
    const dadosMesAtual = dados.filter(d => {
      const data = parseISO(d.data);
      return data >= startOfMonth(hoje) && data <= hoje;
    });

    if (dadosMesAtual.length === 0) {
      return {
        probabilidadeMetaMensal: 50,
        probabilidadeMetaAnual: 50,
        producaoNecessariaDiaria: 2000,
        diasRestantesMes,
        diasRestantesAno,
        cenarios: { conservador: 0, realista: 0, otimista: 0 },
        recomendacoes: ['Dados insuficientes para análise']
      };
    }

    const producaoMesAtual = dadosMesAtual.reduce((sum, d) => sum + d.producao, 0);
    const metaMesAtual = dadosMesAtual.reduce((sum, d) => sum + d.meta, 0);
    const mediaProducaoDiaria = producaoMesAtual / dadosMesAtual.length;
    
    // Análise de consistência dos últimos 30 dias
    const ultimos30Dias = dados.slice(-30);
    const frequenciaBateMeta = ultimos30Dias.length > 0 
      ? (ultimos30Dias.filter(d => d.bateuMeta).length / ultimos30Dias.length) * 100 
      : 50;

    // Produção necessária por dia
    const producaoRestanteMes = Math.max(0, metaMesAtual - producaoMesAtual);
    const producaoNecessariaDiaria = diasRestantesMes > 0 
      ? producaoRestanteMes / diasRestantesMes 
      : 0;

    // Probabilidades baseadas em performance histórica
    const probabilidadeMetaMensal = Math.min(95, Math.max(5, 
      frequenciaBateMeta * 0.7 + 
      (producaoMesAtual / metaMesAtual) * 30
    ));

    const probabilidadeMetaAnual = Math.min(90, Math.max(10, 
      frequenciaBateMeta * 0.6 + 
      (dados.filter(d => d.bateuMeta).length / dados.length) * 40
    ));

    // Cenários de produção
    const desviopadrao = calcularMetricasConsistencia(ultimos30Dias).desviopadrao;
    const cenarios = {
      conservador: Math.max(0, mediaProducaoDiaria - desviopadrao * 0.5),
      realista: mediaProducaoDiaria,
      otimista: mediaProducaoDiaria + desviopadrao * 0.3
    };

    // Recomendações
    const recomendacoes: string[] = [];
    if (frequenciaBateMeta < 70) {
      recomendacoes.push('Revisar processos para aumentar consistência');
    }
    if (producaoNecessariaDiaria > mediaProducaoDiaria * 1.2) {
      recomendacoes.push('Aumentar capacidade diária em 20%');
    }
    if (probabilidadeMetaMensal < 60) {
      recomendacoes.push('Implementar ações corretivas imediatas');
    }

    return {
      probabilidadeMetaMensal,
      probabilidadeMetaAnual,
      producaoNecessariaDiaria,
      diasRestantesMes,
      diasRestantesAno,
      cenarios,
      recomendacoes
    };
  }, [calcularMetricasConsistencia]);

  // Análise de desempenho
  const calcularAnaliseDesempenho = useCallback((dados: DadoProducaoDetalhado[]): AnaliseDesempenho => {
    if (dados.length === 0) {
      const vazio: DadoProducaoDetalhado = {
        data: '',
        producao: 0,
        meta: 0,
        eficiencia: 0,
        turno1: 0,
        turno2: 0,
        classificacoes: {},
        diaSemana: 0,
        diaUtil: false,
        bateuMeta: false,
        desvioMeta: 0
      };

      return {
        melhorDia: vazio,
        piorDia: vazio,
        melhorSemana: { inicio: '', fim: '', producao: 0, media: 0 },
        piorSemana: { inicio: '', fim: '', producao: 0, media: 0 },
        padroesDiaSemana: {}
      };
    }

    // Melhor e pior dia
    const melhorDia = dados.reduce((max, d) => d.eficiencia > max.eficiencia ? d : max);
    const piorDia = dados.reduce((min, d) => d.eficiencia < min.eficiencia ? d : min);

    // Análise semanal (grupos de 7 dias)
    const semanas = [];
    for (let i = 0; i < dados.length; i += 7) {
      const semana = dados.slice(i, i + 7);
      if (semana.length >= 5) { // Pelo menos 5 dias para análise
        const producaoSemana = semana.reduce((sum, d) => sum + d.producao, 0);
        const mediaSemana = producaoSemana / semana.length;
        
        semanas.push({
          inicio: semana[0].data,
          fim: semana[semana.length - 1].data,
          producao: producaoSemana,
          media: mediaSemana
        });
      }
    }

    const melhorSemana = semanas.length > 0 
      ? semanas.reduce((max, s) => s.media > max.media ? s : max)
      : { inicio: '', fim: '', producao: 0, media: 0 };
      
    const piorSemana = semanas.length > 0 
      ? semanas.reduce((min, s) => s.media < min.media ? s : min)
      : { inicio: '', fim: '', producao: 0, media: 0 };

    // Padrões por dia da semana
    const padroesDiaSemana: Record<number, {
      producaoMedia: number;
      frequenciaBateMeta: number;
      amostras: number;
    }> = {};

    for (let dia = 0; dia <= 6; dia++) {
      const dadosDia = dados.filter(d => d.diaSemana === dia);
      if (dadosDia.length > 0) {
        padroesDiaSemana[dia] = {
          producaoMedia: dadosDia.reduce((sum, d) => sum + d.producao, 0) / dadosDia.length,
          frequenciaBateMeta: (dadosDia.filter(d => d.bateuMeta).length / dadosDia.length) * 100,
          amostras: dadosDia.length
        };
      }
    }

    return {
      melhorDia,
      piorDia,
      melhorSemana,
      piorSemana,
      padroesDiaSemana
    };
  }, []);

  // Função principal para análise completa
  const executarAnaliseCompleta = useCallback(async (periodoMeses: number = 3) => {
    const dados = await carregarDadosHistoricos(periodoMeses);
    if (dados.length === 0) return;

    // Calcular todas as análises
    const metricas = calcularMetricasConsistencia(dados);
    const analiseMes = calcularAnaliseComparativa(dados, 'mes');
    const analiseAno = calcularAnaliseComparativa(dados, 'ano');
    const previsao = calcularPrevisaoAvancada(dados);
    const desempenho = calcularAnaliseDesempenho(dados);

    // Atualizar estados
    setMetricasConsistencia(metricas);
    setAnaliseComparativaMes(analiseMes);
    setAnaliseComparativaAno(analiseAno);
    setPrevisaoAvancada(previsao);
    setAnaliseDesempenho(desempenho);

  }, [
    carregarDadosHistoricos,
    calcularMetricasConsistencia,
    calcularAnaliseComparativa,
    calcularPrevisaoAvancada,
    calcularAnaliseDesempenho
  ]);

  return {
    // Estados
    loading,
    error,
    dadosHistoricos,
    analiseComparativaMes,
    analiseComparativaAno,
    previsaoAvancada,
    metricasConsistencia,
    analiseDesempenho,

    // Funções
    executarAnaliseCompleta,
    carregarDadosHistoricos,
    calcularMetricasConsistencia,
    calcularAnaliseComparativa,
    calcularPrevisaoAvancada,
    calcularAnaliseDesempenho
  };
};