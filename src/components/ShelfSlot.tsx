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
        toast.warning(`Já existe um produto na posição ${positionLabel}`, {
          style: {
            background: '#1f2937',
            color: '#fbbf24',
            border: '1px solid #374151'
          }
        });
      }, 0);
      return;
    }
    
    // Chamar o handler do componente pai
    const result = onProductDrop(item);
    
    // Se a operação foi bem-sucedida, mostrar toast de sucesso
    if (result !== false) {
      setTimeout(() => {
        toast.success(`Produto ${item.nome} movido para ${positionLabel}`, {
          style: {
            background: '#1f2937',
            color: '#10b981',
            border: '1px solid #374151'
          }
        });
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
    if (isOver && canDrop) return 'bg-gray-700';
    if (canDrop) return 'bg-gray-800';
    return 'bg-gray-800';
  };

  const getBorderClass = () => {
    if (isOver && canDrop) return 'border-amber-400 shadow-amber-400/30';
    return 'border-gray-700';
  };

  return (
    <motion.div
      ref={drop}
      className={`p-2 border-2 rounded-lg transition-all duration-200 h-28 
        ${getBgClass()} 
        ${getBorderClass()}
        ${isOver ? 'shadow-lg' : ''}
        flex flex-col items-center justify-center relative`}
      animate={{
        scale: isOver && canDrop ? 1.05 : 1,
        boxShadow: isOver && canDrop ? '0 4px 12px rgba(251, 191, 36, 0.25)' : '0 0 0 rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Efeito de destaque quando pode receber drop */}
      {isOver && canDrop && (
        <motion.div 
          className="absolute inset-0 rounded-md border-2 border-dashed border-amber-400 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {!product && (
        <motion.div 
          className="text-center text-gray-500 flex flex-col items-center justify-center h-full w-full"
          animate={{ opacity: isOver && canDrop ? 0.5 : 1 }}
        >
          <Package size={20} className="mb-2 text-gray-600" />
          <span className="text-xs font-bold text-gray-400">{positionLabel}</span>
        </motion.div>
      )}

      {product && (
        <motion.div 
          ref={drag}
          className={`w-full h-full flex flex-col items-center justify-between p-1 cursor-grab active:cursor-grabbing`}
          animate={{ 
            opacity: isDragging ? 0.7 : 1,
            scale: isDragging ? 0.95 : 1
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="w-full h-12 flex justify-center overflow-hidden rounded-md">
            <img
              src={product.imagem || '/placeholder.svg'}
              alt={product.nome}
              className="h-full object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="text-center mt-1 w-full">
            <p className="text-xs font-bold line-clamp-1 text-gray-100">{product.nome}</p>
            <p className="text-[10px] text-amber-400 font-mono">{product.codigo_material}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}