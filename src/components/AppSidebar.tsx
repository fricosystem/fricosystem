import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  ShoppingCart,
  PackageSearch,
  Warehouse,
  Receipt,
  Truck,
  FileText,
  Wallet,
  BarChart3,
  Users,
  Home,
  Settings,
  LogOut,
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

// Definindo a interface para os itens do sidebar
interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

// Definindo a interface para as categorias do sidebar
interface SidebarCategory {
  label: string;
  items: SidebarItem[];
}

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
  
  // Categorias do sidebar com seus respectivos itens
  const sidebarCategories: SidebarCategory[] = [
    {
      label: "Principal",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/produtos", icon: Box, label: "Produtos" },
        { to: "/requisicoes", icon: ClipboardList, label: "Requisições" },
        { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
      ],
    },
    {
      label: "Almoxarifado",
      items: [
        { to: "/inventory", icon: PackageSearch, label: "Inventário" },
        { to: "/addressing", icon: Warehouse, label: "Endereçamento" },
        { to: "/invoices", icon: Receipt, label: "Notas Fiscais" },
        { to: "/orders", icon: Truck, label: "Compras/Pedidos" },
        { to: "/transfer", icon: FileText, label: "Entrada/Transferência" },
      ],
    },
    {
      label: "Financeiro",
      items: [
        { to: "/financial", icon: Wallet, label: "Financeiro" },
        { to: "/cost-centers", icon: BarChart3, label: "Centros de Custo" },
        { to: "/suppliers", icon: Users, label: "Fornecedores" },
        { to: "/reports", icon: Home, label: "Relatórios" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { to: "/admin", icon: Settings, label: "Administrativo" },
        { to: "/settings", icon: Settings, label: "Configurações" },
      ],
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
          
          {/* Renderizar cada categoria do sidebar */}
          {sidebarCategories.map((category, index) => (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.to}
                        onClick={() => navigate(item.to)}
                        className="flex items-center"
                      >
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.label}</span>
                        {item.to === "/cart" && totalItens > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                            {totalItens}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
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
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
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