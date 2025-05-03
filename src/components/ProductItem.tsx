import { useDrag } from 'react-dnd';
import { Product } from '@/types/Product';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tag, Package, Check } from 'lucide-react';

interface ProductItemProps {
  product: Product;
  isCompact?: boolean;
}

export function ProductItem({ product, isCompact = false }: ProductItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PRODUCT',
    item: product,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const hasShelf = !!product.prateleira;

  // Renderização normal com tamanhos reduzidos
  return (
    <motion.div
      ref={drag}
      className="cursor-grab"
      animate={{ 
        opacity: isDragging ? 0.7 : 1,
        scale: isDragging ? 0.98 : 1,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className={`mb-2 transition-all duration-200 border border-gray-700 bg-gray-800 hover:bg-gray-750
        ${hasShelf ? 'hover:border-amber-400' : 'hover:border-blue-400'}`}>
        <CardContent className="p-2 flex items-center gap-2">
          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-700 flex-shrink-0 border border-gray-600">
            <img 
              src={product.imagem || '/placeholder.svg'} 
              alt={product.nome} 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-medium text-xs truncate text-gray-100">{product.nome}</h3>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-100 text-xs p-2">
                  <div className="space-y-1">
                    <p><strong className="text-amber-400">Código:</strong> {product.codigo_material}</p>
                    <p><strong className="text-amber-400">Quantidade:</strong> {product.quantidade} {product.unidade_de_medida}</p>
                    <p><strong className="text-amber-400">Valor:</strong> {formatCurrency(product.valor_unitario)}</p>
                    {product.prateleira && <p><strong className="text-amber-400">Posição:</strong> {product.prateleira}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-[11px] text-gray-400 truncate flex items-center mt-0.5">
              <Tag size={10} className="mr-1 text-amber-400" /> {product.codigo_material}
            </p>
            
            <div className="flex items-center mt-1 gap-1.5">
              {product.prateleira && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] bg-gray-700 text-amber-400 border border-gray-600">
                  <Package size={10} className="mr-1" /> {product.prateleira.split(' - ').pop()}
                </span>
              )}
              
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] bg-gray-700 text-gray-300 border border-gray-600">
                {product.quantidade} {product.unidade_de_medida}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}