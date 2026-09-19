import { useEffect, useState } from 'react';
import { ProductItem } from '@/components/ProductItem';
import { Product } from '@/types/Product';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, List, Package2, Trash2, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDrop } from 'react-dnd';
import { toast } from '@/components/ui/sonner';

interface ProductListProps {
  products: Product[];
  onRemoveShelf?: (product: Product) => Promise<void>;
  currentStock: string;
}

export function ProductList({ products, onRemoveShelf, currentStock }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filterOption, setFilterOption] = useState('all');
  const [isCompact, setIsCompact] = useState(false);

  // Configuração completa do drop area
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'PRODUCT',
    drop: (item: Product) => {
      if (item.prateleira && onRemoveShelf) {
        onRemoveShelf(item).then(() => {
          toast.success(`Produto ${item.nome} removido do endereçamento`);
        });
      }
    },
    canDrop: (item: Product) => {
      return !!item.prateleira;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onRemoveShelf]);

  useEffect(() => {
    let filtered = products || [];
    
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        product => 
          product?.nome?.toLowerCase().includes(lowercasedSearch) ||
          product?.codigo_material?.toLowerCase().includes(lowercasedSearch) ||
          product?.codigo_estoque?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    if (filterOption === 'with-position') {
      filtered = filtered.filter(product => !!product.prateleira);
    } else if (filterOption === 'without-position') {
      filtered = filtered.filter(product => !product.prateleira);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, products, filterOption]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setFilterOption('all');
    setSearchTerm('');
  };

  const totalProducts = products?.length || 0;
  const withPositionCount = products?.filter(p => !!p.prateleira)?.length || 0;
  const withoutPositionCount = totalProducts - withPositionCount;
  const filteredCount = filteredProducts.length;

  const dropAreaClass = isOver && canDrop
    ? 'border-primary shadow-md'
    : 'border-border';

  return (
    <motion.div 
      ref={drop}
      className={`rounded-lg border shadow-sm h-full flex flex-col w-full min-w-0 max-w-full overflow-hidden
        transition-all duration-200 ${dropAreaClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cabeçalho */}
      <div className="p-3 sm:p-4 border-b min-w-0">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center min-w-0 truncate">
            <List className="mr-2 text-primary flex-shrink-0" size={20} /> 
            <span className="truncate">Produtos</span>
          </h2>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs px-2 h-8 flex-shrink-0"
          >
            {isCompact ? "+" : "-"}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 min-w-0">
          <Badge variant="outline" className="text-primary border-primary/20 text-xs">
            Endereçados: {withPositionCount}
          </Badge>
          <Badge variant="outline" className="text-destructive border-destructive/20 text-xs">
            Sem endereçamento: {withoutPositionCount}
          </Badge>
        </div>
        
        <div className="relative mb-3 min-w-0">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" size={16} />
          <Input
            placeholder="Buscar..."
            className="pl-8 pr-8 text-sm w-full min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              onClick={handleClearSearch}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={filterOption}
            onValueChange={setFilterOption}
          >
            <SelectTrigger className="flex-1 min-w-0 text-sm">
              <SelectValue placeholder="Filtrar..." />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with-position">Com endereço</SelectItem>
              <SelectItem value="without-position">Sem endereço</SelectItem>
            </SelectContent>
          </Select>
          
          {(filterOption !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClearFilters}
              className="h-9 w-9 flex-shrink-0"
            >
              <FilterX size={14} />
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-3 border-b">
        <motion.div 
          className="text-sm text-muted-foreground rounded-md flex items-center justify-between"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <Package2 size={14} className="mr-1 text-primary" /> 
            {filteredCount} produto(s) encontrado(s)
          </div>
          
          {isOver && canDrop && (
            <span className="text-xs text-primary font-medium">
              Solte para remover
            </span>
          )}
        </motion.div>
      </div>
      
      {isOver && canDrop && (
        <div className="mx-3 mt-3 text-center text-sm p-2 border border-dashed border-primary rounded-md text-primary">
          Solte para remover endereçamento
        </div>
      )}
      
      <ScrollArea className="flex-1 px-2 sm:px-3 pt-3 overflow-hidden">
        <AnimatePresence>
          {filteredProducts.length === 0 ? (
            <motion.div 
              className="text-center text-muted-foreground py-8 min-w-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Package2 size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">Nenhum produto encontrado</p>
              {(searchTerm || filterOption !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ staggerChildren: 0.05 }}
              className="pb-3 space-y-2 min-w-0"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="px-1 min-w-0"
                >
                  <ProductItem product={product} isCompact={isCompact} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  );
}