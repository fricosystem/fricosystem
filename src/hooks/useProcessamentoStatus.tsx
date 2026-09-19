import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { format } from 'date-fns';

interface DataNaoProcessada {
  id: string;
  date: string;
  turnos: string[];
}

export const useProcessamentoStatus = () => {
  const [dadosNaoProcessados, setDadosNaoProcessados] = useState<DataNaoProcessada[]>([]);
  const [temPendenciaHoje, setTemPendenciaHoje] = useState(false);
  const [loading, setLoading] = useState(true);

  const verificarDatasNaoProcessadas = useCallback(async () => {
    try {
      setLoading(true);
      const pcpCollection = collection(db, "PCP");
      const q = query(pcpCollection, where("processado", "==", "não"));
      const querySnapshot = await getDocs(q);
      
      const datasNaoProcessadasData: DataNaoProcessada[] = [];
      const dataAtual = format(new Date(), 'yyyy-MM-dd');

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const turnos: string[] = [];
        
        if (data["1_turno"]) turnos.push("1° Turno");
        if (data["2_turno"]) turnos.push("2° Turno");

        if (turnos.length > 0) {
          datasNaoProcessadasData.push({
            id: doc.id,
            date: data.date || doc.id,
            turnos
          });
        }
      });

      setDadosNaoProcessados(datasNaoProcessadasData);
      
      // Verificar se há pendência para hoje
      const pendenciaHoje = datasNaoProcessadasData.some(item => item.date === dataAtual);
      setTemPendenciaHoje(pendenciaHoje);
      
    } catch (error) {
      console.error("Erro ao verificar dados não processados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verificarDatasNaoProcessadas();
  }, [verificarDatasNaoProcessadas]);

  return {
    dadosNaoProcessados,
    temPendenciaHoje,
    loading,
    verificarDatasNaoProcessadas
  };
};