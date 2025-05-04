import { useState, useEffect } from "react";
import { Bell, Search, ShoppingCart, Mail, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
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

interface AppHeaderProps {
  title: string;
  className?: string;
}

const AppHeader = ({ title, className }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
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
      // Soma todas as mensagens não lidas de todos os contatos
      const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
      setTotalUnreadMessages(total);
    };

    // Carregar contagem inicial
    const loadInitialCount = async () => {
      try {
        const unreadMessages = await getUnreadMessagesCount(user.uid);
        updateUnreadCount(unreadMessages);
      } catch (error) {
        console.error("Erro ao carregar mensagens não lidas:", error);
      }
    };

    loadInitialCount();

    // Configurar listener para atualizações em tempo real
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

  return (
    <header className={`flex items-center justify-between py-4 px-6 bg-background border-b ${className}`}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Ícone de Chat com badge de mensagens não lidas */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/chat")}
          className="relative"
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

        {/* Carrinho button */}
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
  );
};

export default AppHeader;