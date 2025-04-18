<<<<<<< HEAD
import React, { useState, useRef, useEffect } from "react";
import { useProducts, Product, ProductProvider } from "@/contexts/ProductContext";
import { 
  PackageSearch, 
  PackageCheck, 
  MoveHorizontal, 
  Grid3X3, 
  RefreshCw,
  Clipboard,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import WarehouseGrid from "@/components/WarehouseGrid";
import ProductCard from "@/components/ProductCardEnderecamento";

// Create a wrapped component that uses the hook
const EnderecamentoContent = () => {
  const { products, loading, error, refreshProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Reference for detecting outside clicks
  const warehouseRef = useRef<HTMLDivElement>(null);

  // Filter products based on search query
  useEffect(() => {
    if (products) {
      const filtered = products.filter(product => 
        product.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.codigoEstoque && product.codigoEstoque.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.deposito && product.deposito.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.location && product.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados dos produtos foram atualizados.",
    });
  };

  // Copy product list to clipboard
  const copyToClipboard = () => {
    const productText = filteredProducts
      .map(p => `${p.codigo} | ${p.nome} | ${p.location || 'Sem localização'}`)
      .join('\n');
    
    navigator.clipboard.writeText(productText)
      .then(() => {
        toast({
          title: "Copiado para área de transferência",
          description: "Lista de produtos copiada para a área de transferência.",
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Erro",
          description: "Falha ao copiar para a área de transferência.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Sistema de Endereçamento de Produtos
          </h1>
          <p className="text-muted-foreground">
            Arraste e solte produtos para atribuir localizações no estoque
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={copyToClipboard}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por nome, código, depósito ou localização..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <PackageSearch className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mx-auto mt-4 block"
              onClick={handleRefresh}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product list (draggable items) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Produtos</h2>
                <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {filteredProducts.length}
                </span>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado com sua busca.
                  </p>
                ) : (
                  filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      isDraggable
                      setDraggedProduct={setDraggedProduct}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Warehouse grid (droppable areas) */}
          <div className="lg:col-span-2" ref={warehouseRef}>
            <div className="bg-card rounded-lg shadow p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Layout do Estoque</h2>
                <MoveHorizontal className="ml-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arraste produtos aqui para atribuir localizações
                </span>
              </div>
              
              <WarehouseGrid 
                draggedProduct={draggedProduct} 
                setDraggedProduct={setDraggedProduct}
                products={products}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component that wraps the content with ProductProvider
const Enderecamento = () => {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <main className="flex-1">
        <ProductProvider>
          <EnderecamentoContent />
        </ProductProvider>
      </main>
    </div>
  );
};

=======
import React, { useState, useRef, useEffect } from "react";
import { useProducts, Product, ProductProvider } from "@/contexts/ProductContext";
import { 
  PackageSearch, 
  PackageCheck, 
  MoveHorizontal, 
  Grid3X3, 
  RefreshCw,
  Clipboard,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import WarehouseGrid from "@/components/WarehouseGrid";
import ProductCard from "@/components/ProductCardEnderecamento";

// Create a wrapped component that uses the hook
const EnderecamentoContent = () => {
  const { products, loading, error, refreshProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Reference for detecting outside clicks
  const warehouseRef = useRef<HTMLDivElement>(null);

  // Filter products based on search query
  useEffect(() => {
    if (products) {
      const filtered = products.filter(product => 
        product.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.codigoEstoque && product.codigoEstoque.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.deposito && product.deposito.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.location && product.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados dos produtos foram atualizados.",
    });
  };

  // Copy product list to clipboard
  const copyToClipboard = () => {
    const productText = filteredProducts
      .map(p => `${p.codigo} | ${p.nome} | ${p.location || 'Sem localização'}`)
      .join('\n');
    
    navigator.clipboard.writeText(productText)
      .then(() => {
        toast({
          title: "Copiado para área de transferência",
          description: "Lista de produtos copiada para a área de transferência.",
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Erro",
          description: "Falha ao copiar para a área de transferência.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Sistema de Endereçamento de Produtos
          </h1>
          <p className="text-muted-foreground">
            Arraste e solte produtos para atribuir localizações no estoque
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={copyToClipboard}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por nome, código, depósito ou localização..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <PackageSearch className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mx-auto mt-4 block"
              onClick={handleRefresh}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product list (draggable items) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Produtos</h2>
                <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {filteredProducts.length}
                </span>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado com sua busca.
                  </p>
                ) : (
                  filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      isDraggable
                      setDraggedProduct={setDraggedProduct}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Warehouse grid (droppable areas) */}
          <div className="lg:col-span-2" ref={warehouseRef}>
            <div className="bg-card rounded-lg shadow p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Layout do Estoque</h2>
                <MoveHorizontal className="ml-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arraste produtos aqui para atribuir localizações
                </span>
              </div>
              
              <WarehouseGrid 
                draggedProduct={draggedProduct} 
                setDraggedProduct={setDraggedProduct}
                products={products}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component that wraps the content with ProductProvider
const Enderecamento = () => {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <main className="flex-1">
        <ProductProvider>
          <EnderecamentoContent />
        </ProductProvider>
      </main>
    </div>
  );
};

>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
export default Enderecamento;