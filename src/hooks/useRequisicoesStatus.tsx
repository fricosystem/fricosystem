import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface RequisicaoStatus {
  id: string;
  requisicao_id: string;
  status: string;
  data_criacao: any;
  valor_total: number;
  itens_count: number;
}

export const useRequisicoesStatus = () => {
  const [requisicoesStatus, setRequisicoesStatus] = useState<RequisicaoStatus[]>([]);
  const [requisicoesPendentes, setRequisicoesPendentes] = useState<RequisicaoStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const requisicaoRef = collection(db, "requisicoes");
    const q = query(
      requisicaoRef, 
      orderBy("data_criacao", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requisicoesList: RequisicaoStatus[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        requisicoesList.push({
          id: doc.id,
          requisicao_id: data.requisicao_id || "Sem ID",
          status: data.status || "pendente",
          data_criacao: data.data_criacao,
          valor_total: data.valor_total || 0,
          itens_count: data.itens?.length || 0
        });
      });
      
      setRequisicoesStatus(requisicoesList);
      
      // Filtrar apenas as pendentes
      const pendentes = requisicoesList.filter(req => 
        req.status.toLowerCase() === 'pendente'
      );
      setRequisicoesPendentes(pendentes);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar requisições:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    requisicoesStatus,
    requisicoesPendentes,
    isLoading,
    totalPendentes: requisicoesPendentes.length
  };
};