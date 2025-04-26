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
  
  // Limita a exibição para no máximo 5 produtos
  const produtosExibidos = produtos.slice(0, 3);

  return (
    <Alert className="border-warning bg-warning/10 shadow-md rounded-lg">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning font-medium text-lg">
          Atenção! Produtos com baixo estoque
        </AlertTitle>
      </div>
      <AlertDescription>
        <div className="mt-3 text-sm">
          {produtosExibidos.map((produto, index) => (
            <div 
              key={produto.id} 
              className={`flex justify-between py-2 ${
                index !== produtosExibidos.length - 1 ? "border-b border-warning/20" : ""
              } hover:bg-warning/5 rounded px-2 transition-colors`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{produto.nome}</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${produto.quantidadeAtual <= produto.quantidadeMinima ? "text-red-500" : "text-yellow-600"}`}>
                    {produto.quantidadeAtual}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-600">
                    {produto.quantidadeMinima}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AlertaBaixoEstoque;