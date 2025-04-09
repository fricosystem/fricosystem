
import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = ({ title }: { title: string }) => {
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

  return (
    <header className="flex items-center justify-between py-4 px-6 bg-background border-b">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-8 w-full"
          />
        </div>

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
