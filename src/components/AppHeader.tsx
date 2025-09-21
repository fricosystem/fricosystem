import { useState, useEffect } from "react";
import { Bell, ShoppingCart, MessageSquare, QrCode, Barcode, Scan, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { subscribeToUserUnreadMessages, getUnreadMessagesCount } from "@/services/chatService";
import QrScanner from "@/components/QRScanner";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductDetails, { Product } from "@/components/ProductDetails";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  title: string;
  className?: string;
}

const AppHeader = ({ title, className }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      message: "Produto Arroz abaixo do estoque mínimo", 
      time: "Agora mesmo" 
    },
    { 
      id: 2, 
      message: "3 novas Notas Fiscais para processar", 
      time: "5 minutos atrás"
    },
    {
      id: 3,
      message: "Feijão preto atingiu o estoque mínimo",
      time: "20 minutos atrás"
    }
  ]);

  // Buscar e monitorar mensagens não lidas do usuário atual
  useEffect(() => {
    if (!user?.uid) return;

    const updateUnreadCount = (unreadMessages: Record<string, number>) => {
      const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
      setTotalUnreadMessages(total);
    };

    const loadInitialCount = async () => {
      try {
        const unreadMessages = await getUnreadMessagesCount(user.uid);
        updateUnreadCount(unreadMessages);
      } catch (error) {
        console.error("Erro ao carregar mensagens não lidas:", error);
      }
    };

    loadInitialCount();

    const unsubscribe = subscribeToUserUnreadMessages(user.uid, updateUnreadCount);
    return () => unsubscribe();
  }, [user?.uid]);

  // Buscar a contagem de itens no carrinho do Firestore
  useEffect(() => {
    if (!user || !user.email) return;

    const loadCartCount = async () => {
      try {
        const carrinhoRef = collection(db, "carrinho");
        const q = query(carrinhoRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        setCartItemsCount(querySnapshot.size);
      } catch (error) {
        console.error("Erro ao buscar contagem do carrinho:", error);
      }
    };

    loadCartCount();

    const carrinhoRef = collection(db, "carrinho");
    const q = query(carrinhoRef, where("email", "==", user.email));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCartItemsCount(snapshot.size);
    }, (error) => {
      console.error("Erro no listener do carrinho:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCodeScanned = async (code: string) => {
    try {
      setIsQrScannerOpen(false); // Fecha o scanner imediatamente
      
      const productQuery = query(
        collection(db, "produtos"),
        where("codigo_estoque", "==", code)
      );
      
      const querySnapshot = await getDocs(productQuery);
      
      if (querySnapshot.empty) {
        toast({
          title: "Produto não encontrado",
          description: `Não foi possível encontrar o produto com o código ${code}`,
          variant: "destructive"
        });
        return;
      }
      
      const productData = querySnapshot.docs[0].data() as Product;
      setScannedProduct(productData);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Erro ao buscar produto",
        description: "Ocorreu um erro ao buscar as informações do produto",
        variant: "destructive"
      });
    } finally {
      // Garante que o scanner seja reiniciado completamente
      setIsQrScannerOpen(false);
    }
  };

  const handleEditProduct = () => {
    setIsDetailsModalOpen(false);
    // You can implement edit functionality here if needed
    // For now, we'll just close the details modal
  };

  return (
    <>
      <header className={`flex items-center justify-between py-4 px-6 bg-background border-b ${className}`}>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Scanner Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Opções de Scanner"
              >
                <Scan size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Opções de Scanner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsQrScannerOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Barcode className="h-4 w-4" />
                GTIN/EAN (Código de Barras)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Communication Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate("/chat")}
            title="Comunicação"
          >
            <MessageSquare size={20} />
            {totalUnreadMessages > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {totalUnreadMessages}
              </Badge>
            )}
          </Button>

          {/* Cart Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate("/carrinho")}
          >
            <ShoppingCart size={20} />
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {cartItemsCount}
              </Badge>
            )}
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </div>
                </DropdownMenuItem>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma notificação no momento
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* QR Scanner Modal */}
      <QrScanner 
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onCodeScanned={handleCodeScanned}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner 
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onCodeScanned={handleCodeScanned}
      />

      {/* Product Details Modal */}
      {scannedProduct && (
        <ProductDetails 
          product={scannedProduct}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onEdit={handleEditProduct}
        />
      )}
    </>
  );
};

export default AppHeader;