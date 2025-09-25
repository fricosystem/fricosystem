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
  ChevronDown,
  Clipboard,
  Factory,
  LineChart,
  UserRound,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  Shield,
  CheckCircle,
  AlertTriangle,
  Award,
  Target,
  Microscope,
  Monitor,
  Server,
  HardDrive,
  Database,
  Activity,
  Lock,
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
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

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
  const { user, logout } = useAuth();
  const { totalItens } = useCarrinho();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { toast } = useToast();
  
  // Estado para controlar quais categorias estão expandidas
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Função auxiliar para obter o email do usuário de forma segura
  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };
  
  // Carrega o tema do Firestore quando o componente montar
  useEffect(() => {
    const loadTheme = async () => {
      const userEmail = getUserEmail();
      if (!userEmail) return;
      
      try {
        // Busca o documento do usuário baseado no email
        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Usuário encontrado pelo email
          const userDoc = querySnapshot.docs[0];
          if (userDoc.data().tema) {
            const savedTheme = userDoc.data().tema as "light" | "dark";
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
          } else {
            // Documento existe mas não tem tema definido
            const defaultTheme = "dark";
            setTheme(defaultTheme);
            document.documentElement.classList.toggle("dark", defaultTheme === "dark");
            
            // Atualiza o documento existente com o tema padrão
            await setDoc(doc(db, "usuarios", userDoc.id), { tema: defaultTheme }, { merge: true });
          }
        } else {
          // Usuário não encontrado, cria novo documento
          const defaultTheme = "dark";
          setTheme(defaultTheme);
          document.documentElement.classList.toggle("dark", defaultTheme === "dark");
          
          // Cria um novo documento de usuário com email e tema
          const newUserDocRef = doc(collection(db, "usuarios"));
          await setDoc(newUserDocRef, { 
            email: userEmail, 
            tema: defaultTheme 
          });
        }
      } catch (error) {
        console.error("Erro detalhado ao carregar tema:", error);
        
        // Em caso de erro, usa o tema baseado na preferência do sistema
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const fallbackTheme = prefersDark ? "dark" : "light";
        setTheme(fallbackTheme);
        document.documentElement.classList.toggle("dark", fallbackTheme === "dark");
      }
    };
    
    loadTheme();
    
    // Inicializa as categorias expandidas com base na rota atual
    const initialExpandedState: Record<string, boolean> = {};
    sidebarCategories.forEach(category => {
      const hasActiveItem = category.items.some(item => location.pathname === item.to);
      initialExpandedState[category.label] = hasActiveItem;
    });
    setExpandedCategories(initialExpandedState);
  }, [user, location.pathname]);
  
  // Função para alternar o tema
  const toggleTheme = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    const newTheme = theme === "light" ? "dark" : "light";
    
    try {
      // Atualiza o tema na interface primeiro (para resposta imediata)
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      
      // Busca o documento do usuário baseado no email
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Atualiza o documento existente
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, "usuarios", userDoc.id), { tema: newTheme }, { merge: true });
      } else {
        // Cria um novo documento se por algum motivo não existir
        const newUserDocRef = doc(collection(db, "usuarios"));
        await setDoc(newUserDocRef, { 
          email: userEmail, 
          tema: newTheme 
        });
      }
      
      // Notifica o usuário sobre a mudança de tema
      toast({
        description: `Tema alterado para ${newTheme === "light" ? "claro" : "escuro"}`,
        duration: 2000,
      });
    } catch (error) {
      
      // Em caso de erro, reverte para o tema anterior
      setTheme(theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      
      toast({
        description: "Erro ao salvar preferência de tema. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Função para alternar a expansão de uma categoria
  const toggleCategory = (categoryLabel: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel]
    }));
  };
  
  // Categorias do sidebar com seus respectivos itens
  const sidebarCategories: SidebarCategory[] = [
    {
      label: "Principal",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/requisicoes", icon: ClipboardList, label: "Requisições" },
        { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
      ],
    },
    {
      label: "Estoque",
      items: [
        { to: "/produtos", icon: Box, label: "Produtos" },
        { to: "/inventory", icon: PackageSearch, label: "Inventário" },
        { to: "/enderecamento", icon: Warehouse, label: "Endereçamento" },
        { to: "/transfer", icon: FileText, label: "Entrada/Transferência" },
      ],
    },
    {
      label: "Operacional",
      items: [
        { to: "/ordensServico", icon: Clipboard, label: "Ordens de Serviço" },
        { to: "/orders", icon: Truck, label: "Compras/Pedidos" },
        { to: "/notas-fiscais", icon: Receipt, label: "Notas Fiscais" },
      ],
    },
    {
      label: "Produção",
      items: [
        { to: "/producao", icon: Factory, label: "Produção" },
        { to: "/linhas-producao", icon: LineChart, label: "Linhas de Produção" },
        { to: "/planejamento-producao", icon: ClipboardCheck, label: "Planejamento" },
      ],
    },
    {
      label: "Recursos Humanos",
      items: [
        { to: "/rh/funcionarios", icon: UserRound, label: "Funcionários" },
        { to: "/rh/ponto", icon: Calendar, label: "Ponto Eletrônico" },
        { to: "/rh/treinamentos", icon: GraduationCap, label: "Treinamentos" },
      ],
    },
    {
      label: "Financeiro",
      items: [
        { to: "/financial", icon: Wallet, label: "Financeiro" },
        { to: "/cost-centers", icon: BarChart3, label: "Centros de Custo" },
        { to: "/centro-custo", icon: BarChart3, label: "Centro de Custo" },
        { to: "/suppliers", icon: Users, label: "Fornecedores" },
        { to: "/relatorios", icon: Home, label: "Relatórios" },
      ],
    },
    {
      label: "Controle de Qualidade",
      items: [
        { to: "/qualidade/inspecoes", icon: CheckCircle, label: "Inspeções" },
        { to: "/qualidade/auditorias", icon: Shield, label: "Auditorias" },
        { to: "/qualidade/nao-conformidades", icon: AlertTriangle, label: "Não Conformidades" },
        { to: "/qualidade/certificacoes", icon: Award, label: "Certificações" },
        { to: "/qualidade/calibracoes", icon: Target, label: "Calibrações" },
        { to: "/qualidade/laboratorio", icon: Microscope, label: "Laboratório" },
      ],
    },
    {
      label: "T.I",
      items: [
        { to: "/ti/sistemas", icon: Monitor, label: "Sistemas" },
        { to: "/ti/infraestrutura", icon: Server, label: "Infraestrutura" },
        { to: "/ti/backup", icon: HardDrive, label: "Backup" },
        { to: "/ti/banco-dados", icon: Database, label: "Banco de Dados" },
        { to: "/ti/monitoramento", icon: Activity, label: "Monitoramento" },
        { to: "/ti/seguranca", icon: Lock, label: "Segurança" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { to: "/administrativo", icon: Settings, label: "Administrativo" },
        { to: "/configuracoes", icon: Settings, label: "Configurações" },
      ],
    },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  // Obter a primeira letra do nome do usuário ou do email
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Obter o nome de exibição
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Usuário";
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex justify-center py-4">
            <img
              src="/Uploads/IconeFrico3D.png"
              alt="Logo"
              className="h-12 w-auto rounded-md"
            />
          </div>
          
          {/* Renderizar cada categoria do sidebar com botões expansíveis */}
          {sidebarCategories.map((category, index) => (
            <div key={index} className="mb-2">
              <button
                onClick={() => toggleCategory(category.label)}
                className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                <span className="font-medium text-sm">{category.label}</span>
                {expandedCategories[category.label] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {expandedCategories[category.label] && (
                <SidebarMenu className="pl-2">
                  {category.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.to}
                        onClick={() => navigate(item.to)}
                        className="flex items-center"
                      >
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.label}</span>
                        {item.to === "/carrinho" && totalItens > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                            {totalItens}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </div>
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
                          {getUserInitial()}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">{getDisplayName()}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {user?.email || ""}
                          </span>
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