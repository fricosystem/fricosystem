import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';

// Tipos para as coleções PCP baseados na estrutura real do Firebase
interface PCPItem {
  codigo: string;
  cx: string;
  kg: string;
  planejamento: string;
  texto_breve: string;
}

interface PCPTurno {
  [key: string]: PCPItem; // Objetos numerados (0, 1, 2, etc.)
}

interface PCPDocument {
  id: string;
  date: string;
  '1_turno'?: PCPTurno;
  '2_turno'?: PCPTurno;
  [key: string]: any; // Para outros campos possíveis
}

// Interface para dados processados para exibição
interface PCPData {
  id: string;
  ordem_id: string;
  produto_nome: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';
  data_inicio: Timestamp;
  data_fim?: Timestamp;
  turno: '1_turno' | '2_turno';
  setor: string; // Alterado para string para aceitar qualquer classificação
  localizacao: string;
  responsavel: string;
  eficiencia?: number;
  observacoes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  codigo?: string; // Código do produto
  classificacao?: string; // Classificação do produto
}

interface PCPProduto {
  id: string;
  produto_id: string;
  nome: string;
  codigo: string;
  categoria: string;
  unidade_medida: string;
  quantidade_produzida_total: number;
  quantidade_estoque: number;
  lead_time_dias: number;
  custo_producao: number;
  meta_diaria: number;
  meta_semanal: number;
  meta_mensal: number;
  meta_anual: number;
  setor_producao: string; // Alterado para string
  classificacao?: string; // Adicionado campo classificacao
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano';

export const usePCP = () => {
  const [pcpData, setPcpData] = useState<PCPData[]>([]);
  const [pcpProdutos, setPcpProdutos] = useState<PCPProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache para otimizar performance
  const cacheRef = useRef<{
    pcpData: Map<string, PCPData[]>;
    pcpProdutos: PCPProduto[] | null;
    lastFetch: Map<string, number>;
  }>({
    pcpData: new Map(),
    pcpProdutos: null,
    lastFetch: new Map()
  });
  
  // Debounce para listeners
  const listenerTimeoutRef = useRef<NodeJS.Timeout>();
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Função para calcular range de datas baseado no período
  const getDateRange = (period: PeriodFilter) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'hoje':
        // Alterar para mostrar dados do dia anterior
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);
        return {
          start: Timestamp.fromDate(startOfYesterday),
          end: Timestamp.fromDate(endOfYesterday)
        };
      
      case 'semana':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: Timestamp.fromDate(startOfWeek),
          end: Timestamp.fromDate(new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000))
        };
      
      case 'mes':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: Timestamp.fromDate(startOfMonth),
          end: Timestamp.fromDate(new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000))
        };
      
      case 'ano':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        return {
          start: Timestamp.fromDate(startOfYear),
          end: Timestamp.fromDate(new Date(endOfYear.getTime() + 24 * 60 * 60 * 1000))
        };
      
      default:
        return {
          start: Timestamp.fromDate(startOfDay),
          end: Timestamp.fromDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
        };
    }
  };

  // Função para processar documento PCP do Firebase usando produtos carregados
  const processarDocumentoPCPComProdutos = (docId: string, docData: any, produtos: PCPProduto[]): PCPData[] => {
    const processedData: PCPData[] = [];
    
    // Processar turnos (1_turno, 2_turno, etc.)
    Object.keys(docData).forEach(key => {
      if (key.includes('turno') || key.includes('Turno')) {
        const turnoData = docData[key];
        
        // Normalizar chave do turno - pode vir como "1 Turno" ou "1_turno"
        let turnoKey: '1_turno' | '2_turno' = '1_turno';
        if (key.toLowerCase().includes('1')) {
          turnoKey = '1_turno';
        } else if (key.toLowerCase().includes('2')) {
          turnoKey = '2_turno';
        }
        
        // Verificar se turnoData é um objeto válido
        if (turnoData && typeof turnoData === 'object') {
          // Processar cada item do turno
          Object.keys(turnoData).forEach(itemKey => {
            const item = turnoData[itemKey];
            
            if (item && typeof item === 'object') {
              // Converter os dados do formato Firebase para PCPData
              const quantidade_planejada = parseFloat(item.planejamento?.toString().replace(',', '.') || '0');
              const quantidade_kg = parseFloat(item.kg?.toString().replace(',', '.') || '0');
              const quantidade_cx = parseFloat(item.cx?.toString().replace(',', '.') || '0');
              
              // Assumir que quantidade produzida é baseada em kg
              const quantidade_produzida = quantidade_kg;
              
              // Calcular eficiência
              const eficiencia = quantidade_planejada > 0 
                ? Math.round((quantidade_produzida / quantidade_planejada) * 100)
                : 0;
              
              // Determinar status baseado na eficiência
              let status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado' = 'planejado';
              if (eficiencia > 0 && eficiencia < 100) {
                status = 'em_andamento';
              } else if (eficiencia >= 100) {
                status = 'concluido';
              }
              
              // Buscar classificação do produto na coleção PCP_produtos usando o código
              const produtoEncontrado = produtos.find(p => p.codigo === item.codigo);
              const classificacao = produtoEncontrado?.classificacao || 'Sem classificação';
              
              // Determinar setor baseado na classificação do produto
              const produto_nome = item.texto_breve || 'Produto não identificado';
              
              const processedItem: PCPData = {
                id: `${docId}_${turnoKey}_${itemKey}`,
                ordem_id: `${docId}_${itemKey}`,
                produto_nome,
                quantidade_planejada,
                quantidade_produzida,
                status,
                data_inicio: Timestamp.now(), // Usar data atual como fallback
                turno: turnoKey,
                setor: classificacao, // Usar classificação como setor
                localizacao: `Linha ${parseInt(itemKey) + 1}`,
                responsavel: `Operador ${turnoKey.replace('_', ' ')}`,
                eficiencia,
                observacoes: `Código: ${item.codigo}`,
                createdAt: Timestamp.now(),
                codigo: item.codigo, // Adicionar código para facilitar relacionamento
                classificacao // Adicionar classificação
              };
              
              processedData.push(processedItem);
            }
          });
        }
      }
    });
    
    return processedData;
  };

  // Buscar dados PCP filtrados por período
  const fetchPCPData = async (period: PeriodFilter = 'hoje') => {
    try {
      setLoading(true);
      setError(null);

       // Primeiro, carregar produtos PCP para ter as classificações disponíveis
      const produtosCollectionSnapshot = await getDocs(collection(db, 'PCP_produtos'));
      let produtosArray: PCPProduto[] = [];

      if (!produtosCollectionSnapshot.empty) {
        produtosCollectionSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) { // Considerar ativo se não especificado
            produtosArray.push({
              id: doc.id,
              ...data
            } as PCPProduto);
          }
        });
      }

       setPcpProdutos(produtosArray);

      // Calcular intervalo de datas para o período
      const dateRange = getDateRange(period);

      const pcpCollectionSnapshot = await getDocs(collection(db, 'PCP'));

      let pcpDataArray: PCPData[] = [];

      // Processar documentos PCP reais usando os produtos carregados
      if (!pcpCollectionSnapshot.empty) {
        pcpCollectionSnapshot.forEach((doc) => {
         const processedItems = processarDocumentoPCPComProdutos(doc.id, doc.data(), produtosArray);
          pcpDataArray.push(...processedItems);
        });
      }

      // Aplicar filtro por período nos dados processados
      // Filtra baseado no createdAt dos itens processados
      const filteredData = pcpDataArray.filter(item => {
        const itemDate = item.createdAt.toDate();
        const startDate = dateRange.start.toDate();
        const endDate = dateRange.end.toDate();
        
        return itemDate >= startDate && itemDate <= endDate;
      });

      // Se não houver produtos na coleção PCP_produtos, criar baseado nos dados PCP
      if (produtosArray.length === 0) {
        const produtosUnicos = new Map<string, PCPProduto>();
        
        pcpDataArray.forEach(item => {
          const codigo = item.codigo || item.ordem_id;
          if (!produtosUnicos.has(codigo)) {
            produtosUnicos.set(codigo, {
              id: `prod_${codigo}`,
              produto_id: codigo,
              nome: item.produto_nome,
              codigo: codigo,
              categoria: item.classificacao || 'Sem classificação',
              unidade_medida: 'kg',
              quantidade_produzida_total: item.quantidade_produzida,
              quantidade_estoque: Math.round(item.quantidade_produzida * 0.1), // 10% do produzido
              lead_time_dias: 1,
              custo_producao: item.setor === 'embutidos' ? 8.50 : 7.80,
              meta_diaria: item.quantidade_planejada,
              meta_semanal: item.quantidade_planejada * 5,
              meta_mensal: item.quantidade_planejada * 22,
              meta_anual: item.quantidade_planejada * 260,
              setor_producao: item.classificacao || item.setor,
              classificacao: item.classificacao || 'Sem classificação',
              ativo: true,
              createdAt: Timestamp.now()
            });
          }
        });
        
        produtosArray = Array.from(produtosUnicos.values());
        setPcpProdutos(produtosArray);
      }

       // Usar dados filtrados pelo período
       setPcpData(filteredData);

    } catch (err) {
      console.error('Erro ao buscar dados PCP:', err);
      setError(`Erro ao carregar dados do PCP: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Configurar listener em tempo real para dados PCP
  const setupRealtimeListener = (period: PeriodFilter = 'hoje') => {
    try {
      // Calcular intervalo de datas para o período
      const dateRange = getDateRange(period);
      
      // Usar listener simples na coleção PCP para capturar mudanças
      const unsubscribe = onSnapshot(collection(db, 'PCP'), async (snapshot) => {
        
        // Carregar produtos atualizados para o listener
        const produtosCollectionSnapshot = await getDocs(collection(db, 'PCP_produtos'));
        let produtosArray: PCPProduto[] = [];

        if (!produtosCollectionSnapshot.empty) {
          produtosCollectionSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.ativo !== false) {
              produtosArray.push({
                id: doc.id,
                ...data
              } as PCPProduto);
            }
          });
        }
        
        const pcpDataArray: PCPData[] = [];
        
        snapshot.forEach((doc) => {
          const processedItems = processarDocumentoPCPComProdutos(doc.id, doc.data(), produtosArray);
          pcpDataArray.push(...processedItems);
        });
        
        // Aplicar filtro por período nos dados do listener
        const filteredData = pcpDataArray.filter(item => {
          const itemDate = item.createdAt.toDate();
          const startDate = dateRange.start.toDate();
          const endDate = dateRange.end.toDate();
          
          return itemDate >= startDate && itemDate <= endDate;
        });
        
        setPcpData(filteredData);
        setPcpProdutos(produtosArray);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Erro ao configurar listener:', err);
      return () => {};
    }
  };

  // Métricas calculadas
  const getMetrics = (period: PeriodFilter = 'hoje') => {

    const totalOrdens = pcpData.length;
    const ordensEmProducao = pcpData.filter(item => item.status === 'em_andamento').length;
    const ordensCompletas = pcpData.filter(item => item.status === 'concluido').length;
    
    const eficienciaMedia = pcpData.length > 0 
      ? Math.round(pcpData.reduce((acc, curr) => acc + (curr.eficiencia || 0), 0) / pcpData.length)
      : 0;
    
    const producaoTotal = pcpData.reduce((acc, curr) => acc + (curr.quantidade_produzida || 0), 0);
    
    const producaoPorTurno = pcpData.reduce((acc, curr) => {
      const turno = curr.turno === '1_turno' ? '1° Turno' : '2° Turno';
      if (!acc[turno]) {
        acc[turno] = { quantidade: 0, eficiencia: 0, count: 0 };
      }
      acc[turno].quantidade += curr.quantidade_produzida || 0;
      acc[turno].eficiencia += curr.eficiencia || 0;
      acc[turno].count += 1;
      return acc;
    }, {} as Record<string, { quantidade: number, eficiencia: number, count: number }>);

    // Calcular eficiência média por turno
    Object.keys(producaoPorTurno).forEach(turno => {
      const turnoData = producaoPorTurno[turno];
      turnoData.eficiencia = turnoData.count > 0 
        ? Math.round(turnoData.eficiencia / turnoData.count) 
        : 0;
    });

    const producaoPorSetor = pcpData.reduce((acc, curr) => {
      // Usar a classificação do produto diretamente como setor
      const setor = curr.classificacao || curr.setor || 'Não classificado';
      if (!acc[setor]) {
        acc[setor] = 0;
      }
      acc[setor] += curr.quantidade_produzida || 0;
      return acc;
    }, {} as Record<string, number>);

    const producaoPorLocalizacao = pcpData.reduce((acc, curr) => {
      if (!acc[curr.localizacao]) {
        acc[curr.localizacao] = { quantidade: 0, eficiencia: 0, count: 0 };
      }
      acc[curr.localizacao].quantidade += curr.quantidade_produzida || 0;
      acc[curr.localizacao].eficiencia += curr.eficiencia || 0;
      acc[curr.localizacao].count += 1;
      return acc;
    }, {} as Record<string, { quantidade: number, eficiencia: number, count: number }>);

    // Calcular eficiência média por localização
    Object.keys(producaoPorLocalizacao).forEach(loc => {
      const locData = producaoPorLocalizacao[loc];
      locData.eficiencia = locData.count > 0 
        ? Math.round(locData.eficiencia / locData.count) 
        : 0;
    });

    return {
      totalOrdens,
      ordensEmProducao,
      ordensCompletas,
      eficienciaMedia,
      producaoTotal,
      producaoPorTurno,
      producaoPorSetor,
      producaoPorLocalizacao
    };
  };

  // Dados para gráficos
  const getChartData = () => {
    const metrics = getMetrics();
    const hasData = pcpData.length > 0;

    const turnosChart = Object.entries(metrics.producaoPorTurno).map(([turno, data]) => ({
      name: turno,
      value: data.eficiencia,
      quantidade: data.quantidade
    }));

    const setoresChart = Object.entries(metrics.producaoPorSetor).map(([setor, quantidade], index) => ({
      setor,
      producao_real: quantidade,
      fill: index === 0 ? '#0088FE' : '#00C49F'
    }));

    const localizacoesChart = Object.entries(metrics.producaoPorLocalizacao).map(([localizacao, data]) => ({
      localizacao,
      eficiencia: data.eficiencia,
      quantidade: data.quantidade
    }));

    const topProdutos = pcpProdutos
      .sort((a, b) => b.quantidade_produzida_total - a.quantidade_produzida_total)
      .slice(0, 5)
      .map(produto => ({
        name: produto.nome,
        value: produto.quantidade_produzida_total,
        codigo: produto.codigo
      }));

    // Status distribution
    const statusDistribution = pcpData.reduce((acc, item) => {
      const status = item.status === 'concluido' ? 'Concluído' : 
                    item.status === 'em_andamento' ? 'Em Andamento' :
                    item.status === 'planejado' ? 'Planejado' : 'Cancelado';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChart = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: pcpData.length > 0 ? ((count / pcpData.length) * 100).toFixed(1) : '0'
    }));

    // Gráfico de quantidade planejada vs produzida por código de produto
    const produtoPerformance = pcpData.reduce((acc, item) => {
      const codigo = item.codigo || 'Sem código';
      if (!acc[codigo]) {
        acc[codigo] = {
          codigo,
          produto: item.produto_nome,
          planejado: 0,
          produzido: 0,
          count: 0
        };
      }
      acc[codigo].planejado += item.quantidade_planejada;
      acc[codigo].produzido += item.quantidade_produzida;
      acc[codigo].count += 1;
      return acc;
    }, {} as Record<string, any>);

    const performanceChart = Object.values(produtoPerformance)
      .sort((a: any, b: any) => b.produzido - a.produzido)
      .slice(0, 10)
      .map((item: any) => ({
        codigo: item.codigo,
        produto: item.produto.substring(0, 20) + (item.produto.length > 20 ? '...' : ''),
        planejado: Math.round(item.planejado),
        produzido: Math.round(item.produzido),
        eficiencia: item.planejado > 0 ? Math.round((item.produzido / item.planejado) * 100) : 0
      }));

    // Gráfico de responsáveis por produção
    const responsaveisPerformance = pcpData.reduce((acc, item) => {
      if (!acc[item.responsavel]) {
        acc[item.responsavel] = { quantidade: 0, eficiencia: 0, count: 0 };
      }
      acc[item.responsavel].quantidade += item.quantidade_produzida;
      acc[item.responsavel].eficiencia += item.eficiencia || 0;
      acc[item.responsavel].count += 1;
      return acc;
    }, {} as Record<string, any>);

    const responsaveisChart = Object.entries(responsaveisPerformance).map(([nome, data]: [string, any]) => ({
      name: nome,
      quantidade: Math.round(data.quantidade),
      eficiencia: data.count > 0 ? Math.round(data.eficiencia / data.count) : 0,
      ordens: data.count
    }));

    // Gráfico de eficiência por período (últimos 7 dias)
    const eficienciaTemp = pcpData.reduce((acc, item) => {
      const data = item.data_inicio.toDate();
      const periodo = data.toLocaleDateString('pt-BR');
      if (!acc[periodo]) {
        acc[periodo] = {
          total_eficiencia: 0,
          count: 0,
          producao: 0
        };
      }
      acc[periodo].total_eficiencia += item.eficiencia || 0;
      acc[periodo].count += 1;
      acc[periodo].producao += item.quantidade_produzida;
      return acc;
    }, {} as Record<string, any>);

    const eficienciaPeriodoChart = Object.entries(eficienciaTemp).map(([periodo, data]: [string, any]) => ({
      name: periodo,
      eficiencia: data.count > 0 ? Math.round(data.total_eficiencia / data.count) : 0,
      producao: Math.round(data.producao),
      registros: data.count
    }));

    return {
      turnosChart,
      setoresChart, 
      localizacoesChart,
      topProdutos,
      statusChart,
      performanceChart,
      responsaveisChart,
      eficienciaPeriodoChart
    };
  };

  useEffect(() => {
    // Carregar dados iniciais
    fetchPCPData('hoje');
  }, []);

  return {
    pcpData,
    pcpProdutos,
    loading,
    error,
    fetchPCPData,
    setupRealtimeListener,
    getMetrics,
    getChartData
  };
};