import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProdutoCarrinho {
  id: string;
  nome: string;
  imagem: string;
  quantidadeAtual: number;
  codigoMaterial: string;
  codigoEstoque: string;
  unidade: string;
  deposito: string;
  quantidadeMinima: number;
  detalhes: string;
  unidadeMedida: string;
  valorUnitario: number;
}

export const useCarrinho = () => {
  const [itensCarrinho, setItensCarrinho] = useState<ProdutoCarrinho[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Carregar itens do carrinho do localStorage ao iniciar
  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
      try {
        setItensCarrinho(JSON.parse(carrinhoSalvo));
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
      }
    }
  }, []);

  // Salvar itens do carrinho no localStorage sempre que eles mudarem
  useEffect(() => {
    localStorage.setItem('carrinho', JSON.stringify(itensCarrinho));
  }, [itensCarrinho]);

  // Adicionar produto ao carrinho
  const adicionarAoCarrinho = (produto: any) => {
    // Verificar se já existe no carrinho
    const itemExistente = itensCarrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      // Se já existe, aumentar a quantidade
      setItensCarrinho(itens =>
        itens.map(item =>
          item.id === produto.id
            ? { ...item, quantidadeAtual: item.quantidadeAtual + 1 }
            : item
        )
      );
    } else {
      // Se não existe, adicionar novo item ao carrinho
      const novoProduto: ProdutoCarrinho = {
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem || '/placeholder.svg',
        quantidadeAtual: 1,
        codigoMaterial: produto.codigo,
        codigoEstoque: produto.codigoEstoque || '',
        unidade: produto.unidade || 'UN',
        deposito: produto.deposito || '',
        quantidadeMinima: produto.quantidadeMinima || 0,
        detalhes: produto.detalhes || '',
        unidadeMedida: produto.unidade || '',
        valorUnitario: produto.valorUnitario || 0,
      };
      
      setItensCarrinho(itens => [...itens, novoProduto]);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao carrinho`,
    });
  };

  // Remover produto do carrinho
  const removerDoCarrinho = (id: string) => {
    setItensCarrinho(itens => itens.filter(item => item.id !== id));
    
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho",
    });
  };

  // Atualizar quantidade de um produto
  const atualizarQuantidade = (id: string, quantidade: number) => {
    if (quantidade < 1) return;
    
    setItensCarrinho(itens =>
      itens.map(item =>
        item.id === id ? { ...item, quantidadeAtual: quantidade } : item
      )
    );
  };

  // Limpar carrinho
  const limparCarrinho = () => {
    setItensCarrinho([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos",
    });
  };

  // Redirecionar para o carrinho
  const irParaCarrinho = () => {
    navigate('/carrinho', { state: { carrinho: itensCarrinho } });
  };

  // Calcular o total de itens no carrinho (soma das quantidades)
  const calcularTotalItens = () => {
    return itensCarrinho.reduce((total, item) => total + item.quantidadeAtual, 0);
  };

  return {
    itensCarrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    irParaCarrinho,
    // Aqui está a principal modificação: agora somamos as quantidades de cada item
    totalItens: calcularTotalItens(),
    valorTotal: itensCarrinho.reduce(
      (total, item) => total + item.valorUnitario * item.quantidadeAtual,
      0
    ),
  };
};

export default useCarrinho;