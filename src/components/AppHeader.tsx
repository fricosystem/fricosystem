import { useState, useEffect } from "react";
import { Bell, Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext"; // Assumindo que você tem um contexto de autenticação
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Obtém o usuário atual
  const [cartItemsCount, setCartItemsCount] = useState(0);
  
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

  // Buscar a contagem de itens no carrinho do Firestore
  useEffect(() => {
    if (!user || !user.email) return;

    // Função para carregar a contagem inicial
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

    // Carregar a contagem inicial
    loadCartCount();

    // Configurar um listener para mudanças na coleção "carrinho"
    const carrinhoRef = collection(db, "carrinho");
    const q = query(carrinhoRef, where("email", "==", user.email));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCartItemsCount(snapshot.size);
    }, (error) => {
      console.error("Erro no listener do carrinho:", error);
    });

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [user]);

  return (
    <header className="flex items-center justify-between py-4 px-6 bg-background border-b">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
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