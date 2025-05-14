// AppHeader.tsx — ajustado para evitar reabertura e garantir fechamento correto dos modais

import { useState, useEffect } from "react";
import { Bell, ShoppingCart, MessageSquare, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import ProductEditModal from "@/components/ProductEditModal";
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
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const [notifications, setNotifications] = useState([
    { id: 1, message: "Produto Arroz abaixo do estoque mínimo", time: "Agora mesmo" },
    { id: 2, message: "3 novas Notas Fiscais para processar", time: "5 minutos atrás" },
    { id: 3, message: "Feijão preto atingiu o estoque mínimo", time: "20 minutos atrás" }
  ]);

  // Mensagens não lidas
  useEffect(() => {
    if (!user?.uid) return;

    const updateUnreadCount = (unreadMessages: Record<string, number>) => {
      const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
      setTotalUnreadMessages(total);
    };

    const handleEditProduct = () => {
      setIsDetailsModalOpen(false);
      setTimeout(() => {
        setIsEditModalOpen(true);
      }, 300); // tempo para o modal de detalhes fechar suavemente
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

  // Carrinho
  useEffect(() => {
    if (!user?.email) return;

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
      // Scanner será fechado automaticamente via modal internamente, mas por segurança:
      setIsQrScannerOpen(false);

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

      // Garanta que o modal será aberto só depois que o estado for atualizado
      setScannedProduct(productData);
      setTimeout(() => setIsDetailsModalOpen(true), 100); // evita conflito de modais

    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Erro ao buscar produto",
        description: "Ocorreu um erro ao buscar as informações do produto",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = () => {
    setIsDetailsModalOpen(false);
    // Aqui você pode acionar outro modal ou navegação para edição, se quiser
  };

  return (
    <>
      <header className={`flex items-center justify-between py-4 px-6 bg-background border-b ${className}`}>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsQrScannerOpen(true)}
            title="Escanear QR Code"
          >
            <QrCode size={20} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/chat")}
            className="relative"
          >
            <MessageSquare size={20} />
            {totalUnreadMessages > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" variant="destructive">
                {totalUnreadMessages}
              </Badge>
            )}
          </Button>

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
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 cursor-pointer">
                  <div className="font-medium">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n.time}</div>
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

      {/* Product Details Modal */}
      {scannedProduct && (
        <ProductEditModal 
          product={scannedProduct}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default AppHeader;
