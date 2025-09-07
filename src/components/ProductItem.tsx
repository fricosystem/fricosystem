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
      <Card className={`mb-2 transition-all duration-200 border
        ${hasShelf ? 'hover:border-primary' : 'hover:border-primary'}`}>
        <CardContent className="p-2 flex items-center gap-2">
          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border">
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
                  <h3 className="font-medium text-xs truncate">{product.nome}</h3>
                </TooltipTrigger>
                <TooltipContent className="text-xs p-2">
                  <div className="space-y-1">
                    <p><strong className="text-primary">Código:</strong> {product.codigo_material}</p>
                    <p><strong className="text-primary">Quantidade:</strong> {product.quantidade} {product.unidade_de_medida}</p>
                    <p><strong className="text-primary">Valor:</strong> {formatCurrency(product.valor_unitario)}</p>
                    {product.prateleira && <p><strong className="text-primary">Posição:</strong> {product.prateleira}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-[11px] text-muted-foreground truncate flex items-center mt-0.5">
              <Tag size={10} className="mr-1 text-primary" /> {product.codigo_material}
            </p>
            
            <div className="flex items-center mt-1 gap-1.5">
              {product.prateleira && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] text-primary border">
                  <Package size={10} className="mr-1" /> {product.prateleira.split(' - ').pop()}
                </span>
              )}
              
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground border">
                {product.quantidade} {product.unidade_de_medida}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}