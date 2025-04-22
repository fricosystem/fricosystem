import { Product } from '@/types/Product';
import { ShelfSlot } from '@/components/ShelfSlot';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Warehouse } from 'lucide-react';

interface WarehouseGridProps {
  products: Product[];
  onUpdateProductPosition: (product: Product, row: number, column: number) => void;
  currentStock: string;
}

export function WarehouseGrid({ products, onUpdateProductPosition, currentStock }: WarehouseGridProps) {
  const [selectedRua, setSelectedRua] = useState<number>(1);
  
  // Configuração de endereçamento
  const ruas = 6; // 6 ruas
  const andares = 5; // 5 andares
  const paletesPorAndar = 5; // 5 paletes por andar
  
  // Filtramos apenas os produtos do estoque atual
  const productsInCurrentStock = products.filter(product => 
    product.prateleira?.startsWith(currentStock)
  );
  
  // Método para encontrar um produto em uma posição específica
  const findProductAtPosition = useCallback((rua: number, andar: number, palete: number) => {
    const positionKey = `${currentStock} - Rua ${rua.toString().padStart(2, '0')} - A${andar}P${palete}`;
    return products.find(product => product.prateleira === positionKey) || null;
  }, [products, currentStock]);
  
  // Manipulador para quando um produto é movido para um slot
  const handleProductDrop = useCallback((product: Product, rua: number, andar: number, palete: number) => {
    // Verificar se o produto já está na posição alvo
    const currentShelf = product.prateleira;
    const newShelf = `${currentStock} - Rua ${rua.toString().padStart(2, '0')} - A${andar}P${palete}`;
    
    if (currentShelf === newShelf) {
      // O produto já está na posição alvo, não fazer nada
      return false;
    }
    
    // Verificar se já existe um produto na posição alvo
    const existingProduct = findProductAtPosition(rua, andar, palete);
    if (existingProduct) {
      // Já existe um produto na posição
      return false;
    }
    
    // Converter para o formato row, column para compatibilidade com o handler
    const row = ((andar - 1) * paletesPorAndar) + palete;
    onUpdateProductPosition(product, row, rua);
    return true;
  }, [findProductAtPosition, onUpdateProductPosition, currentStock, paletesPorAndar]);
  
  // Renderizar o grid de uma rua específica
  const renderRuaGrid = () => {
    const grid = [];
    
    // Para cada andar (de cima para baixo)
    for (let andar = andares; andar >= 1; andar--) {
      const rowSlots = [];
      
      // Para cada palete no andar
      for (let palete = 1; palete <= paletesPorAndar; palete++) {
        const product = findProductAtPosition(selectedRua, andar, palete);
        rowSlots.push(
          <ShelfSlot
            key={`${selectedRua}-${andar}-${palete}`}
            row={((andar - 1) * paletesPorAndar) + palete}
            column={selectedRua}
            product={product}
            onProductDrop={(prod) => handleProductDrop(prod, selectedRua, andar, palete)}
            positionLabel={`A${andar}P${palete}`}
          />
        );
      }
      
      grid.push(
        <motion.div 
          key={andar} 
          className="grid grid-cols-6 gap-1 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * (andares - andar), duration: 0.3 }}
        >
          <div className="flex items-center justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
              Andar {andar}
            </div>
          </div>
          <div className="col-span-5 grid grid-cols-5 gap-1">
            {rowSlots}
          </div>
        </motion.div>
      );
    }
    
    return grid;
  };

  return (
    <motion.div 
      className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Warehouse className="mr-2 text-blue-500 dark:text-blue-400" size={20} />
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            {currentStock.replace('estoque', 'Estoque ')}
          </h2>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center">
          <Truck className="mr-1 text-gray-500 dark:text-gray-400" size={14} />
          6 Ruas × 5 Andares × 5 Paletes
        </div>
      </div>
      
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">Selecione a Rua:</label>
        <Select 
          value={selectedRua.toString()} 
          onValueChange={(value) => setSelectedRua(parseInt(value))}
        >
          <SelectTrigger className="w-full max-w-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Selecione uma rua" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            {Array.from({ length: ruas }, (_, i) => i + 1).map((rua) => (
              <SelectItem key={rua} value={rua.toString()}>
                Rua {rua.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-inner border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
            Rua {selectedRua.toString().padStart(2, '0')}
          </h3>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs">
            {productsInCurrentStock.filter(p => p.prateleira?.includes(`Rua ${selectedRua.toString().padStart(2, '0')}`)).length} produtos
          </span>
        </div>
        
        <div className="grid grid-cols-6 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
          <div className="col-span-1"></div>
          <div className="col-span-5 grid grid-cols-5 gap-1">
            {Array.from({ length: paletesPorAndar }, (_, i) => i + 1).map((palete) => (
              <div key={palete} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                P{palete}
              </div>
            ))}
          </div>
        </div>
        
        {renderRuaGrid()}
      </div>
    </motion.div>
  );
}