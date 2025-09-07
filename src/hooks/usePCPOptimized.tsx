import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
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
  [key: string]: PCPItem;
}

interface PCPDocument {
  id: string;
  date: string;
  '1_turno'?: PCPTurno;
  '2_turno'?: PCPTurno;
  [key: string]: any;
}

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
  setor: string;
  localizacao: string;
  responsavel: string;
  eficiencia?: number;
  observacoes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  codigo?: string;
  classificacao?: string;
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
  setor_producao: string;
  classificacao?: string;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano';

interface CacheEntry {
  data: any;
  timestamp: number;
}

export const usePCPOptimized = () => {
  const [pcpData, setPcpData] = useState<PCPData[]>([]);
  const [pcpProdutos, setPcpProdutos] = useState<PCPProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache otimizado para reduzir requisições Firestore
  const cacheRef = useRef<{
    pcpData: Map<string, CacheEntry>;
    pcpProdutos: CacheEntry | null;
    documentCache: Map<string, CacheEntry>;
  }>({
    pcpData: new Map(),
    pcpProdutos: null,
    documentCache: new Map()
  });
  
  // Controle de listeners para evitar múltiplos listeners ativos
  const activeListenersRef = useRef<Set<string>>(new Set());
  const unsubscribeFunctionsRef = useRef<Map<string, () => void>>(new Map());
  
  // Debounce para otimizar updates frequentes
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  const DEBOUNCE_DELAY = 500; // 500ms

  // Função otimizada para verificar cache
  const isCacheValid = useCallback((cacheEntry: CacheEntry | null): boolean => {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  }, []);

  // Função otimizada para calcular range de datas
  const getDateRange = useCallback((period: PeriodFilter) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'hoje':
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfDay),
          end: Timestamp.fromDate(endOfDay)
        };
      
      case 'semana':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Domingo
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfWeek),
          end: Timestamp.fromDate(endOfWeek)
        };
      
      case 'mes':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfMonth),
          end: Timestamp.fromDate(endOfMonth)
        };
      
      case 'ano':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfYear),
          end: Timestamp.fromDate(endOfYear)
        };
      
      default:
        const defaultEnd = new Date(startOfDay);
        defaultEnd.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfDay),
          end: Timestamp.fromDate(defaultEnd)
        };
    }
  }, []);

  // Função otimizada para carregar produtos com cache
  const loadProdutosOptimized = useCallback(async (): Promise<PCPProduto[]> => {
    // Verificar cache primeiro
    if (cacheRef.current.pcpProdutos && isCacheValid(cacheRef.current.pcpProdutos)) {
      console.log('📦 Usando produtos do cache');
      return cacheRef.current.pcpProdutos.data;
    }

    try {
      console.log('🔄 Carregando produtos do Firestore...');
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

      // Salvar no cache
      cacheRef.current.pcpProdutos = {
        data: produtosArray,
        timestamp: Date.now()
      };

      console.log(`✅ ${produtosArray.length} produtos carregados e cacheados`);
      return produtosArray;
    } catch (err) {
      console.error('❌ Erro ao carregar produtos:', err);
      throw err;
    }
  }, [isCacheValid]);

  // Função otimizada para processar documentos PCP
  const processarDocumentoPCPOptimized = useCallback((docId: string, docData: any, produtos: PCPProduto[]): PCPData[] => {
    const cacheKey = `${docId}_${produtos.length}`;
    
    // Verificar cache de documento processado
    const cachedResult = cacheRef.current.documentCache.get(cacheKey);
    if (cachedResult && isCacheValid(cachedResult)) {
      console.log(`📦 Usando documento ${docId} do cache`);
      return cachedResult.data;
    }

    const processedData: PCPData[] = [];
    
    // Extrair a data do documento (se existir)
    let documentDate = Timestamp.now();
    
    // Tentar extrair data do ID do documento primeiro (formato esperado: YYYY-MM-DD)
    const dateFromId = docId.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateFromId) {
      try {
        const parsedDate = new Date(dateFromId[1] + 'T00:00:00');
        if (!isNaN(parsedDate.getTime())) {
          documentDate = Timestamp.fromDate(parsedDate);
          console.log(`📅 Data extraída do ID do documento ${docId}: ${parsedDate.toLocaleDateString('pt-BR')}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar data do ID ${docId}:`, error);
      }
    }
    
    // Se não conseguiu extrair do ID, tentar do campo date
    if (docData.date && !dateFromId) {
      try {
        // Tentar diferentes formatos de data
        if (docData.date instanceof Timestamp) {
          documentDate = docData.date;
        } else if (typeof docData.date === 'string') {
          // Formato esperado: "YYYY-MM-DD" ou similar
          const parsedDate = new Date(docData.date + 'T00:00:00');
          if (!isNaN(parsedDate.getTime())) {
            documentDate = Timestamp.fromDate(parsedDate);
          }
        } else if (docData.date.toDate && typeof docData.date.toDate === 'function') {
          documentDate = docData.date;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar data do documento ${docId}:`, error);
        // Usar data atual como fallback
        documentDate = Timestamp.now();
      }
    }
    
    // Processar turnos
    Object.keys(docData).forEach(key => {
      if (key.includes('turno') || key.includes('Turno')) {
        const turnoData = docData[key];
        
        let turnoKey: '1_turno' | '2_turno' = '1_turno';
        if (key.toLowerCase().includes('1')) {
          turnoKey = '1_turno';
        } else if (key.toLowerCase().includes('2')) {
          turnoKey = '2_turno';
        }
        
        if (turnoData && typeof turnoData === 'object') {
          Object.keys(turnoData).forEach(itemKey => {
            const item = turnoData[itemKey];
            
            if (item && typeof item === 'object') {
              const quantidade_planejada = parseFloat(item.planejamento?.toString().replace(',', '.') || '0');
              const quantidade_kg = parseFloat(item.kg?.toString().replace(',', '.') || '0');
              const quantidade_produzida = quantidade_kg;
              
              // Só processar se há produção real (quantidade > 0)
              if (quantidade_produzida <= 0 && quantidade_planejada <= 0) {
                return; // Pular este item se não há produção nem planejamento
              }
              
              const eficiencia = quantidade_planejada > 0 
                ? Math.round((quantidade_produzida / quantidade_planejada) * 100)
                : 0;
              
              let status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado' = 'planejado';
              if (eficiencia > 0 && eficiencia < 100) {
                status = 'em_andamento';
              } else if (eficiencia >= 100) {
                status = 'concluido';
              }
              
              const produtoEncontrado = produtos.find(p => p.codigo === item.codigo);
              const classificacao = produtoEncontrado?.classificacao || 'Sem classificação';
              
              const produto_nome = item.texto_breve || 'Produto não identificado';
              
              const processedItem: PCPData = {
                id: `${docId}_${turnoKey}_${itemKey}`,
                ordem_id: `${docId}_${itemKey}`,
                produto_nome,
                quantidade_planejada,
                quantidade_produzida,
                status,
                data_inicio: documentDate, // Usar a data real do documento
                turno: turnoKey,
                setor: classificacao,
                localizacao: `Linha ${parseInt(itemKey) + 1}`,
                responsavel: `Operador ${turnoKey.replace('_', ' ')}`,
                eficiencia,
                observacoes: `Código: ${item.codigo}`,
                createdAt: documentDate, // Usar a data real do documento
                codigo: item.codigo,
                classificacao
              };
              
              processedData.push(processedItem);
            }
          });
        }
      }
    });
    
    // Cachear resultado processado
    cacheRef.current.documentCache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });
    
    return processedData;
  }, [isCacheValid]);

  // Função principal otimizada para buscar dados PCP
  const fetchPCPData = useCallback(async (period: PeriodFilter = 'hoje') => {
    const cacheKey = `pcp_${period}`;
    
    // Verificar cache primeiro
    const cachedData = cacheRef.current.pcpData.get(cacheKey);
    if (cachedData && isCacheValid(cachedData)) {
      console.log(`📦 Usando dados PCP do cache para período ${period}`);
      setPcpData(cachedData.data);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Carregando dados PCP para período ${period}...`);

      // Carregar produtos de forma otimizada
      const produtosArray = await loadProdutosOptimized();
      setPcpProdutos(produtosArray);

      // Buscar documentos PCP
      const pcpCollectionSnapshot = await getDocs(collection(db, 'PCP'));
      
      console.log(`📄 ${pcpCollectionSnapshot.size} documentos PCP encontrados`);

      let pcpDataArray: PCPData[] = [];

      // Processar documentos de forma otimizada
      if (!pcpCollectionSnapshot.empty) {
        pcpCollectionSnapshot.forEach((doc) => {
          const processedItems = processarDocumentoPCPOptimized(doc.id, doc.data(), produtosArray);
          pcpDataArray.push(...processedItems);
        });
      }

      // Aplicar filtro por período
      const dateRange = getDateRange(period);
      const filteredData = pcpDataArray.filter(item => {
        const itemDate = item.createdAt.toDate();
        const startDate = dateRange.start.toDate();
        const endDate = dateRange.end.toDate();
        
        // Log para debug
        if (period === 'hoje') {
          console.log(`🔍 Filtrando ${period}:`, {
            itemDate: itemDate.toLocaleString('pt-BR'),
            startDate: startDate.toLocaleString('pt-BR'),
            endDate: endDate.toLocaleString('pt-BR'),
            included: itemDate >= startDate && itemDate <= endDate
          });
        }
        
        return itemDate >= startDate && itemDate <= endDate;
      });

      // Cachear resultado
      cacheRef.current.pcpData.set(cacheKey, {
        data: filteredData,
        timestamp: Date.now()
      });

      console.log(`✅ ${filteredData.length} registros PCP carregados e cacheados para ${period}`);
      setPcpData(filteredData);

    } catch (err) {
      console.error('❌ Erro ao buscar dados PCP:', err);
      setError(`Erro ao carregar dados do PCP: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [loadProdutosOptimized, processarDocumentoPCPOptimized, getDateRange, isCacheValid]);

  // Listener otimizado em tempo real com debounce
  const setupRealtimeListener = useCallback((period: PeriodFilter = 'hoje') => {
    const listenerKey = `listener_${period}`;
    
    // Limpar listener anterior se existir
    const existingUnsubscribe = unsubscribeFunctionsRef.current.get(listenerKey);
    if (existingUnsubscribe) {
      existingUnsubscribe();
      unsubscribeFunctionsRef.current.delete(listenerKey);
      activeListenersRef.current.delete(listenerKey);
    }

    // Evitar múltiplos listeners para o mesmo período
    if (activeListenersRef.current.has(listenerKey)) {
      console.log(`⚡ Listener já ativo para ${period}`);
      return () => {};
    }

    try {
      console.log(`🎧 Configurando listener otimizado para ${period}...`);
      
      const unsubscribe = onSnapshot(collection(db, 'PCP'), (snapshot) => {
        // Aplicar debounce para evitar updates excessivos
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            console.log(`⚡ Listener ativado para ${period}, ${snapshot.size} documentos`);
            
            // Invalidar cache para forçar reload
            cacheRef.current.pcpData.delete(`pcp_${period}`);
            
            // Recarregar dados
            await fetchPCPData(period);
          } catch (error) {
            console.error(`❌ Erro no listener para ${period}:`, error);
          }
        }, DEBOUNCE_DELAY);
        
      }, (error) => {
        console.error(`❌ Erro no listener PCP para ${period}:`, error);
        setError(`Erro no listener: ${error.message}`);
      });

      // Registrar listener
      activeListenersRef.current.add(listenerKey);
      unsubscribeFunctionsRef.current.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        activeListenersRef.current.delete(listenerKey);
        unsubscribeFunctionsRef.current.delete(listenerKey);
        
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    } catch (err) {
      console.error('❌ Erro ao configurar listener:', err);
      return () => {};
    }
  }, [fetchPCPData]);

  // Métricas calculadas com memoization
  const getMetrics = useCallback((period: PeriodFilter = 'hoje') => {
    // Métricas de produtos
    const produtosCadastrados = pcpProdutos.length;
    // Basear a métrica no mesmo critério do modal: códigos únicos em pcpData sem classificação
    const codigosSemCadastro = new Set(
      pcpData
        .filter(item =>
          (!item.classificacao ||
            item.classificacao === 'Sem classificação' ||
            item.classificacao === '' ||
            item.classificacao === 'Não classificado') &&
          item.codigo // garantir que estamos contando por código
        )
        .map(item => item.codigo as string)
    );
    const produtosSemClassificacao = codigosSemCadastro.size;
    
    // Métricas de produção (mantidas)
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

    Object.keys(producaoPorTurno).forEach(turno => {
      const turnoData = producaoPorTurno[turno];
      turnoData.eficiencia = turnoData.count > 0 
        ? Math.round(turnoData.eficiencia / turnoData.count) 
        : 0;
    });

    const producaoPorSetor = pcpData.reduce((acc, curr) => {
      const setor = curr.classificacao || curr.setor || 'Não classificado';
      if (!acc[setor]) {
        acc[setor] = 0;
      }
      acc[setor] += curr.quantidade_produzida || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      // Novas métricas de produtos
      produtosCadastrados,
      produtosSemClassificacao,
      // Métricas antigas (mantidas para compatibilidade)
      totalOrdens,
      ordensEmProducao,
      ordensCompletas,
      eficienciaMedia,
      producaoTotal,
      producaoPorTurno,
      producaoPorSetor
    };
  }, [pcpData, pcpProdutos]);

  // Dados dos gráficos com memoization
  const getChartData = useMemo(() => {
    const metrics = getMetrics();
    
    const turnosChart = Object.entries(metrics.producaoPorTurno).map(([turno, data]) => ({
      name: turno,
      value: data.eficiencia,
      quantidade: data.quantidade
    }));

    const setoresChart = Object.entries(metrics.producaoPorSetor).map(([setor, producao], index) => ({
      setor,
      producao_real: producao,
      fill: `hsl(${(index * 60) % 360}, 70%, 50%)`
    }));

    const performanceChart = pcpData.slice(0, 10).map((item) => ({
      name: item.codigo || item.ordem_id.slice(-6),
      produzido: item.quantidade_produzida,
      planejado: item.quantidade_planejada,
      eficiencia: item.eficiencia || 0
    }));

    // Novo gráfico de Performance por Classificação
    const performanceClassificacaoChart = Object.entries(
      pcpData.reduce((acc, item) => {
        const classificacao = item.classificacao || 'Sem classificação';
        if (!acc[classificacao]) {
          acc[classificacao] = {
            produzido: 0,
            planejado: 0
          };
        }
        acc[classificacao].produzido += item.quantidade_produzida || 0;
        acc[classificacao].planejado += item.quantidade_planejada || 0;
        return acc;
      }, {} as Record<string, { produzido: number; planejado: number }>)
    ).map(([classificacao, data]) => ({
      name: classificacao,
      produzido: Math.round(data.produzido * 100) / 100,
      planejado: Math.round(data.planejado * 100) / 100,
      eficiencia: data.planejado > 0 ? Math.round((data.produzido / data.planejado) * 100) : 0
    }));

    return {
      turnosChart,
      setoresChart,
      performanceChart,
      performanceClassificacaoChart
    };
  }, [pcpData, getMetrics]);

  // Limpeza de cache e listeners na desmontagem
  useEffect(() => {
    return () => {
      // Limpar todos os listeners ativos
      unsubscribeFunctionsRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      
      // Limpar timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      console.log('🧹 Cache e listeners PCP limpos');
    };
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

export default usePCPOptimized;