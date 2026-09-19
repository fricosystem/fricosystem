import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/firebase/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  serverTimestamp, 
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Plus, Save, CheckCircle, AlertTriangle, Trash2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScanQrCode } from 'lucide-react';

interface Product {
  id: string;
  nome: string;
  codigo_estoque: string;
  codigo_material: string;
  quantidade: number;
}

interface CountItem {
  productId: string;
  productName: string;
  productCode: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
}

// Componente QR Scanner corrigido
const QRScanner = ({ 
  onResult,
  onError 
}: {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isScanning, setIsScanning] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Função para iniciar a câmera de forma controlada
  const initCamera = async () => {
    try {
      // Limpar qualquer stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Usar evento loadedmetadata para garantir que o vídeo está pronto
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsScanning(true);
            startQRDetection();
          } catch (err) {
            console.error("Erro ao reproduzir vídeo:", err);
            onError?.(new Error("Não foi possível iniciar a câmera. Tente novamente."));
          }
        };
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setHasPermission(false);
      onError?.(new Error("Não foi possível acessar a câmera. Verifique as permissões."));
    }
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) {
        return;
      }
      
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!context) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Implementação simplificada de detecção QR - mantenho a lógica original
        // Em produção, use uma biblioteca real como jsQR
        const fakeQRDetection = () => {
          return Math.random() > 0.9 ? "" : null;
        };
        
        const qrCode = fakeQRDetection();
        if (qrCode) {
          // Quando um QR code é detectado, pausamos brevemente o scanner
          pauseScanning();
          onResult(qrCode);
          
          // Retomamos o scanning após um breve atraso
          setTimeout(() => {
            if (videoRef.current && streamRef.current) {
              resumeScanning();
            }
          }, 1500);
          
          return;
        }
      }
      
      animationRef.current = requestAnimationFrame(detectQR);
    };
    
    animationRef.current = requestAnimationFrame(detectQR);
  };
  
  // Pausar a detecção temporariamente
  const pauseScanning = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsScanning(false);
  };
  
  // Retomar a detecção
  const resumeScanning = () => {
    setIsScanning(true);
    startQRDetection();
  };

  // Inicializar a câmera quando o componente montar
  useEffect(() => {
    initCamera();
    
    // Limpar recursos quando o componente desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsScanning(false);
    };
  }, []);

  return (
    <div className="relative w-full h-64 bg-black rounded-md overflow-hidden">
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
          <div>
            <p className="mb-2 font-medium">Acesso à câmera negado</p>
            <p className="text-sm">Verifique as permissões do navegador</p>
            <button 
              className="mt-3 px-4 py-2 bg-primary text-white rounded-md text-sm"
              onClick={() => initCamera()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute inset-0 border-4 border-green-500 rounded-md pointer-events-none" />
    </div>
  );
};

const InventoryCount = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [countedQuantity, setCountedQuantity] = useState<number>(0);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [open, setOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<CountItem | null>(null);
  const [searchMode, setSearchMode] = useState<'manual' | 'qrcode'>('manual');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const productsRef = collection(db, "produtos");
      
      const nameQuery = query(
        productsRef,
        where("nome", ">=", searchTerm.toLowerCase()),
        where("nome", "<=", searchTerm.toLowerCase() + "\uf8ff"),
        limit(10)
      );
      
      const codeQuery = query(
        productsRef,
        where("codigo_estoque", ">=", searchTerm),
        where("codigo_estoque", "<=", searchTerm + "\uf8ff"),
        limit(5)
      );
      
      const materialQuery = query(
        productsRef,
        where("codigo_material", ">=", searchTerm),
        where("codigo_material", "<=", searchTerm + "\uf8ff"),
        limit(5)
      );
      
      const [nameSnapshot, codeSnapshot, materialSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(codeQuery),
        getDocs(materialQuery)
      ]);
      
      const results = new Map();
      
      [...nameSnapshot.docs, ...codeSnapshot.docs, ...materialSnapshot.docs].forEach((doc) => {
        if (!results.has(doc.id)) {
          results.set(doc.id, {
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      setSearchResults(Array.from(results.values()) as Product[]);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os produtos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQRCodeScan = (result: string) => {
    setSearchTerm(result);
    handleSearch();
  };

  const handleScannerError = (error: Error) => {
    toast({
      title: "Erro no scanner",
      description: error.message || "Não foi possível acessar a câmera",
      variant: "destructive"
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCountedQuantity(0);
  };

  const handleAddToCount = () => {
    if (!selectedProduct) return;
    
    const newItem: CountItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.nome,
      productCode: selectedProduct.codigo_estoque || selectedProduct.codigo_material || '',
      expectedQuantity: selectedProduct.quantidade || 0,
      countedQuantity: countedQuantity,
      difference: countedQuantity - (selectedProduct.quantidade || 0)
    };
    
    setCountItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === newItem.productId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      } else {
        return [...prev, newItem];
      }
    });
    
    setSelectedProduct(null);
    setCountedQuantity(0);
    setSearchTerm('');
    setSearchResults([]);
    setOpen(false);
    
    toast({
      title: "Produto adicionado",
      description: "Produto adicionado à contagem com sucesso.",
    });
  };

  const handleAdjustInventory = async (item: CountItem) => {
    if (!item || item.difference <= 0) return;
    setProductToAdjust(item);
  };

  const confirmAdjustInventory = async () => {
    if (!productToAdjust) return;
    
    setIsAdjusting(true);
    try {
      const productRef = doc(db, "produtos", productToAdjust.productId);
      
      await updateDoc(productRef, {
        quantidade: productToAdjust.countedQuantity,
        atualizado_em: serverTimestamp()
      });
      
      setCountItems(prev => 
        prev.map(item => 
          item.productId === productToAdjust.productId
            ? {
                ...item,
                expectedQuantity: productToAdjust.countedQuantity,
                difference: 0
              }
            : item
        )
      );
      
      toast({
        title: "Estoque atualizado",
        description: `O estoque de ${productToAdjust.productName} foi ajustado para ${productToAdjust.countedQuantity}.`,
      });
      
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
      toast({
        title: "Erro ao ajustar estoque",
        description: "Não foi possível atualizar o estoque do produto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAdjusting(false);
      setProductToAdjust(null);
    }
  };

  const handleSaveCount = async () => {
    if (countItems.length === 0) {
      toast({
        title: "Nenhum item para salvar",
        description: "Adicione pelo menos um produto à contagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const countRef = doc(collection(db, "contagem_estoque"));
      
      await setDoc(countRef, {
        data_contagem: serverTimestamp(),
        usuario_id: user?.uid || '',
        itens: countItems.map(item => ({
          produto_id: item.productId,
          produto_nome: item.productName,
          produto_codigo: item.productCode,
          quantidade_esperada: item.expectedQuantity,
          quantidade_contada: item.countedQuantity,
          diferenca: item.difference
        })),
        total_itens: countItems.length,
        status: "concluido"
      });
      
      setCountItems([]);
      
      toast({
        title: "Contagem salva",
        description: "A contagem de estoque foi salva com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar contagem:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a contagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCount = () => {
    setCountItems([]);
    toast({
      title: "Contagem zerada",
      description: "Todos os produtos foram removidos da contagem.",
    });
  };

  return (
    <Card className="mb-8 bg-card text-card-foreground">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Contagem de Estoque</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Compare quantidades esperadas com contagens físicas
        </CardDescription>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Contar Produto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background">
              <DialogHeader>
                <DialogTitle className="text-lg">Adicionar Produto à Contagem</DialogTitle>
                <DialogDescription className="text-sm">
                  Busque um produto por nome, código ou escaneie o QR Code
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="manual" className="w-full" onValueChange={(value) => setSearchMode(value as 'manual' | 'qrcode')}>
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="manual" className="flex items-center gap-1 text-sm">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Busca Manual</span>
                  </TabsTrigger>
                  <TabsTrigger value="qrcode" className="flex items-center gap-1 text-sm">
                    <ScanQrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4 py-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Nome ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 bg-background"
                    />
                    <Button 
                      onClick={handleSearch} 
                      disabled={isSearching || !searchTerm.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="qrcode" className="space-y-4 py-4">
                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-square max-w-xs bg-black rounded-lg overflow-hidden">
                      {searchMode === 'qrcode' && (
                        <QRScanner 
                          onResult={handleQRCodeScan}
                          onError={handleScannerError}
                        />
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Aponte a câmera para o QR Code do produto
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-md bg-background">
                  <Table>
                    <TableBody>
                      {searchResults.map((product) => (
                        <TableRow 
                          key={product.id}
                          className={`cursor-pointer hover:bg-accent ${selectedProduct?.id === product.id ? 'bg-accent' : ''}`}
                          onClick={() => handleSelectProduct(product)}
                        >
                          <TableCell className="font-medium p-2">{product.nome}</TableCell>
                          <TableCell className="p-2">{product.codigo_estoque || product.codigo_material || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedProduct && (
                <div className="space-y-2 border p-4 rounded-md bg-accent/10">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium">Produto:</p>
                      <p>{selectedProduct.nome}</p>
                    </div>
                    <div>
                      <p className="font-medium">Código:</p>
                      <p>{selectedProduct.codigo_estoque || selectedProduct.codigo_material || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Qtd. Esperada:</p>
                      <p>{selectedProduct.quantidade || 0}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="font-medium text-sm">Qtd. Contada:</label>
                    <Input 
                      type="number" 
                      min="0"
                      value={countedQuantity}
                      onChange={(e) => setCountedQuantity(Number(e.target.value))}
                      className="mt-1 bg-background"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button 
                  onClick={handleAddToCount}
                  disabled={!selectedProduct}
                  className="w-full sm:w-auto"
                >
                  Adicionar à Contagem
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col sm:flex-row gap-2">
            {countItems.length > 0 && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Zerar Contagem</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Zerar contagem?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover todos os produtos da contagem atual.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearCount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="default"
                  onClick={handleSaveCount}
                  disabled={isSaving}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Salvando..." : "Salvar"}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {countItems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-2 py-3">Produto</TableHead>
                  <TableHead className="px-2 py-3 hidden sm:table-cell">Código</TableHead>
                  <TableHead className="px-2 py-3 text-right">Esperado</TableHead>
                  <TableHead className="px-2 py-3 text-right">Contado</TableHead>
                  <TableHead className="px-2 py-3 text-right">Diferença</TableHead>
                  <TableHead className="px-2 py-3 hidden sm:table-cell">Status</TableHead>
                  <TableHead className="px-2 py-3 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-accent/10">
                    <TableCell className="px-2 py-2 font-medium">{item.productName}</TableCell>
                    <TableCell className="px-2 py-2 hidden sm:table-cell">{item.productCode || "N/A"}</TableCell>
                    <TableCell className="px-2 py-2 text-right">{item.expectedQuantity}</TableCell>
                    <TableCell className="px-2 py-2 text-right">{item.countedQuantity}</TableCell>
                    <TableCell className={`px-2 py-2 text-right font-medium ${
                      item.difference > 0 ? 'text-green-600 dark:text-green-400' : 
                      item.difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    }`}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </TableCell>
                    <TableCell className="px-2 py-2 hidden sm:table-cell">
                      <div className="flex items-center">
                        {item.difference === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                        )}
                        <span className="text-sm">
                          {item.difference === 0 ? 'Correto' : 'Divergente'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      {item.difference > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-2 text-xs sm:text-sm"
                              onClick={() => handleAdjustInventory(item)}
                            >
                              Ajustar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar ajuste</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ajustar estoque de "{item.productName}" para {item.countedQuantity} unidades?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={confirmAdjustInventory}
                                disabled={isAdjusting}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {isAdjusting ? "Processando..." : "Confirmar"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2 font-medium">Nenhum item adicionado</p>
            <p className="text-sm mt-1">Adicione produtos para começar a contagem</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryCount;