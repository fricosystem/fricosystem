import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { Transferencia, ProdutoTransferido } from '@/pages/EntradaManualTransferencia/types/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProdutos } from '@/pages/EntradaManualTransferencia/contexts/ProdutoContext';

interface TransferenciaContextProps {
  transferencias: Transferencia[];
  loading: boolean;
  carregarTransferencias: () => Promise<void>;
  realizarTransferencia: (
    produtosTransferidos: ProdutoTransferido[],
    origem: string,
    destino: string,
    observacoes: string
  ) => Promise<void>;
}

const TransferenciaContext = createContext<TransferenciaContextProps | undefined>(undefined);

export const useTransferencias = () => {
  const context = useContext(TransferenciaContext);
  if (context === undefined) {
    throw new Error("useTransferencias deve ser usado dentro de um TransferenciaProvider");
  }
  return context;
};

interface TransferenciaProviderProps {
  children: ReactNode;
}

export const TransferenciaProvider = ({ children }: TransferenciaProviderProps) => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { buscarProdutoPorCodigo } = useProdutos();

  const carregarTransferencias = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'transferencias'),
        orderBy('data_transferencia', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      
      const transferenciasData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          data_transferencia: data.data_transferencia.toDate()
        } as Transferencia;
      });
      
      setTransferencias(transferenciasData);
    } catch (error) {
      toast({
        title: "Erro ao carregar transferências",
        description: "Ocorreu um erro ao carregar o histórico de transferências.",
        variant: "destructive",
      });
      console.error("Erro ao carregar transferências:", error);
    } finally {
      setLoading(false);
    }
  };

  const realizarTransferencia = async (
    produtosTransferidos: ProdutoTransferido[],
    origem: string,
    destino: string,
    observacoes: string
  ) => {
    if (!user) throw new Error("Usuário não autenticado");

    setLoading(true);
    try {
      // 1. Criar registro da transferência
      const novaTransferencia: Transferencia = {
        data_transferencia: new Date(),
        usuario_id: user.uid,
        produtos_transferidos: produtosTransferidos,
        origem,
        destino,
        observacoes
      };

      const transferenciaRef = await addDoc(
        collection(db, 'transferencias'), 
        {
          ...novaTransferencia,
          data_transferencia: Timestamp.fromDate(novaTransferencia.data_transferencia)
        }
      );

      // 2. Atualizar o estoque dos produtos
      for (const produtoTransf of produtosTransferidos) {
        const produto = await buscarProdutoPorCodigo(produtoTransf.codigo_estoque);
        
        if (produto && produto.id) {
          // Subtrai a quantidade transferida
          await updateDoc(doc(db, 'produtos', produto.id), {
            quantidade: produto.quantidade - produtoTransf.quantidade,
            deposito: destino
          });
        }
      }

      toast({
        title: "Transferência realizada",
        description: `${produtosTransferidos.length} produtos foram transferidos com sucesso de ${origem} para ${destino}.`,
        variant: "default",
      });

      await carregarTransferencias();
    } catch (error) {
      toast({
        title: "Erro na transferência",
        description: "Ocorreu um erro ao realizar a transferência de produtos.",
        variant: "destructive",
      });
      console.error("Erro ao realizar transferência:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    transferencias,
    loading,
    carregarTransferencias,
    realizarTransferencia
  };

  return (
    <TransferenciaContext.Provider value={value}>
      {children}
    </TransferenciaContext.Provider>
  );
};