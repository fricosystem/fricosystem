
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Package,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ShoppingCart,
  Users,
  ClipboardList,
  Sun,
  Moon,
  ChevronUp,
} from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { totalItens } = useCarrinho();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };
  
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Produtos",
      url: "/produtos",
      icon: Package,
    },
    {
      title: "Requisições",
      url: "/requisicoes",
      icon: ClipboardList,
    },
    {
      title: "Notas Fiscais",
      url: "/notas-fiscais",
      icon: FileText,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
    },
    {
      title: "Administrativo",
      url: "/administrativo",
      icon: Users,
    },
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex justify-center py-4">
            <img
              src="/lovable-uploads/8c700a7c-8b6b-44bd-ba7c-d2a31d435fb1.png"
              alt="Logo"
              className="h-10 w-auto"
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className="flex items-center"
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/carrinho"}
                  onClick={() => navigate("/carrinho")}
                  className="flex items-center"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span>Carrinho</span>
                  {totalItens > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                      {totalItens}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* User Profile Dropdown */}
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-2">
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">{user?.email?.split('@')[0] || "Usuário"}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email || ""}</span>
                        </div>
                      </div>
                      <ChevronUp className="h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === "light" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      <span>Mudar para tema {theme === "light" ? "escuro" : "claro"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
