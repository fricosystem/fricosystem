import { AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AlertaBaixoEstoqueProps {
  produtos: Array<{
    id: string;
    nome: string;
    quantidadeAtual: number;
    quantidadeMinima: number;
  }>;
}

const AlertaBaixoEstoque = ({ produtos }: AlertaBaixoEstoqueProps) => {
  const navigate = useNavigate();
  
  if (!produtos || produtos.length === 0) return null;
  
  // Limita a exibição para no máximo 5 produtos
  const produtosExibidos = produtos.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-warning font-medium text-lg">
            Atenção! Produtos com baixo estoque
          </h3>
        </div>
        <Button 
          onClick={() => navigate('/compras')}
          className="flex items-center gap-2"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4" />
          Acompanhar Compras
        </Button>
      </div>
      
      <div className="space-y-2">
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
    </div>
  );
};

export default AlertaBaixoEstoque;