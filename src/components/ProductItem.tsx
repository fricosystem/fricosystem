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

  // Renderização compacta
  if (isCompact) {
    return (
      <motion.div
        ref={drag}
        className="cursor-grab"
        animate={{ 
          opacity: isDragging ? 0.5 : 1,
          scale: isDragging ? 0.95 : 1,
        }}
        whileHover={{ scale: 1.0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className={`mb-1 transition-all duration-200 hover:shadow-sm border border-gray-200 dark:border-gray-700 
          ${hasShelf ? 'hover:border-gray-900 dark:hover:border-gray-900' : 'hover:border-blue-500 dark:hover:border-blue-400'}`}>
          <CardContent className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag size={12} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <h3 className="font-medium text-xs truncate text-gray-800 dark:text-gray-100">{product.nome}</h3>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    <div className="text-sm">
                      <p><strong>Nome:</strong> {product.nome}</p>
                      <p><strong>Código:</strong> {product.codigo_material}</p>
                      <p><strong>Quantidade:</strong> {product.quantidade} {product.unidade_de_medida}</p>
                      <p><strong>Valor:</strong> {formatCurrency(product.valor_unitario)}</p>
                      {product.prateleira && <p><strong>Posição:</strong> {product.prateleira}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {product.prateleira && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  <Check size={8} className="mr-1" />
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Renderização normal
  return (
    <motion.div
      ref={drag}
      className="cursor-grab"
      animate={{ 
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.95 : 1,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className={`mb-2 transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
        ${hasShelf ? 'hover:border-green-500 dark:hover:border-green-400' : 'hover:border-blue-500 dark:hover:border-blue-400'}`}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            <img 
              src={product.imagem || '/placeholder.svg'} 
              alt={product.nome} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-medium text-sm truncate text-gray-800 dark:text-gray-100">{product.nome}</h3>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <div className="text-sm">
                    <p><strong>Código:</strong> {product.codigo_material}</p>
                    <p><strong>Quantidade:</strong> {product.quantidade} {product.unidade_de_medida}</p>
                    <p><strong>Valor:</strong> {formatCurrency(product.valor_unitario)}</p>
                    {product.prateleira && <p><strong>Posição:</strong> {product.prateleira}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
              <Tag size={12} className="mr-1 text-gray-500 dark:text-gray-400" /> {product.codigo_material}
            </p>
            
            <div className="flex items-center mt-1 gap-1">
              {product.prateleira && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  <Package size={10} className="mr-1" /> {product.prateleira}
                </span>
              )}
              
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                {product.quantidade} {product.unidade_de_medida}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}