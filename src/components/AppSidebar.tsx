
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home, 
  Package, 
  FileText, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart2,
  Users,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const AppSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Em dispositivos móveis, o sidebar é recolhido por padrão
  const sidebarExpanded = isMobile ? false : expanded;

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  // Estado para verificar se o usuário atual é o admin bruno.bm3051@gmail.com
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [userRole, setUserRole] = useState("Admin");
  
  useEffect(() => {
    const userJson = localStorage.getItem("fricoUser");
    if (userJson) {
      const user = JSON.parse(userJson);
      setIsAdmin(user.email === "bruno.bm3051@gmail.com");
      // Se o usuário tiver um nome, usamos ele, caso contrário, extraímos do email
      if (user.nome) {
        setUserName(user.nome);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
      if (user.cargo) {
        setUserRole(user.cargo);
      }
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("fricoUser");
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  // Calcula o tamanho dos ícones com base no estado da barra lateral
  const iconSize = sidebarExpanded ? 20 : 24;

  return (
    <Sidebar className={sidebarExpanded ? "w-64" : "w-16"}>
      <SidebarHeader className="p-4 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center w-full">
          <img 
            src="/lovable-uploads/8c700a7c-8b6b-44bd-ba7c-d2a31d435fb1.png" 
            alt="Fricó Alimentos" 
            className={`${sidebarExpanded ? 'h-10 w-auto' : 'h-8 w-auto'} rounded-md`} 
          />
          {sidebarExpanded && <h1 className="text-lg font-bold mt-2">Fricó Alimentos</h1>}
          
          {/* Botão para expandir/recolher abaixo do ícone */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="mt-2 h-8 w-8"
          >
            {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={!sidebarExpanded ? "hidden" : ""}>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={sidebarExpanded ? undefined : "Dashboard"}
                >
                  <NavLink to="/dashboard" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Home size={iconSize} />
                    {sidebarExpanded && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={sidebarExpanded ? undefined : "Produtos"}
                >
                  <NavLink to="/produtos" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Package size={iconSize} />
                    {sidebarExpanded && <span>Produtos</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={sidebarExpanded ? undefined : "Notas Fiscais"}
                >
                  <NavLink to="/notas-fiscais" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <FileText size={iconSize} />
                    {sidebarExpanded && <span>Notas Fiscais</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={sidebarExpanded ? undefined : "Relatórios"}
                >
                  <NavLink to="/relatorios" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <BarChart2 size={iconSize} />
                    {sidebarExpanded && <span>Relatórios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={!sidebarExpanded ? "hidden" : ""}>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={sidebarExpanded ? undefined : "Administrativo"}
                  >
                    <NavLink to="/administrativo" className={({isActive}) => isActive ? "text-primary" : ""}>
                      <Users size={iconSize} />
                      {sidebarExpanded && <span>Administrativo</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={sidebarExpanded ? undefined : "Configurações"}
                >
                  <NavLink to="/configuracoes" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Settings size={iconSize} />
                    {sidebarExpanded && <span>Configurações</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sidebarExpanded ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                  <span className="font-medium truncate max-w-[120px]">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userRole}</span>
                </div>
              </>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Avatar" />
                <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle iconOnly={!sidebarExpanded} />
            <Button 
              variant="ghost" 
              size="icon" 
              title="Sair" 
              onClick={handleLogout}
            >
              <LogOut size={sidebarExpanded ? 18 : 20} />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
