import { useDrop, useDrag } from 'react-dnd';
import { Product } from '@/types/Product';
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

interface ShelfSlotProps {
  row: number;
  column: number;
  product: Product | null;
  onProductDrop: (product: Product) => boolean | void;
  positionLabel?: string; // Para mostrar a posição formatada (ex: "A1P3")
}

export function ShelfSlot({ row, column, product, onProductDrop, positionLabel }: ShelfSlotProps) {
  // Handler callback definition
  const handleDrop = useCallback((item: Product) => {
    // Verificar se o produto já está na posição
    if (product) {
      setTimeout(() => {
        toast.warning(`Já existe um produto na posição ${positionLabel}`);
      }, 0);
      return;
    }
    
    // Chamar o handler do componente pai
    const result = onProductDrop(item);
    
    // Se a operação foi bem-sucedida, mostrar toast de sucesso
    if (result !== false) {
      setTimeout(() => {
        toast.success(`Produto ${item.nome} movido para ${positionLabel}`);
      }, 0);
    }
  }, [positionLabel, product, onProductDrop]);

  // Drop functionality for the slot
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'PRODUCT',
    drop: handleDrop,
    canDrop: (item: any) => {
      // Não permitir soltar o produto no slot onde ele já está
      if (product && item.id === product.id) {
        return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [product, handleDrop]);

  // Drag functionality for the product in this slot
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PRODUCT',
    item: product,
    canDrag: !!product, // Só pode arrastar se tiver um produto
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [product]);

  // Determinar classes com base no estado de drop
  const getBgClass = () => {
    if (isOver && canDrop) return 'bg-blue-50 dark:bg-blue-900/30';
    if (canDrop) return 'bg-gray-50 dark:bg-gray-800';
    return 'bg-white dark:bg-gray-800';
  };

  const getBorderClass = () => {
    if (isOver && canDrop) return 'border-blue-400 dark:border-blue-500';
    return 'border-gray-200 dark:border-gray-700';
  };

  return (
    <motion.div
      ref={drop}
      className={`p-2 border rounded-md transition-all duration-200 h-28 
        ${getBgClass()} 
        ${getBorderClass()}
        ${isOver ? 'shadow-md' : ''}
        flex flex-col items-center justify-center`}
      animate={{
        scale: isOver && canDrop ? 1.05 : 1,
        boxShadow: isOver && canDrop ? '0 4px 12px rgba(0, 0, 255, 0.15)' : '0 0 0 rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.2 }}
    >
      {!product && (
        <motion.div 
          className="text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center"
          animate={{ opacity: isOver && canDrop ? 0.5 : 1 }}
        >
          <Package size={18} className="mb-1" />
          <span className="text-xs font-medium">{positionLabel}</span>
        </motion.div>
      )}

      {product && (
        <motion.div 
          ref={drag}
          className={`w-full h-full flex flex-col items-center justify-between p-1 cursor-grab`}
          animate={{ 
            opacity: isDragging ? 0.5 : 1,
            scale: isDragging ? 0.95 : 1
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="w-full h-12 flex justify-center overflow-hidden rounded bg-gray-50 dark:bg-gray-700">
            <img
              src={product.imagem || '/placeholder.svg'}
              alt={product.nome}
              className="h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="text-center mt-1">
            <p className="text-xs font-medium line-clamp-1 text-gray-800 dark:text-gray-200">{product.nome}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{product.codigo_material}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}