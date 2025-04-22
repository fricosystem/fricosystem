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

  // Drop functionality para a lista
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'PRODUCT',
    drop: (item: Product) => {
      // Se o produto já tem endereçamento, remova-o
      if (item.prateleira && onRemoveShelf) {
        onRemoveShelf(item).then(() => {
          toast.success(`Produto ${item.nome} removido do endereçamento`);
        });
      }
    },
    canDrop: (item: Product) => {
      // Só podemos soltar produtos que têm endereçamento
      return !!item.prateleira;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onRemoveShelf]);

  useEffect(() => {
    console.log("ProductList recebeu products:", products?.length || 0);
    let filtered = products || [];
    
    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        product => 
          product?.nome?.toLowerCase().includes(lowercasedSearch) ||
          product?.codigo_material?.toLowerCase().includes(lowercasedSearch) ||
          product?.codigo_estoque?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Aplicar filtro de endereçamento
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

  // Contagens para o resumo
  const totalProducts = products?.length || 0;
  const withPositionCount = products?.filter(p => !!p.prateleira)?.length || 0;
  const withoutPositionCount = totalProducts - withPositionCount;
  const filteredCount = filteredProducts.length;

  const dropAreaClass = isOver && canDrop
    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md'
    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';

  return (
    <motion.div 
      ref={drop}
      className={`rounded-lg border shadow-sm h-full flex flex-col w-full
        transition-all duration-200 ${dropAreaClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent flex items-center">
            <List className="mr-2 text-blue-500 dark:text-blue-400" size={20} /> Produtos
          </h2>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs px-2 h-8"
          >
            {isCompact ? "Expandir" : "Compactar"}
          </Button>
        </div>
        
        {/* Resumo em badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            Total: {totalProducts}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
            Endereçados: {withPositionCount}
          </Badge>
          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">
            Não endereçados: {withoutPositionCount}
          </Badge>
        </div>
        
        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <Input
            placeholder="Buscar produto..."
            className="pl-8 pr-8 transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-700/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={handleClearSearch}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        
        {/* Filtros */}
        <div className="flex items-center gap-2">
          <Select
            value={filterOption}
            onValueChange={setFilterOption}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Filtrar por endereçamento" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="all">Todos os produtos</SelectItem>
              <SelectItem value="with-position">Com endereçamento</SelectItem>
              <SelectItem value="without-position">Sem endereçamento</SelectItem>
            </SelectContent>
          </Select>
          
          {(filterOption !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClearFilters}
              className="h-10 w-10 flex-shrink-0"
            >
              <FilterX size={16} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Área de resultado */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <motion.div 
          className="text-sm text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-between"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <Package2 size={14} className="mr-1 text-blue-500 dark:text-blue-400" /> 
            {filteredCount} produto(s) encontrado(s)
          </div>
          
          {isOver && canDrop && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Solte para remover
            </span>
          )}
        </motion.div>
      </div>
      
      {/* Área de drop */}
      {isOver && canDrop && (
        <div className="mx-3 mt-3 text-center text-sm p-2 border border-dashed border-blue-400 dark:border-blue-500 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
          Solte para remover endereçamento
        </div>
      )}
      
      {/* Lista de produtos */}
      <ScrollArea className="flex-1 px-3 pt-3">
        <AnimatePresence>
          {filteredProducts.length === 0 ? (
            <motion.div 
              className="text-center text-gray-500 dark:text-gray-400 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Package2 size={32} className="mx-auto mb-2 text-gray-400 dark:text-gray-600" />
              <p>Nenhum produto encontrado</p>
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
              className="pb-3"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className={isCompact ? "mb-1" : "mb-2"}
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