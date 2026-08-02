import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiaPlanejamento as DiaPlanejamentoType, Produto } from '@/hooks/usePlanejamento';
import ProdutoCard from '@/components/Planejamento/ProdutoCardPlanejamento';
import ProdutoForm from '@/components/Planejamento/ProdutoFormPlanejamento';
// Removido import não existente - usando tipagem simplificada
import { useToast } from '@/hooks/use-toast';

interface DiaPlanejamentoProps {
  dia: DiaPlanejamentoType;
  diaIndex: number;
  produtos: any[] | undefined;
  carregandoProdutos: boolean;
  handleAddProduto: (diaIndex: number, produtoId: string, quantidade: number) => void;
  handleRemoveProduto: (diaIndex: number, produtoId: string) => void;
  handleStatusChange: (diaIndex: number, produtoId: string, novoStatus: 'pendente' | 'em_producao' | 'concluido' | 'problema') => void;
}

export const DiaPlanejamento: React.FC<DiaPlanejamentoProps> = ({
  dia,
  diaIndex,
  produtos,
  carregandoProdutos,
  handleAddProduto,
  handleRemoveProduto,
  handleStatusChange
}) => {
  const { toast } = useToast();
  
  const onAddProduto = (produtoId: string, quantidade: number) => {
    handleAddProduto(diaIndex, produtoId, quantidade);
  };

  // Produtos já são compatíveis agora

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>
          {format(dia.data, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </CardTitle>
        <CardDescription>
          Adicione os produtos a serem produzidos neste dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProdutoForm 
          produtos={produtos}
          carregandoProdutos={carregandoProdutos}
          onAddProduto={onAddProduto}
        />
        
        <div className="space-y-4">
          {dia.produtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto planejado para este dia
            </div>
          ) : (
            dia.produtos.map((produto: Produto) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                onRemove={() => handleRemoveProduto(diaIndex, produto.id)}
                onStatusChange={(novoStatus) => handleStatusChange(diaIndex, produto.id, novoStatus)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiaPlanejamento;