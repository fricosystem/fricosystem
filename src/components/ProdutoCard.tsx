
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ShoppingCart } from "lucide-react";

// Interface for the products from Google Sheets
interface ProdutoSheets {
  id: string;
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  detalhes: string;
  dataHora: string;
  imagem: string;
  valorUnitario: number;
  centroDeCusto?: string;
}

interface ProdutoCardProps {
  produto: ProdutoSheets;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToCart?: (produto: ProdutoSheets) => void;
}

const ProdutoCard = ({ produto, onEdit, onDelete, onAddToCart }: ProdutoCardProps) => {
  const isLowStock = produto.quantidadeAtual <= produto.quantidadeMinima;
  
  // Formatar valor para o padrão brasileiro (R$ 0.000,00)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-48 bg-muted">
        <img
          src={produto.imagem || "/placeholder.svg"}
          alt={produto.nome}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {isLowStock && (
            <Badge variant="destructive">Estoque Baixo</Badge>
          )}
        </div>
      </div>
      <CardContent className="pt-6 flex-grow">
        <div className="text-xs text-muted-foreground mb-1">
          Cód: {produto.codigo} | Est: {produto.codigoEstoque}
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{produto.nome}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unidade:</span>
            <span>{produto.unidade}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantidade:</span>
            <span className={isLowStock ? "text-destructive font-semibold" : ""}>
              {produto.quantidadeAtual} / {produto.quantidadeMinima}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Un.:</span>
            <span>{formatCurrency(produto.valorUnitario)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depósito:</span>
            <span>{produto.deposito}</span>
          </div>
          {produto.detalhes && (
            <div className="mt-2">
              <span className="text-muted-foreground">Detalhes:</span>
              <p className="text-sm mt-1 line-clamp-2">{produto.detalhes}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(produto.id)}
        >
          <Edit size={16} className="mr-1" /> Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
          onClick={() => onDelete(produto.id)}
        >
          <Trash2 size={16} className="mr-1" /> Excluir
        </Button>
        {onAddToCart && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => onAddToCart(produto)}
          >
            <ShoppingCart size={16} className="mr-1" /> Adicionar ao Carrinho
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProdutoCard;
