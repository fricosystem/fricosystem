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
          className="grid grid-cols-6 gap-2 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * (andares - andar), duration: 0.3 }}
        >
          <div className="flex items-center justify-center">
            <div className="bg-gray-800 text-amber-400 px-3 py-1.5 rounded-md text-xs font-bold border border-gray-700 shadow-sm">
              ANDAR {andar}
            </div>
          </div>
          <div className="col-span-5 grid grid-cols-5 gap-2">
            {rowSlots}
          </div>
        </motion.div>
      );
    }
    
    return grid;
  };

  return (
    <motion.div 
      className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg p-4 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <Warehouse className="mr-3 text-amber-400" size={22} />
          <h2 className="text-xl font-bold text-gray-100">
            {currentStock.replace('estoque', 'Estoque ').toUpperCase()}
          </h2>
        </div>
        <div className="text-xs text-gray-400 font-medium px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center shadow-inner">
          <Truck className="mr-2 text-amber-400" size={14} />
          <span>6 RUAS × 5 ANDARES × 5 PALETES</span>
        </div>
      </div>
      
      <div className="mb-5">
        <label className="text-sm font-semibold mb-2 block text-gray-300">SELECIONE A RUA:</label>
        <Select 
          value={selectedRua.toString()} 
          onValueChange={(value) => setSelectedRua(parseInt(value))}
        >
          <SelectTrigger className="w-full max-w-xs bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-750 hover:border-gray-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900">
            <SelectValue placeholder="Selecione uma rua" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-gray-200 shadow-lg">
            {Array.from({ length: ruas }, (_, i) => i + 1).map((rua) => (
              <SelectItem 
                key={rua} 
                value={rua.toString()}
                className="hover:bg-gray-700 focus:bg-gray-700 focus:text-amber-400"
              >
                RUA {rua.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 shadow-inner border border-gray-700">
        <div className="flex items-center mb-4">
          <h3 className="text-base font-bold text-gray-100">
            RUA {selectedRua.toString().padStart(2, '0')}
          </h3>
          <span className="ml-3 px-3 py-1 bg-gray-700 text-amber-400 rounded-full text-xs font-bold">
            {productsInCurrentStock.filter(p => p.prateleira?.includes(`Rua ${selectedRua.toString().padStart(2, '0')}`)).length} PRODUTOS
          </span>
        </div>
        
        <div className="grid grid-cols-6 border-b border-gray-700 pb-2 mb-3">
          <div className="col-span-1"></div>
          <div className="col-span-5 grid grid-cols-5 gap-2">
            {Array.from({ length: paletesPorAndar }, (_, i) => i + 1).map((palete) => (
              <div key={palete} className="text-center text-xs font-bold text-gray-400">
                PALETE {palete}
              </div>
            ))}
          </div>
        </div>
        
        {renderRuaGrid()}
      </div>
    </motion.div>
  );
}