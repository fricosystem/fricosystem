import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export interface Produto {
  id: string;
  codigo_estoque: string;
  codigo_material: string;
  data_criacao: string;
  data_vencimento: string;
  deposito: string;
  detalhes: string;
  fornecedor_atual: string;
  imagem: string;
  nome: string;
  prateleira: string;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  unidade_de_medida: string;
  valor_unitario: number;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      const produtosRef = collection(db, 'produtos');
      const unsubscribe = onSnapshot(
        produtosRef,
        (snapshot) => {
          try {
            
            const produtosData = snapshot.docs.map((doc) => {
              const data = doc.data();
              
              // Convert timestamp to string if it exists
              let dataCriacao = new Date().toISOString();
              
              // Handle different timestamp formats
              if (data.data_criacao) {
                if (typeof data.data_criacao === 'object' && data.data_criacao.seconds) {
                  // Firestore Timestamp
                  dataCriacao = new Date(data.data_criacao.seconds * 1000).toISOString();
                } else if (data.data_criacao instanceof Date) {
                  // Date object
                  dataCriacao = data.data_criacao.toISOString();
                } else if (typeof data.data_criacao === 'string') {
                  // Already a string
                  dataCriacao = data.data_criacao;
                }
              }

              return {
                id: doc.id,
                codigo_estoque: data.codigo_estoque || '',
                codigo_material: data.codigo_material || '',
                data_criacao: dataCriacao,
                data_vencimento: data.data_vencimento || '',
                deposito: data.deposito || '',
                detalhes: data.detalhes || '',
                fornecedor_atual: data.fornecedor_atual || '',
                imagem: data.imagem || '',
                nome: data.nome || '',
                prateleira: data.prateleira || '',
                quantidade: data.quantidade || 0,
                quantidade_minima: data.quantidade_minima || 0,
                unidade: data.unidade || '',
                unidade_de_medida: data.unidade_de_medida || '',
                valor_unitario: data.valor_unitario || 0,
              } as Produto;
            });

            setProdutos(produtosData);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Erro ao processar dados dos produtos:', err);
            setError('Erro ao processar dados dos produtos');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Erro ao buscar produtos:', error);
          setError(`Erro ao carregar produtos: ${error.message}`);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Erro ao configurar listener do Firestore:', error);
      setError(`Erro ao configurar listener: ${error.message}`);
      setLoading(false);
      return () => {}; // Retorno vazio para o useEffect
    }
  }, []);

  const updatePrateleira = async (produtoId: string, novaPrateleira: string) => {
    try {
      await updateDoc(doc(db, 'produtos', produtoId), {
        prateleira: novaPrateleira,
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar prateleira:', error);
      return false;
    }
  };

  return { produtos, loading, error, updatePrateleira };
}