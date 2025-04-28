import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { format, addDays, startOfWeek } from 'date-fns';

export interface Material {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  disponivel: boolean;
}

export interface Produto {
  id: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  status: 'pendente' | 'em_producao' | 'concluido' | 'problema';
  materiais?: Material[];
  dataCriacao?: any; // Timestamp
  dataAtualizacao?: any; // Timestamp
}

export interface DiaPlanejamento {
  id: string;
  data: Date;
  produtos: Produto[];
}

export const usePlanejamento = (inicioSemana: Date) => {
  const [planejamento, setPlanejamento] = useState<DiaPlanejamento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const carregarPlanejamento = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const inicioSemanaStr = format(inicioSemana, "yyyy-MM-dd");
        const fimSemana = addDays(inicioSemana, 6);
        const fimSemanaStr = format(fimSemana, "yyyy-MM-dd");
        
        // Criar array inicial com os 7 dias da semana
        const diasIniciais = Array.from({ length: 7 }, (_, i) => {
          const data = addDays(inicioSemana, i);
          return {
            id: format(data, "yyyy-MM-dd"),
            data,
            produtos: [] as Produto[]
          };
        });
        
        // Buscar planejamento no Firestore
        const planejamentoRef = collection(db, 'planejamento');
        const q = query(
          planejamentoRef,
          where('dataStr', '>=', inicioSemanaStr),
          where('dataStr', '<=', fimSemanaStr)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setPlanejamento(diasIniciais);
        } else {
          const planejamentoDias: DiaPlanejamento[] = [...diasIniciais];
          
          querySnapshot.forEach(doc => {
            const dia = doc.data() as any;
            const dataStr = dia.dataStr;
            const index = planejamentoDias.findIndex(d => 
              format(d.data, "yyyy-MM-dd") === dataStr
            );
            
            if (index !== -1) {
              // Se encontrou o dia, substitui os dados
              planejamentoDias[index] = {
                ...planejamentoDias[index],
                id: doc.id,
                produtos: dia.produtos || []
              };
            }
          });
          
          setPlanejamento(planejamentoDias);
        }
      } catch (err) {
        console.error("Erro ao carregar planejamento:", err);
        setError("Falha ao carregar o planejamento");
      } finally {
        setIsLoading(false);
      }
    };

    carregarPlanejamento();
  }, [inicioSemana]);

  const salvar = async (dias: DiaPlanejamento[]) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Salvar cada dia separadamente
      const promises = dias.map(async (dia) => {
        const dataStr = format(dia.data, "yyyy-MM-dd");
        const diaRef = doc(db, 'planejamento', dia.id || dataStr);
        
        // Preparar dados para salvar no Firestore
        const diaData = {
          id: dia.id || dataStr,
          dataStr,
          dataTimestamp: Timestamp.fromDate(dia.data),
          produtos: dia.produtos.map(produto => ({
            ...produto,
            // Garantir que timestamps estejam corretos
            dataCriacao: produto.dataCriacao || Timestamp.now(),
            dataAtualizacao: produto.status !== 'pendente' ? (produto.dataAtualizacao || Timestamp.now()) : null
          })),
          ultimaAtualizacao: Timestamp.now()
        };
        
        await setDoc(diaRef, diaData);
      });
      
      await Promise.all(promises);
      setPlanejamento(dias);
    } catch (err) {
      console.error("Erro ao salvar planejamento:", err);
      setSaveError("Erro ao salvar planejamento");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { planejamento, isLoading, error, salvar, isSaving, saveError };
};