
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  Package, 
  FileText, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart2
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
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

const AppSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  
  // Em dispositivos móveis, o sidebar é recolhido por padrão
  const sidebarExpanded = isMobile ? false : expanded;

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <Sidebar expanded={sidebarExpanded}>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sidebarExpanded && (
            <img 
              src="/placeholder.svg" 
              alt="Fricó Alimentos" 
              className="h-8 w-8 rounded-md" 
            />
          )}
          {sidebarExpanded && <h1 className="text-lg font-bold">Fricó Alimentos</h1>}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {expanded ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Home size={20} />
                    {sidebarExpanded && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/produtos" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Package size={20} />
                    {sidebarExpanded && <span>Produtos</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/notas-fiscais" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <FileText size={20} />
                    {sidebarExpanded && <span>Notas Fiscais</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/relatorios" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <BarChart2 size={20} />
                    {sidebarExpanded && <span>Relatórios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/usuarios" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Users size={20} />
                    {sidebarExpanded && <span>Usuários</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/configuracoes" className={({isActive}) => isActive ? "text-primary" : ""}>
                    <Settings size={20} />
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
            {sidebarExpanded && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback>UA</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                  <span className="font-medium">Usuário</span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {sidebarExpanded && (
              <Button variant="ghost" size="icon" title="Sair">
                <LogOut size={18} />
              </Button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
