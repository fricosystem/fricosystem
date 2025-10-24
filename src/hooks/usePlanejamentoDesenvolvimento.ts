import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
export interface Etapa {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel?: string;
  dataInicio?: Date;
  dataFim?: Date;
  tempoEstimado?: number; // em horas
  tempoGasto?: number; // em horas
  tags?: string[];
  ordem: number;
}

export interface Tarefa {
  id: string;
  nome: string;
  detalhes: string;
  categoria: 'frontend' | 'backend' | 'design' | 'teste' | 'documentacao' | 'outro';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'planejamento' | 'em_andamento' | 'revisao' | 'concluido' | 'pausado';
  concluido: boolean;
  etapas: Etapa[];
  progresso: number; // 0-100
  criadoEm: Date;
  atualizadoEm: Date;
}

export const usePlanejamentoDesenvolvimento = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'desenvolvedor'),
      orderBy('criadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasData: Tarefa[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert etapas dates
        const etapas = (data.etapas || []).map((etapa: any) => ({
          ...etapa,
          dataInicio: etapa.dataInicio?.toDate(),
          dataFim: etapa.dataFim?.toDate(),
        }));

        tarefasData.push({
          id: doc.id,
          nome: data.nome,
          detalhes: data.detalhes,
          categoria: data.categoria || 'outro',
          prioridade: data.prioridade || 'media',
          status: data.status || 'planejamento',
          concluido: data.concluido,
          etapas,
          progresso: data.progresso || 0,
          criadoEm: data.criadoEm?.toDate() || new Date(),
          atualizadoEm: data.atualizadoEm?.toDate() || new Date(),
        });
      });
      setTarefas(tarefasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTarefa = async (tarefaData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      await addDoc(collection(db, 'desenvolvedor'), {
        ...tarefaData,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  };

  const updateTarefa = async (id: string, tarefaData: Partial<Tarefa>) => {
    try {
      const tarefaRef = doc(db, 'desenvolvedor', id);
      await updateDoc(tarefaRef, {
        ...tarefaData,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  };

  const deleteTarefa = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'desenvolvedor', id));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      throw error;
    }
  };

  const toggleConcluido = async (id: string, concluido: boolean) => {
    try {
      const tarefaRef = doc(db, 'desenvolvedor', id);
      await updateDoc(tarefaRef, {
        concluido,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      throw error;
    }
  };

  return {
    tarefas,
    loading,
    addTarefa,
    updateTarefa,
    deleteTarefa,
    toggleConcluido,
  };
};