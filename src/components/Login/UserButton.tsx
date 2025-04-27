import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User } from "firebase/auth";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { auth, db } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface UserButtonProps {
  user: User;
}

interface UserData {
  nome: string;
  cargo: string;
  imagem_perfil?: string;
}

export function UserButton({ user }: UserButtonProps) {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Erro ao desconectar",
        description: "Ocorreu um problema ao tentar sair do sistema.",
        variant: "destructive",
      });
    }
  };

  // Get user's initials for avatar fallback
  const getInitials = () => {
    if (userData?.nome) {
      const names = userData.nome.split(" ");
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "??";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={userData?.imagem_perfil || ""} 
              alt={userData?.nome || user.email || "User"} 
            />
            <AvatarFallback className="bg-frico-700 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData?.nome || user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData?.cargo || "Usuário"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
