import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  onSnapshot,
  where,
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

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';

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
  const getDateRange = useCallback((period: PeriodFilter, customStart?: Date, customEnd?: Date) => {
    // Para período personalizado, usar as datas fornecidas
    if (period === 'personalizado') {
      if (!customStart || !customEnd) {
        // Se não há datas personalizadas, usar hoje como fallback
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfDay),
          end: Timestamp.fromDate(endOfDay)
        };
      }
      
      const startOfCustomDay = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate());
      const endOfCustomDay = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate());
      endOfCustomDay.setHours(23, 59, 59, 999);
      
      return {
        start: Timestamp.fromDate(startOfCustomDay),
        end: Timestamp.fromDate(endOfCustomDay)
      };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'hoje':
        // Alterar para mostrar dados do dia anterior
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        return {
          start: Timestamp.fromDate(startOfYesterday),
          end: Timestamp.fromDate(endOfYesterday)
        };
      
      case 'semana':
        // Corrigir lógica semanal: começar no domingo anterior
        const currentDayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc.
        
        // Se hoje é domingo, usar hoje como início
        // Caso contrário, voltar para o domingo anterior
        const daysToSubtract = currentDayOfWeek;
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysToSubtract);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Próximo sábado (6 dias após o domingo)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
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
      return cacheRef.current.pcpProdutos.data;
    }

    try {
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

      return produtosArray;
    } catch (err) {
      throw err;
    }
  }, [isCacheValid]);

  // Função otimizada para processar documentos PCP
  const processarDocumentoPCPOptimized = useCallback((docId: string, docData: any, produtos: PCPProduto[]): PCPData[] => {
    // Validações de entrada
    if (!docId || !docData || !produtos) {
      return [];
    }

    const cacheKey = `${docId}_${produtos.length}`;
    
    // Verificar cache de documento processado
    const cachedResult = cacheRef.current.documentCache.get(cacheKey);
    if (cachedResult && isCacheValid(cachedResult)) {
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
        }
      } catch (error) {
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
            
            if (item && typeof item === 'object' && item.codigo) {
              try {
                const quantidade_planejada = parseFloat(item.planejamento?.toString().replace(',', '.') || '0');
                const quantidade_kg = parseFloat(item.kg?.toString().replace(',', '.') || '0');
                const quantidade_produzida = quantidade_kg;
                
                // Validar se os valores são números válidos
                if (isNaN(quantidade_planejada) || isNaN(quantidade_produzida)) {
                  return;
                }
                
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
              } catch (itemError) {
              }
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
  const fetchPCPData = useCallback(async (period: PeriodFilter = 'hoje', customStart?: Date, customEnd?: Date) => {
    const cacheKey = period === 'personalizado' 
      ? `pcp_${period}_${customStart?.getTime()}_${customEnd?.getTime()}`
      : `pcp_${period}`;
    
    // Verificar cache primeiro (pular cache para período personalizado para garantir dados atualizados)
    if (period !== 'personalizado') {
      const cachedData = cacheRef.current.pcpData.get(cacheKey);
      if (cachedData && isCacheValid(cachedData)) {
        setPcpData(cachedData.data);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Carregar produtos de forma otimizada
      const produtosArray = await loadProdutosOptimized();
      setPcpProdutos(produtosArray);

      // Buscar documentos PCP apenas com processado = "sim"
      const pcpCollectionQuery = query(
        collection(db, 'PCP'),
        where('processado', '==', 'sim')
      );
      const pcpCollectionSnapshot = await getDocs(pcpCollectionQuery);

      let pcpDataArray: PCPData[] = [];

      // Processar documentos de forma otimizada
      if (!pcpCollectionSnapshot.empty) {
        pcpCollectionSnapshot.forEach((doc) => {
          const processedItems = processarDocumentoPCPOptimized(doc.id, doc.data(), produtosArray);
          pcpDataArray.push(...processedItems);
        });
      }

      // Aplicar filtro por período
      const dateRange = getDateRange(period, customStart, customEnd);
      const filteredData = pcpDataArray.filter(item => {
        const itemDate = item.createdAt.toDate();
        const startDate = dateRange.start.toDate();
        const endDate = dateRange.end.toDate();
        
        return itemDate >= startDate && itemDate <= endDate;
      });

      // Cachear resultado (exceto para personalizado)
      if (period !== 'personalizado') {
        cacheRef.current.pcpData.set(cacheKey, {
          data: filteredData,
          timestamp: Date.now()
        });
      }

      setPcpData(filteredData);

    } catch (err) {
      setError(`Erro ao carregar dados do PCP: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [loadProdutosOptimized, processarDocumentoPCPOptimized, getDateRange, isCacheValid]);

  // Listener otimizado em tempo real com debounce
  const setupRealtimeListener = useCallback((period: PeriodFilter = 'hoje', customStart?: Date, customEnd?: Date) => {
    const listenerKey = period === 'personalizado' 
      ? `listener_${period}_${customStart?.getTime()}_${customEnd?.getTime()}`
      : `listener_${period}`;
    
    // Limpar listener anterior se existir
    const existingUnsubscribe = unsubscribeFunctionsRef.current.get(listenerKey);
    if (existingUnsubscribe) {
      existingUnsubscribe();
      unsubscribeFunctionsRef.current.delete(listenerKey);
      activeListenersRef.current.delete(listenerKey);
    }

    // Evitar múltiplos listeners para o mesmo período
    if (activeListenersRef.current.has(listenerKey)) {
      return () => {};
    }

    try {
      
      // Flag para pular o primeiro snapshot (evita duplo carregamento)
      let isFirstSnapshot = true;
      
      const pcpQuery = query(collection(db, 'PCP'), where('processado', '==', 'sim'));
      const unsubscribe = onSnapshot(pcpQuery, (snapshot) => {
        // Pular o primeiro snapshot para evitar duplo carregamento
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          return;
        }
        
        // Aplicar debounce para evitar updates excessivos
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            
            // Invalidar cache para forçar reload
            if (period !== 'personalizado') {
              cacheRef.current.pcpData.delete(`pcp_${period}`);
            }
            
            // Recarregar dados
            await fetchPCPData(period, customStart, customEnd);
          } catch (error) {
          }
        }, DEBOUNCE_DELAY);
        
      }, (error) => {
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
    
    const turnosChart = Object.entries(metrics.producaoPorTurno)
      .sort(([a], [b]) => a.localeCompare(b)) // Ordena para garantir 1° Turno antes de 2° Turno
      .map(([turno, data]) => ({
        name: turno,
        value: data.eficiencia,
        quantidade: data.quantidade
      }));

    const setoresChart = Object.entries(metrics.producaoPorSetor)
      .sort(([, a], [, b]) => b - a) // Ordena por produção decrescente (maior primeiro)
      .map(([setor, producao], index) => ({
        setor,
        producao_real: producao,
        fill: `hsl(${(index * 60) % 360}, 70%, 50%)`
      }));

    // Performance por Produto - 2 melhores produtos de cada classificação (agregado por período)
    const performanceChart = (() => {
      // Usar a mesma lógica do ResultadosFinais.tsx para garantir consistência
      const produtosPorClassificacao = new Map<string, Map<string, {
        codigo: string;
        produto_nome: string;
        kgTotal: number;
        planoDiario: number;
        eficiencia: number;
      }>>();

      pcpData.forEach(item => {
        const classificacao = item.classificacao || 'Sem classificação';
        const codigo = item.codigo || item.ordem_id.slice(-6);
        if (!produtosPorClassificacao.has(classificacao)) {
          produtosPorClassificacao.set(classificacao, new Map());
        }
        const mapa = produtosPorClassificacao.get(classificacao)!;
        const existente = mapa.get(codigo);
        if (!existente) {
          mapa.set(codigo, {
            codigo,
            produto_nome: item.produto_nome,
            kgTotal: item.quantidade_produzida || 0,
            planoDiario: item.quantidade_planejada || 0,
            eficiencia: 0
          });
        } else {
          // Usar a mesma nomenclatura do ResultadosFinais
          existente.kgTotal += item.quantidade_produzida || 0;
          existente.planoDiario += item.quantidade_planejada || 0;
        }
      });

      // Cores (mantém estrutura)
      const cores = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
        '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
        '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#FB923C',
        '#38BDF8', '#FBBF24', '#F472B6', '#34D399', '#A78BFA'
      ];

      const dadosComSeparadores: any[] = [];

      Array.from(produtosPorClassificacao.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([classificacao, mapa], classIndex) => {
          if (classIndex > 0) {
            dadosComSeparadores.push({
              name: '─────────',
              produzido: 0,
              planejado: 0,
              eficiencia: 0,
              isSeparator: true,
              classificacao: null
            });
          }

          const produtosAgregados = Array.from(mapa.values()).map(p => ({
            ...p,
            // Usar a mesma fórmula de cálculo do ResultadosFinais
            eficiencia: p.planoDiario > 0 ? Math.round((p.kgTotal / p.planoDiario) * 100) : 0
          }))
          .filter(p => (p.kgTotal || 0) > 0 || (p.planoDiario || 0) > 0);

          const produtosOrdenados = produtosAgregados
            .sort((a, b) => {
              if (b.eficiencia !== a.eficiencia) return b.eficiencia - a.eficiencia;
              return (b.kgTotal || 0) - (a.kgTotal || 0);
            })
            .slice(0, 2);

          const isUnicoProduto = produtosOrdenados.length === 1;

          produtosOrdenados.forEach((p, prodIndex) => {
            dadosComSeparadores.push({
              name: p.codigo,
              produzido: Math.round(p.kgTotal * 100) / 100,
              planejado: Math.round(p.planoDiario * 100) / 100,
              eficiencia: p.eficiencia,
              isSeparator: false,
              classificacao: classificacao,
              posicao: prodIndex + 1,
              produto_nome: p.produto_nome,
              cor: cores[classIndex % cores.length],
              isUnicoProduto
            });
          });
        });

      return dadosComSeparadores;
    })();

    // Novo gráfico de Performance por Classificação
    // Usar a mesma lógica de processamento do ResultadosFinais.tsx
    const performanceClassificacaoChart = (() => {
      // Agrupar dados por classificação e produto (mesma lógica do ResultadosFinais)
      const grupoPorClassificacao = new Map<string, Map<string, any>>();
      pcpData.forEach(item => {
        const classificacao = item.classificacao || "Sem classificação";
        const codigo = item.codigo;
        if (!codigo) return;
        
        if (!grupoPorClassificacao.has(classificacao)) {
          grupoPorClassificacao.set(classificacao, new Map());
        }
        
        const grupoClassificacao = grupoPorClassificacao.get(classificacao)!;
        if (!grupoClassificacao.has(codigo)) {
          grupoClassificacao.set(codigo, {
            codigo,
            kgTotal: 0,
            planoDiario: 0
          });
        }
        
        const produto = grupoClassificacao.get(codigo)!;
        
        // Acumular valores por produto
        produto.kgTotal += item.quantidade_produzida || 0;
        produto.planoDiario += item.quantidade_planejada || 0;
      });
      
      // Converter para array e somar por classificação (mesma lógica do ResultadosFinais)
      const resultado = [];
      grupoPorClassificacao.forEach((produtos, classificacao) => {
        const produtosArray = Array.from(produtos.values());
        
        // Somar todos os produtos da classificação (mesma lógica das linhas 562-564 do ResultadosFinais)
        const totalProduzido = produtosArray.reduce((sum, p) => sum + p.kgTotal, 0);
        const totalPlanejado = produtosArray.reduce((sum, p) => sum + p.planoDiario, 0);
        const eficiencia = totalPlanejado > 0 ? Math.round((totalProduzido / totalPlanejado) * 100) : 0;
        
        resultado.push({
          name: classificacao,
          produzido: Math.round(totalProduzido * 100) / 100,
          planejado: Math.round(totalPlanejado * 100) / 100,
          eficiencia
        });
      });
      
      return resultado.sort((a, b) => {
        // Ordenação personalizada: FRESCAIS primeiro na sequência específica
        const ordemFrescais = ['FRESCAIS GROSSAS', 'FRESCAIS FINAS', 'FRESCAIS BANDEJAS'];
        
        const indexA = ordemFrescais.indexOf(a.name);
        const indexB = ordemFrescais.indexOf(b.name);
        
        // Se ambos são FRESCAIS, ordenar pela sequência específica
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // Se apenas A é FRESCAIS, A vem primeiro
        if (indexA !== -1 && indexB === -1) {
          return -1;
        }
        
        // Se apenas B é FRESCAIS, B vem primeiro
        if (indexA === -1 && indexB !== -1) {
          return 1;
        }
        
        // Se nenhum é FRESCAIS, manter ordem alfabética
        return a.name.localeCompare(b.name);
      });
    })();

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