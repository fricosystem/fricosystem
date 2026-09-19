import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useProdutos } from '@/hooks/useProdutos';
import { WarehouseGrid } from '@/components/WarehouseGrid';
import { ProductList } from '@/components/ProductList';
import { Product } from '../types/Product';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/AppLayout';

const Enderecamento = () => {
  const { produtos, loading, error, updatePrateleira } = useProdutos();
  const [activeStock, setActiveStock] = useState("estoque1");
  const [debugInfo, setDebugInfo] = useState({count: 0, firstProduct: null});
  const [isMobile, setIsMobile] = useState(false);

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Debug para verificar carregamento dos produtos
  useEffect(() => {
    if (produtos && produtos.length > 0) {
      setDebugInfo({
        count: produtos.length,
        firstProduct: produtos[0]
      });
    }
  }, [produtos]);

  const handleUpdateProductPosition = async (product: Product, row: number, column: number, estoque: string) => {
    const andar = Math.ceil(row / 5);
    const palete = ((row - 1) % 5) + 1;
    const newShelf = `${estoque} - Rua ${column.toString().padStart(2, '0')} - A${andar}P${palete}`;
    await updatePrateleira(product.id, newShelf);
  };

  const handleRemoveShelf = async (product: Product) => {
    await updatePrateleira(product.id, null);
  };

  const filtrarProdutosPorEstoque = (estoque: string) => {
    return produtos;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[50vh] py-20">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do estoque...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-[50vh] p-4">
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar produtos</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                Verifique se a conexão com o Firebase está configurada corretamente.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!produtos || produtos.length === 0) {
      return (
        <div className="flex items-center justify-center h-[50vh] p-4">
          <Alert className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhum produto encontrado</AlertTitle>
            <AlertDescription>
              Não foram encontrados produtos na coleção. Verifique se existem documentos na coleção "produtos" do Firebase.
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                Debug: {JSON.stringify(debugInfo)}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full space-y-4">
        {/* Container principal com altura ajustada */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Lista de produtos */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col min-h-0">
            <ProductList 
              products={filtrarProdutosPorEstoque(activeStock)} 
              onRemoveShelf={handleRemoveShelf}
              currentStock={activeStock}
            />
          </div>
          
          {/* Grid de endereçamento */}
          <div className="lg:col-span-9 xl:col-span-9 flex flex-col min-h-0">
            <Tabs 
              defaultValue="estoque1" 
              value={activeStock}
              onValueChange={setActiveStock} 
              className="flex flex-col h-full"
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full mb-4 h-auto p-1 flex-shrink-0">
                <TabsTrigger value="estoque1" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Estoque </span>1
                </TabsTrigger>
                <TabsTrigger value="estoque2" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Estoque </span>2
                </TabsTrigger>
                <TabsTrigger value="estoque3" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Estoque </span>3
                </TabsTrigger>
                <TabsTrigger value="estoque4" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Estoque </span>4
                </TabsTrigger>
                <TabsTrigger value="estoque5" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Estoque </span>5
                </TabsTrigger>
              </TabsList>
              
              {/* Conteúdo das tabs */}
              <div className="flex-1 min-h-0">
                {["estoque1", "estoque2", "estoque3", "estoque4", "estoque5"].map((estoque) => (
                  <TabsContent key={estoque} value={estoque} className="h-full mt-0">
                    <WarehouseGrid 
                      products={filtrarProdutosPorEstoque(estoque)}
                      onUpdateProductPosition={(product, row, column) => 
                        handleUpdateProductPosition(product, row, column, estoque)}
                      currentStock={estoque}
                    />
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
        
        {/* Instruções de uso - sempre visível na parte inferior */}
        <div className="border rounded-lg p-4 flex-shrink-0">
          <h3 className="font-semibold mb-3 text-base">📋 Como usar o sistema de endereçamento:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-primary font-bold">1.</span>
              <span className="text-muted-foreground">Arraste produtos da lista para a prateleira desejada</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-primary font-bold">2.</span>
              <span className="text-muted-foreground">Arraste produtos entre diferentes posições nas prateleiras</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-primary font-bold">3.</span>
              <span className="text-muted-foreground">Solte produtos na lista para remover endereçamento</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <AppLayout title="Gerenciamento de Endereçamento">
        <div className="h-full flex flex-col">
          {renderContent()}
        </div>
      </AppLayout>
    </DndProvider>
  );
};

export default Enderecamento;