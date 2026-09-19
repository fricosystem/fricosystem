import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Produto, Material } from '@/hooks/usePlanejamento';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProdutoCardPlanejamentoProps {
  produto: Produto;
  onRemove: () => void;
  onStatusChange: (novoStatus: 'pendente' | 'em_producao' | 'concluido' | 'problema') => void;
}

type StatusType = 'pendente' | 'em_producao' | 'concluido' | 'problema';

const STATUS_MAP = {
  pendente: { label: 'Pendente', icon: '⏱️', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  em_producao: { label: 'Em Produção', icon: '🔄', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  concluido: { label: 'Concluído', icon: '✅', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  problema: { label: 'Problema', icon: '⚠️', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
};

export const ProdutoCardPlanejamento: React.FC<ProdutoCardPlanejamentoProps> = ({ produto, onRemove, onStatusChange }) => {
  // Formatar datas se existirem
  const dataCriacaoFormatada = produto.dataCriacao 
    ? format(produto.dataCriacao.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
    : null;
    
  const dataAtualizacaoFormatada = produto.dataAtualizacao 
    ? format(produto.dataAtualizacao.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
    : null;

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${STATUS_MAP[produto.status].color}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {produto.nome}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={produto.status} 
              onValueChange={(value) => onStatusChange(value as StatusType)}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_MAP).map(([key, { label, icon }]) => (
                  <SelectItem key={key} value={key} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Quantidade: {produto.quantidade} {produto.unidade}
        </CardDescription>
        {dataCriacaoFormatada && (
          <CardDescription className="text-xs mt-1">
            Criado em: {dataCriacaoFormatada}
          </CardDescription>
        )}
        {dataAtualizacaoFormatada && (
          <CardDescription className="text-xs">
            Atualizado em: {dataAtualizacaoFormatada}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div>
          <h4 className="font-medium mb-2">Materiais necessários:</h4>
          {produto.materiais && produto.materiais.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {produto.materiais.map((material: Material) => (
                <div 
                  key={material.id} 
                  className={`flex items-center justify-between p-2 rounded-md ${
                    material.disponivel 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <span>{material.nome}</span>
                  <div className="flex items-center gap-2">
                    <span>
                      {material.quantidade} {material.unidade}
                    </span>
                    <Badge 
                      variant={material.disponivel ? "outline" : "destructive"}
                      className="ml-2"
                    >
                      {material.disponivel ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Nenhum material registrado para este produto
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProdutoCardPlanejamento;