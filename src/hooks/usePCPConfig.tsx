import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export interface PCPConfig {
  meta_diaria_global: number;
  eficiencia_minima: number;
  calendario_excecoes: string[]; // Array de datas no formato YYYY-MM-DD
  // Novos campos para a aba Sistema
  meta_minima_mensal?: number;
  dias_uteis_mes?: number;
  updatedAt: Date;
}

export interface PCPMeta {
  mes: string; // YYYY-MM
  dias_uteis: number;
  meta_mensal_global: number;
  metas_por_classificacao?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_CONFIG: PCPConfig = {
  meta_diaria_global: 2000,
  eficiencia_minima: 85,
  calendario_excecoes: [],
  updatedAt: new Date()
};

export const usePCPConfig = () => {
  const [config, setConfig] = useState<PCPConfig>(DEFAULT_CONFIG);
  const [metaMensal, setMetaMensal] = useState<PCPMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Novos estados para a página Sistema
  const [produtosProcessados, setProdutosProcessados] = useState<any[]>([]);
  const [processamentos, setProcessamentos] = useState<any[]>([]);
  const [documentosPCP, setDocumentosPCP] = useState<any[]>([]);

  // Carregar configuração
  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'PCP_configuracoes', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PCPConfig;
        setConfig({
          ...data,
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
        });
      } else {
        // Se não existir, criar com valores padrão
        await saveConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Erro ao carregar configuração PCP:', err);
      setError('Erro ao carregar configuração');
    }
  };

  // Salvar configuração
  const saveConfig = async (newConfig: Partial<PCPConfig>) => {
    try {
      const configToSave = {
        ...config,
        ...newConfig,
        updatedAt: new Date()
      };
      
      const docRef = doc(db, 'PCP_configuracoes', 'global');
      await setDoc(docRef, configToSave);
      
      setConfig(configToSave);
      return true;
    } catch (err) {
      console.error('Erro ao salvar configuração PCP:', err);
      setError('Erro ao salvar configuração');
      return false;
    }
  };

  // Carregar meta mensal
  const loadMetaMensal = async (mes?: string) => {
    const targetMes = mes || getCurrentMonth();
    
    try {
      const docRef = doc(db, 'PCP_metas', targetMes);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PCPMeta;
        setMetaMensal({
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
        });
      } else {
        setMetaMensal(null);
      }
    } catch (err) {
      console.error('Erro ao carregar meta mensal:', err);
      setError('Erro ao carregar meta mensal');
    }
  };

  // Calcular dias úteis do mês
  const calcularDiasUteis = (ano: number, mes: number): number => {
    const diasNoMes = new Date(ano, mes, 0).getDate();
    let diasUteis = 0;
    
    // Converter exceções para Set para busca eficiente
    const excecoes = new Set(config.calendario_excecoes);
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes - 1, dia);
      const diaSemana = data.getDay();
      const dataStr = data.toISOString().split('T')[0];
      
      // Não é final de semana (0 = domingo, 6 = sábado) e não está nas exceções
      if (diaSemana !== 0 && diaSemana !== 6 && !excecoes.has(dataStr)) {
        diasUteis++;
      }
    }
    
    return diasUteis;
  };

  // Gerar/recalcular meta mensal
  const gerarMetaMensal = async (mes?: string, metasPorClassificacao?: Record<string, number>) => {
    const targetMes = mes || getCurrentMonth();
    const [ano, mesNum] = targetMes.split('-').map(Number);
    
    try {
      const diasUteis = calcularDiasUteis(ano, mesNum);
      const metaMensalGlobal = diasUteis * config.meta_diaria_global;
      
      const novaMeta: PCPMeta = {
        mes: targetMes,
        dias_uteis: diasUteis,
        meta_mensal_global: metaMensalGlobal,
        metas_por_classificacao: metasPorClassificacao,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = doc(db, 'PCP_metas', targetMes);
      await setDoc(docRef, novaMeta);
      
      setMetaMensal(novaMeta);
      return novaMeta;
    } catch (err) {
      console.error('Erro ao gerar meta mensal:', err);
      setError('Erro ao gerar meta mensal');
      return null;
    }
  };

  // Configurar listener em tempo real para config e meta atual
  const setupRealtimeListeners = () => {
    const configRef = doc(db, 'PCP_configuracoes', 'global');
    const metaRef = doc(db, 'PCP_metas', getCurrentMonth());
    
    const unsubscribeConfig = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as PCPConfig;
        setConfig({
          ...data,
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
        });
      }
    }, (error) => {
      console.error('Erro no listener de configuração:', error);
    });
    
    const unsubscribeMeta = onSnapshot(metaRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as PCPMeta;
        setMetaMensal({
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
        });
      } else {
        setMetaMensal(null);
      }
    }, (error) => {
      console.error('Erro no listener de meta mensal:', error);
    });
    
    return () => {
      unsubscribeConfig();
      unsubscribeMeta();
    };
  };

  // Utilitário para obter mês atual no formato YYYY-MM
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Calcular progresso da meta mensal
  const calcularProgressoMensal = (producaoAtual: number) => {
    if (!metaMensal) return { progresso: 0, projecao: 0, status: 'sem-meta' as const };
    
    const now = new Date();
    const diasDecorridos = now.getDate();
    const diasUteisDecorridos = calcularDiasUteisOverloaded(now.getFullYear(), now.getMonth() + 1, diasDecorridos);
    
    const progresso = (producaoAtual / metaMensal.meta_mensal_global) * 100;
    const projecao = diasUteisDecorridos > 0 ? (producaoAtual / diasUteisDecorridos) * metaMensal.dias_uteis : 0;
    
    let status: 'otimo' | 'bom' | 'atencao' | 'critico' | 'sem-meta' = 'sem-meta';
    
    if (progresso >= 100) status = 'otimo';
    else if (progresso >= 80) status = 'bom';
    else if (progresso >= 60) status = 'atencao';
    else status = 'critico';
    
    return { progresso, projecao, status };
  };

  // Versão sobrecarregada do calcularDiasUteis para dias específicos
  const calcularDiasUteisAteDia = (ano: number, mes: number, diaLimite: number): number => {
    let diasUteis = 0;
    const excecoes = new Set(config.calendario_excecoes);
    
    for (let dia = 1; dia <= diaLimite; dia++) {
      const data = new Date(ano, mes - 1, dia);
      const diaSemana = data.getDay();
      const dataStr = data.toISOString().split('T')[0];
      
      if (diaSemana !== 0 && diaSemana !== 6 && !excecoes.has(dataStr)) {
        diasUteis++;
      }
    }
    
    return diasUteis;
  };

  // Ajustar função existente para compatibilidade
  const calcularDiasUteisOriginal = calcularDiasUteis;
  const calcularDiasUteisOverloaded = (ano: number, mes: number, diaLimite?: number): number => {
    if (diaLimite !== undefined) {
      return calcularDiasUteisAteDia(ano, mes, diaLimite);
    }
    return calcularDiasUteisOriginal(ano, mes);
  };

  // Função para carregar produção total dos Resultados Finais
  const carregarProducaoTotal = async () => {
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, orderBy("Processamento.timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      let totalProducao = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data().Processamento;
        if (data && data.kgTotal) {
          totalProducao += data.kgTotal;
        }
      });

      return totalProducao;
    } catch (error) {
      console.error('Erro ao carregar produção total:', error);
      return 0;
    }
  };

  // Função para carregar meta diária realizada (último processamento)
  const carregarMetaDiariaRealizada = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().Processamento) {
        return docSnap.data().Processamento.kgTotal || 0;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao carregar meta diária realizada:', error);
      return 0;
    }
  };

  // Função para contar documentos PCP criados
  const contarDocumentosPCP = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP"));
      const documentosComData: string[] = [];
      
      querySnapshot.forEach((doc) => {
        // Assumindo que o ID do documento é a data (YYYY-MM-DD)
        if (doc.id.match(/^\d{4}-\d{2}-\d{2}$/)) {
          documentosComData.push(doc.id);
        }
      });

      return documentosComData.length;
    } catch (error) {
      console.error('Erro ao contar documentos PCP:', error);
      return 0;
    }
  };

  // Função para salvar configurações do sistema (consolidada)
  const salvarConfigSistema = async (data: { meta_minima_mensal?: number; dias_uteis_mes?: number }) => {
    try {
      // Usar a função saveConfig existente para manter consistência
      return await saveConfig(data);
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      await loadConfig();
      await loadMetaMensal();
      
      setLoading(false);
    };
    
    initializeData();
  }, []);

  return {
    config,
    metaMensal,
    loading,
    error,
    saveConfig,
    loadMetaMensal,
    gerarMetaMensal,
    setupRealtimeListeners,
    calcularDiasUteis: calcularDiasUteisOverloaded,
    calcularProgressoMensal,
    getCurrentMonth,
    // Novas funções para a página Sistema
    carregarProducaoTotal,
    carregarMetaDiariaRealizada,
    contarDocumentosPCP,
    salvarConfigSistema
  };
};