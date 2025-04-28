import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, DocumentReference } from 'firebase/firestore';
import { format, addDays, startOfWeek } from 'date-fns';
import { db } from '@/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { useProdutos } from '@/hooks/useProdutos';
import { useMateriais, gerarMateriaisNecessarios } from '@/hooks/useMateriais';

// Tipos
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
  materiais: Material[];
  dataCriacao: Timestamp;
  dataAtualizacao?: Timestamp;
}

export interface DiaPlanejamento {
  id: string;
  data: Date;
  produtos: Produto[];
}

// Tipo adaptador para produtos do useProdutos que podem ter receita
export interface ProdutoComReceita {
  id: string;
  nome: string;
  unidade?: string;
  unidade_de_medida?: string;
  receita?: {
    materialId: string;
    quantidade: number;
  }[];
  [key: string]: any; // Permite outras propriedades
}

export const useProdutosPlanejamento = () => {
  const { toast } = useToast();
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
  
  const { produtos: produtosEstoqueRaw, loading: carregandoProdutos } = useProdutos();
  // Converte produtos para a interface estendida com receita
  const produtosEstoque = produtosEstoqueRaw as ProdutoComReceita[] | undefined;
  const { data: materiaisEstoque } = useMateriais();
  
  const diasIniciais = Array.from({ length: 7 }, (_, i) => {
    const data = addDays(inicioSemana, i);
    return {
      id: format(data, "yyyy-MM-dd"),
      data,
      produtos: [] as Produto[]
    };
  });

  const [dias, setDias] = useState<DiaPlanejamento[]>(diasIniciais);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Carregar planejamento do Firestore
  useEffect(() => {
    const carregarPlanejamento = async () => {
      setIsLoading(true);
      console.log("Iniciando carregamento do planejamento");
      
      try {
        const inicioSemanaStr = format(inicioSemana, "yyyy-MM-dd");
        const fimSemana = addDays(inicioSemana, 6);
        const fimSemanaStr = format(fimSemana, "yyyy-MM-dd");
        
        console.log("Período de consulta:", inicioSemanaStr, "até", fimSemanaStr);
        
        const planejamentoRef = collection(db, 'planejamento');
        const q = query(
          planejamentoRef,
          where('dataStr', '>=', inicioSemanaStr),
          where('dataStr', '<=', fimSemanaStr)
        );
        
        const querySnapshot = await getDocs(q);
        console.log(`Recebidos ${querySnapshot.size} documentos do planejamento`);
        
        if (querySnapshot.empty) {
          console.log("Nenhum planejamento encontrado, usando dias iniciais");
          setDias(diasIniciais);
        } else {
          const planejamentoDias: DiaPlanejamento[] = [...diasIniciais];
          
          querySnapshot.forEach(doc => {
            const dia = doc.data() as any;
            const dataStr = dia.dataStr;
            console.log("Processando dia:", dataStr);
            
            const index = planejamentoDias.findIndex(d => 
              format(d.data, "yyyy-MM-dd") === dataStr
            );
            
            if (index !== -1) {
              planejamentoDias[index] = {
                ...planejamentoDias[index],
                id: doc.id,
                produtos: dia.produtos || []
              };
            }
          });
          
          console.log("Dias processados:", planejamentoDias);
          setDias(planejamentoDias);
        }
      } catch (error) {
        console.error("Erro ao carregar planejamento:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o planejamento",
          variant: "destructive"
        });
        // Em caso de erro, definir dias iniciais
        setDias(diasIniciais);
      } finally {
        console.log("Finalizando carregamento do planejamento");
        setIsLoading(false);
      }
    };

    carregarPlanejamento();
  }, []);

  const handleAddProduto = (diaIndex: number, produtoId: string, quantidade: number) => {
    if (!produtoId) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive"
      });
      return;
    }

    const produto = produtosEstoque?.find((p) => p.id === produtoId);
    if (!produto) {
      toast({
        title: "Erro",
        description: "Produto não encontrado no estoque!",
        variant: "destructive"
      });
      return;
    }

    // Verifica com segurança se a receita existe e cria lista de materiais
    let materiaisNecessarios = [];
    
    if (produto.receita && Array.isArray(produto.receita)) {
      materiaisNecessarios = produto.receita.map(item => {
        const material = materiaisEstoque?.find(m => m.id === item.materialId);
        const quantidadeNecessaria = item.quantidade * quantidade;
        const disponivel = material 
          ? material.quantidade >= quantidadeNecessaria 
          : false;
          
        return {
          id: item.materialId,
          nome: material?.nome || "Material não encontrado",
          quantidade: quantidadeNecessaria,
          unidade: material?.unidade || "un",
          disponivel
        };
      });
    } else {
      // Fallback para materiais gerados se não houver receita
      materiaisNecessarios = gerarMateriaisNecessarios(materiaisEstoque);
    }

    const novoProduto: Produto = {
      id: `prod_${Date.now()}`,
      produtoId: produto.id,
      nome: produto.nome,
      quantidade: quantidade,
      unidade: produto.unidade_de_medida || produto.unidade || "un",
      status: 'pendente',
      materiais: materiaisNecessarios,
      dataCriacao: Timestamp.now()
    };

    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? { ...dia, produtos: [...dia.produtos, novoProduto] }
          : dia
      )
    );

    toast({
      title: "Produto adicionado",
      description: `${produto.nome} adicionado ao planejamento de ${format(dias[diaIndex].data, 'dd/MM/yyyy')}`
    });
  };

  const handleRemoveProduto = (diaIndex: number, produtoId: string) => {
    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? { ...dia, produtos: dia.produtos.filter(p => p.id !== produtoId) }
          : dia
      )
    );

    toast({
      title: "Produto removido",
      description: "Produto removido do planejamento"
    });
  };

  const handleStatusChange = (diaIndex: number, produtoId: string, novoStatus: 'pendente' | 'em_producao' | 'concluido' | 'problema') => {
    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? {
              ...dia,
              produtos: dia.produtos.map(p => 
                p.id === produtoId
                  ? { ...p, status: novoStatus, dataAtualizacao: Timestamp.now() }
                  : p
              )
            }
          : dia
      )
    );

    toast({
      title: "Status atualizado",
      description: `Status alterado com sucesso`
    });
  };

  const handleSalvarPlanejamento = async () => {
    if (!dias || dias.length === 0) {
      toast({
        title: "Erro",
        description: "Não há dados para salvar",
        variant: "destructive"
      });
      return;
    }

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
      
      toast({
        title: "Sucesso",
        description: "Planejamento salvo com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
      setSaveError("Erro ao salvar planejamento");
      toast({
        title: "Erro",
        description: "Não foi possível salvar o planejamento",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    dias,
    produtosEstoque,
    isLoading,
    isSaving,
    saveError,
    carregandoProdutos,
    handleAddProduto,
    handleRemoveProduto,
    handleStatusChange,
    handleSalvarPlanejamento
  };
};