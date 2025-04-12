
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface ProdutoCardProps {
  produto: {
    id: string;
    codigo: string;
    nome: string;
    centroDeCusto: string;
    quantidadeAtual: number;
    quantidadeMinima: number;
    valorUnitario: number;
    imagem?: string;
    deposito: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProdutoCard = ({ produto, onEdit, onDelete }: ProdutoCardProps) => {
  const isLowStock = produto.quantidadeAtual <= produto.quantidadeMinima;
  
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
          Cód: {produto.codigo}
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{produto.nome}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Centro de Custo:</span>
            <span>{produto.centroDeCusto}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantidade:</span>
            <span className={isLowStock ? "text-destructive font-semibold" : ""}>
              {produto.quantidadeAtual} / {produto.quantidadeMinima}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Un.:</span>
            <span>R$ {produto.valorUnitario.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depósito:</span>
            <span>{produto.deposito}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 gap-2">
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
      </CardFooter>
    </Card>
  );
};

export default ProdutoCard;
