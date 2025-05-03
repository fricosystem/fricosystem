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
        <div className="flex items-center justify-center h-full py-20">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando dados do estoque...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar produtos</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-950 rounded text-sm">
                Verifique se a conexão com o Firebase está configurada corretamente.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!produtos || produtos.length === 0) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Alert className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhum produto encontrado</AlertTitle>
            <AlertDescription>
              Não foram encontrados produtos na coleção. Verifique se existem documentos na coleção "produtos" do Firebase.
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-950 rounded text-sm">
                Debug: {JSON.stringify(debugInfo)}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-6 h-full`}>
          {/* Coluna da esquerda com a lista de produtos */}
          <div className={`${isMobile ? 'w-full' : 'w-96'} flex-shrink-0`}>
            <ProductList 
              products={filtrarProdutosPorEstoque(activeStock)} 
              onRemoveShelf={handleRemoveShelf}
              currentStock={activeStock}
            />
          </div>
          
          {/* Coluna da direita com o grid de endereçamento */}
          <div className="flex-grow h-full">
            {/* Tabs integradas ao card */}
            <Tabs 
              defaultValue="estoque1" 
              value={activeStock}
              onValueChange={setActiveStock} 
              className="flex flex-col bg-gray-50 dark:bg-gray-950 rounded-lg shadow overflow-hidden"
            >
              <TabsList className="grid grid-cols-5 w-full bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="estoque1">Estoque 1</TabsTrigger>
                <TabsTrigger value="estoque2">Estoque 2</TabsTrigger>
                <TabsTrigger value="estoque3">Estoque 3</TabsTrigger>
                <TabsTrigger value="estoque4">Estoque 4</TabsTrigger>
                <TabsTrigger value="estoque5">Estoque 5</TabsTrigger>
              </TabsList>
              
              {/* Conteúdo das tabs */}
              {["estoque1", "estoque2", "estoque3", "estoque4", "estoque5"].map((estoque) => (
                <TabsContent key={estoque} value={estoque} className="p-4">
                  <WarehouseGrid 
                    products={filtrarProdutosPorEstoque(estoque)}
                    onUpdateProductPosition={(product, row, column) => 
                      handleUpdateProductPosition(product, row, column, estoque)}
                    currentStock={estoque}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
        
        {/* Instruções de uso */}
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Como usar:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Arraste produtos da lista para a prateleira desejada</li>
            <li>Arraste produtos entre diferentes posições nas prateleiras</li>
            <li>Solte produtos na lista de produtos para remover endereçamento</li>
          </ul>
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