import { useState } from "react";
import { ItemPlanejamento } from "@/types/typesProducao";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProdutoTreeProps {
  item: ItemPlanejamento;
  onQuantidadeChange: (quantidade: number) => void;
}

export const ProdutoTree: React.FC<ProdutoTreeProps> = ({ item, onQuantidadeChange }) => {
  const [expanded, setExpanded] = useState(true);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = Number(e.target.value);
    if (quantidade >= 0) {
      onQuantidadeChange(quantidade);
    }
  };
  
  const hasInsuficiente = item.ingredientes.some(ing => !ing.suficiente);
  
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="mr-2 rounded-md p-1 hover:bg-gray-100"
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
          
          <div className="flex items-center">
            <div className="mr-3 font-medium">{item.produtoNome}</div>
            {hasInsuficiente && (
              <div className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Ingredientes insuficientes
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={item.quantidadePlanejada}
            onChange={handleQuantidadeChange}
            className="w-24 text-right"
          />
          <span className="w-16 text-sm text-gray-600">{item.unidadeMedida}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
          <div className="text-sm font-medium text-gray-700 pb-1">Ingredientes necessários:</div>
          <div className="space-y-2">
            {item.ingredientes.map((ing) => (
              <div key={ing.produtoId} className="flex items-center justify-between rounded-md bg-white p-2">
                <div className="flex items-center">
                  <div className="mr-2 text-sm">{ing.produtoNome}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className={cn(
                      "mr-1 px-2 py-1 text-xs font-medium rounded-sm",
                      ing.suficiente ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {ing.quantidadeNecessaria} {ing.unidadeMedida}
                    </span>
                    
                    {ing.suficiente ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    (Disponível: {ing.quantidadeDisponivel} {ing.unidadeMedida})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
