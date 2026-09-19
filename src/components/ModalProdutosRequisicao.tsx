import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface ItemRequisicao {
  nome: string;
  codigo_material: string;
  codigo_estoque: string;
  quantidade: number;
  valor_unitario: number;
  unidade: string;
  unidade_de_medida: string;
  deposito: string;
  prateleira: string;
  detalhes: string;
  imagem: string;
  centro_de_custo: string;
}

interface ItemDevolucao {
  codigo_material: string;
  quantidade_devolvida: number;
}

interface ModalProdutosRequisicaoProps {
  itens: ItemRequisicao[];
  devolucoes?: ItemDevolucao[];
  formatCurrency: (value: number) => string;
}

const ModalProdutosRequisicao: React.FC<ModalProdutosRequisicaoProps> = ({ 
  itens, 
  devolucoes = [], 
  formatCurrency 
}) => {
  const getQuantidadeDevolvida = (codigoMaterial: string) => {
    const devolucao = devolucoes.find(d => d.codigo_material === codigoMaterial);
    return devolucao?.quantidade_devolvida || 0;
  };

  const getQuantidadeDisponivel = (item: ItemRequisicao) => {
    const quantidadeDevolvida = getQuantidadeDevolvida(item.codigo_material);
    return item.quantidade - quantidadeDevolvida;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm text-blue-600 hover:underline">
          Ver todos os produtos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={20} />
            Produtos da Requisição ({itens.length} itens)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {itens.map((item, index) => {
            const quantidadeDevolvida = getQuantidadeDevolvida(item.codigo_material);
            const quantidadeDisponivel = getQuantidadeDisponivel(item);
            const temDevolucao = quantidadeDevolvida > 0;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${temDevolucao ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{item.nome}</h4>
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <div>Código Material: {item.codigo_material}</div>
                      <div>Código Estoque: {item.codigo_estoque}</div>
                      <div>Depósito: {item.deposito}</div>
                      <div>Prateleira: {item.prateleira}</div>
                      <div>Valor Unitário: {formatCurrency(item.valor_unitario)}</div>
                      {item.detalhes && <div>Detalhes: {item.detalhes}</div>}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="space-y-1">
                      <div className="font-medium">
                        Qtd. Original: {item.quantidade} {item.unidade || item.unidade_de_medida}
                      </div>
                      
                      {temDevolucao && (
                        <>
                          <div className="text-orange-600 font-medium">
                            Qtd. Devolvida: {quantidadeDevolvida} {item.unidade || item.unidade_de_medida}
                          </div>
                          <div className="text-green-600 font-medium">
                            Qtd. Disponível: {quantidadeDisponivel} {item.unidade || item.unidade_de_medida}
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            Parcialmente Devolvido
                          </Badge>
                        </>
                      )}
                      
                      {!temDevolucao && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Disponível para Devolução
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Valor Total: {formatCurrency(item.valor_unitario * item.quantidade)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalProdutosRequisicao;