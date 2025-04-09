
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertaBaixoEstoqueProps {
  produtos: Array<{
    id: string;
    nome: string;
    quantidadeAtual: number;
    quantidadeMinima: number;
  }>;
}

const AlertaBaixoEstoque = ({ produtos }: AlertaBaixoEstoqueProps) => {
  if (!produtos || produtos.length === 0) return null;

  return (
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning font-medium">
        Atenção! Produtos com baixo estoque
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 text-sm">
          {produtos.map((produto) => (
            <div key={produto.id} className="flex justify-between py-1 border-b last:border-0">
              <span>{produto.nome}</span>
              <span className="font-semibold">
                {produto.quantidadeAtual} / {produto.quantidadeMinima}
              </span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AlertaBaixoEstoque;
