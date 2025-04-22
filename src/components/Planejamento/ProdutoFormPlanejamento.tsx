import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Produto as ProdutoEstoque } from '@/hooks/useProdutos';

interface ProdutoFormPlanejamentoProps {
  produtos: ProdutoEstoque[] | undefined;
  carregandoProdutos: boolean;
  onAddProduto: (produtoId: string, quantidade: number) => void;
}

export const ProdutoFormPlanejamento: React.FC<ProdutoFormPlanejamentoProps> = ({ 
  produtos, 
  carregandoProdutos,
  onAddProduto
}) => {
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);

  const handleSubmit = () => {
    if (produtoSelecionado) {
      onAddProduto(produtoSelecionado, quantidade);
      setProdutoSelecionado("");
      setQuantidade(1);
    }
  };

  const unidadeSelecionada = produtoSelecionado 
    ? produtos?.find(p => p.id === produtoSelecionado)?.unidade_de_medida || 'un.' 
    : 'un.';

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Selecione um produto" />
        </SelectTrigger>
        <SelectContent>
          {carregandoProdutos ? (
            <SelectItem value="" disabled>Carregando...</SelectItem>
          ) : (produtos && produtos.length > 0 ? (
            produtos.map(produto => (
              <SelectItem key={produto.id} value={produto.id}>{produto.nome}</SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>Nenhum produto cadastrado</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex items-center border rounded-md px-3">
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-16 bg-transparent focus:outline-none"
        />
        <span className="ml-1 text-muted-foreground">{unidadeSelecionada}</span>
      </div>
      
      <Button onClick={handleSubmit} disabled={!produtoSelecionado}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar
      </Button>
    </div>
  );
};

export default ProdutoFormPlanejamento;
