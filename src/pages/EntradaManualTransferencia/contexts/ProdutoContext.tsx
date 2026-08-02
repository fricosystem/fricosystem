import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { Produto } from '../types/types';
import { useToast } from '@/components/ui/use-toast';

interface ProdutoContextProps {
  produtos: Produto[];
  loading: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  adicionarProduto: (produto: Produto) => Promise<string>;
  atualizarProduto: (id: string, produto: Produto) => Promise<void>;
  excluirProduto: (id: string) => Promise<void>;
  buscarProdutoPorCodigo: (codigo: string) => Promise<Produto | null>;
  buscarProdutoPorCodigoMaterial: (codigoMaterial: string) => Promise<Produto | null>;
  carregarProdutos: (filtros?: any, ordenacao?: string, direcao?: 'asc' | 'desc') => Promise<void>;
  carregarMaisProdutos: () => Promise<void>;
  filtroAtual: any;
  ordenacaoAtual: string;
  direcaoAtual: 'asc' | 'desc';
  setFiltroAtual: (filtro: any) => void;
  setOrdenacaoAtual: (campo: string) => void;
  setDirecaoAtual: (direcao: 'asc' | 'desc') => void;
}

const ProdutoContext = createContext<ProdutoContextProps | undefined>(undefined);

export const useProdutos = () => {
  const context = useContext(ProdutoContext);
  if (context === undefined) {
    throw new Error("useProdutos deve ser usado dentro de um ProdutoProvider");
  }
  return context;
};

interface ProdutoProviderProps {
  children: ReactNode;
}

export const ProdutoProvider = ({ children }: ProdutoProviderProps) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filtroAtual, setFiltroAtual] = useState<any>({});
  const [ordenacaoAtual, setOrdenacaoAtual] = useState<string>('nome');
  const [direcaoAtual, setDirecaoAtual] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  
  const adicionarProduto = async (produto: Produto): Promise<string> => {
    try {
      const produtoRef = await addDoc(collection(db, 'produtos'), produto);
      toast({
        title: "Produto adicionado",
        description: `${produto.nome} foi adicionado com sucesso.`,
        variant: "default",
      });
      return produtoRef.id;
    } catch (error) {
      toast({
        title: "Erro ao adicionar produto",
        description: "Ocorreu um erro ao adicionar o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarProduto = async (id: string, produto: Produto) => {
    try {
      await updateDoc(doc(db, 'produtos', id), { ...produto });
      toast({
        title: "Produto atualizado",
        description: `${produto.nome} foi atualizado com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro ao atualizar o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const excluirProduto = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'produtos', id));
      setProdutos(produtos.filter(p => p.id !== id));
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const buscarProdutoPorCodigo = async (codigo: string): Promise<Produto | null> => {
    try {
      const q = query(collection(db, 'produtos'), where('codigo_estoque', '==', codigo));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Produto;
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar produto por código:", error);
      return null;
    }
  };

  const buscarProdutoPorCodigoMaterial = async (codigoMaterial: string): Promise<Produto | null> => {
    if (!codigoMaterial) return null;
    
    try {
      const produtosRef = collection(db, "produtos");
      const q = query(produtosRef, where("codigo_material", "==", codigoMaterial));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Produto;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar produto por código de material:", error);
      throw error;
    }
  };

  const carregarProdutos = async (filtros = {}, ordenacao = 'nome', direcao = 'asc' as 'asc' | 'desc') => {
    setLoading(true);
    try {
      let q = collection(db, 'produtos');
      let constraints: any[] = [];
      
      // Aplicar filtros
      Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          if (typeof valor === 'string' && campo !== 'codigo_estoque') {
            constraints.push(where(campo, '>=', valor));
            constraints.push(where(campo, '<=', valor + '\uf8ff'));
          } else {
            constraints.push(where(campo, '==', valor));
          }
        }
      });
      
      // Aplicar ordenação
      constraints.push(orderBy(ordenacao, direcao));
      constraints.push(limit(10));
      
      const produtosQuery = query(q, ...constraints);
      const querySnapshot = await getDocs(produtosQuery);
      
      const produtosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Produto[];
      
      setProdutos(produtosData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
      
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Ocorreu um erro ao carregar a lista de produtos.",
        variant: "destructive",
      });
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarMaisProdutos = async () => {
    if (!lastDoc || !hasMore) return;
    
    setLoading(true);
    try {
      let constraints: any[] = [];
      
      // Aplicar filtros
      Object.entries(filtroAtual).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          if (typeof valor === 'string' && campo !== 'codigo_estoque') {
            constraints.push(where(campo, '>=', valor));
            constraints.push(where(campo, '<=', valor + '\uf8ff'));
          } else {
            constraints.push(where(campo, '==', valor));
          }
        }
      });
      
      // Aplicar ordenação
      constraints.push(orderBy(ordenacaoAtual, direcaoAtual));
      constraints.push(startAfter(lastDoc));
      constraints.push(limit(10));
      
      const produtosQuery = query(collection(db, 'produtos'), ...constraints);
      const querySnapshot = await getDocs(produtosQuery);
      
      const novosProdutos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Produto[];
      
      setProdutos([...produtos, ...novosProdutos]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
      
    } catch (error) {
      toast({
        title: "Erro ao carregar mais produtos",
        description: "Ocorreu um erro ao carregar mais produtos.",
        variant: "destructive",
      });
      console.error("Erro ao carregar mais produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const value: ProdutoContextProps = {
    produtos,
    loading,
    lastDoc,
    hasMore,
    adicionarProduto,
    atualizarProduto,
    excluirProduto,
    buscarProdutoPorCodigo,
    buscarProdutoPorCodigoMaterial,
    carregarProdutos,
    carregarMaisProdutos,
    filtroAtual,
    ordenacaoAtual,
    direcaoAtual,
    setFiltroAtual,
    setOrdenacaoAtual,
    setDirecaoAtual
  };

  return (
    <ProdutoContext.Provider value={value}>
      {children}
    </ProdutoContext.Provider>
  );
};