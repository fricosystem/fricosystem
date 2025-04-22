import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ShoppingCart } from "lucide-react";

// Baseado no tipo Produto do arquivo enviado
interface Produto {
  id: string;
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  detalhes: string;
  imagem: string;
  valorUnitario: number;
  prateleira: string;
  dataVencimento: string;
  dataHora: string;
  fornecedor: string;
}

interface ProdutoCardProps {
  produto: Produto;
  onEdit: () => void;
  onDelete: () => void;
  onAddToCart: () => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, onEdit, onDelete, onAddToCart }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Verifica se o produto está com estoque baixo
  const isLowStock = produto.quantidadeAtual <= produto.quantidadeMinima;

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out w-52 hover:w-64 hover:shadow-lg hover:z-10 flex flex-col">
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <img
          src={produto.imagem || "/placeholder.svg"}
          alt={produto.nome}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        {isLowStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Estoque Baixo
          </Badge>
        )}
      </div>

      <CardContent className="p-3 flex-1">
        <div className="flex justify-between items-start mb-1">
          <Badge variant="outline" className="text-xs truncate">
            {produto.codigo}
          </Badge>
          {produto.codigoEstoque && (
            <Badge variant="secondary" className="text-xs truncate">
              {produto.codigoEstoque}
            </Badge>
          )}
        </div>

        <h3 className="font-medium line-clamp-2 mt-2 mb-1">{produto.nome}</h3>

        <div className="text-sm text-gray-700 mb-2 truncate">
          {produto.prateleira && `Prateleira: ${produto.prateleira}`}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Quantidade:</span>
            <span className={isLowStock ? "text-red-600 font-medium" : ""}>
              {produto.quantidadeAtual} {produto.unidade}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Valor:</span>
            <span className="font-medium">{formatPrice(produto.valorUnitario)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 bg-gray-50 flex justify-between">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0 text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={onAddToCart} className="h-8">
          <ShoppingCart className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProdutoCard;