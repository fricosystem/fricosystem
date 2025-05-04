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
  BarChart,
  ShoppingCart,
  PackageSearch,
  Warehouse,
  Wallet,
  Receipt,
  Truck,
  FileText,
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
  Layers,
  Boxes,
  Building2,
  Network,
  BadgePercent,
  Monitor,
  HardHat,
  ArrowLeftRight,
  ArchiveRestore,
  Briefcase,
  Package,
  CheckSquare
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
import { AnimatePresence, motion } from "framer-motion";

interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface SidebarCategory {
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { totalItens } = useCarrinho();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };
  
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    
    sidebarCategories.forEach((category) => {
      const shouldExpand = category.items.some(item => location.pathname === item.to);
      initialExpandedState[category.label] = shouldExpand;
    });
    
    setExpandedCategories(initialExpandedState);
  }, [location.pathname]);
  
  useEffect(() => {
    const loadTheme = async () => {
      const userEmail = getUserEmail();
      if (!userEmail) return;
      
      try {
        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          if (userDoc.data().tema) {
            const savedTheme = userDoc.data().tema as "light" | "dark";
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
          } else {
            const defaultTheme = "dark";
            setTheme(defaultTheme);
            document.documentElement.classList.toggle("dark", defaultTheme === "dark");
            await setDoc(doc(db, "usuarios", userDoc.id), { tema: defaultTheme }, { merge: true });
          }
        } else {
          const defaultTheme = "dark";
          setTheme(defaultTheme);
          document.documentElement.classList.toggle("dark", defaultTheme === "dark");
          const newUserDocRef = doc(collection(db, "usuarios"));
          await setDoc(newUserDocRef, { 
            email: userEmail, 
            tema: defaultTheme 
          });
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const fallbackTheme = prefersDark ? "dark" : "light";
        setTheme(fallbackTheme);
        document.documentElement.classList.toggle("dark", fallbackTheme === "dark");
      }
    };
    
    loadTheme();
    
    const addRobotoFont = () => {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
      document.head.appendChild(fontLink);
      document.body.style.fontFamily = '"Roboto", sans-serif';
    };
    
    addRobotoFont();
  }, [user]);

  const toggleTheme = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    const newTheme = theme === "light" ? "dark" : "light";
    
    try {
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, "usuarios", userDoc.id), { tema: newTheme }, { merge: true });
      } else {
        const newUserDocRef = doc(collection(db, "usuarios"));
        await setDoc(newUserDocRef, { 
          email: userEmail, 
          tema: newTheme 
        });
      }
      
      toast({
        description: `Tema alterado para ${newTheme === "light" ? "claro" : "escuro"}`,
        duration: 2000,
      });
    } catch (error) {
      setTheme(theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      toast({
        description: "Erro ao salvar preferência de tema. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const toggleCategoryExpansion = (categoryLabel: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel]
    }));
  };

  const sidebarCategories: SidebarCategory[] = [
    {
      label: "Principal",
      icon: Layers,
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/requisicoes", icon: ClipboardList, label: "Requisições" },
        { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
      ],
    },
    {
      label: "Estoque",
      icon: Boxes,
      items: [
        { to: "/produtos", icon: Box, label: "Produtos" },
        { to: "/inventory", icon: PackageSearch, label: "Inventário" },
        { to: "/enderecamento", icon: Warehouse, label: "Endereçamento" },
        { to: "/entradaProdutosET", icon: ArchiveRestore, label: "Entrada Manual" },
        { to: "/transferenciasET", icon: ArrowLeftRight, label: "Transferência" },
      ],
    },
    {
      label: "Operacional",
      icon: Network,
      items: [
        { to: "/ordensServico", icon: Clipboard, label: "Ordens de Serviço" },
        { to: "/compras", icon: Truck, label: "Compras" },
        { to: "/pedidos", icon: Truck, label: "Pedidos" },
        { to: "/notas-fiscais", icon: Receipt, label: "Notas Fiscais" },
      ],
    },
    {
      label: "Produção",
      icon: Factory,
      items: [
        { to: "/producao", icon: BarChart, label: "Dashboard Prod" },
        { to: "/producao/planejamento", icon: ClipboardCheck, label: "Planejamento" },
        { to: "/producao/planejamentoDiarioProducao", icon: Calendar, label: "Planejamento Diário" },
        { to: "/producao/produtosProducao", icon: Package, label: "Produtos Produção" },
        { to: "/producao/produtosFinaisProducao", icon: CheckSquare, label: "Produtos Finais" },
      ],
    },
    {
      label: "Recursos Humanos",
      icon: HardHat,
      items: [
        { to: "/rh/funcionarios", icon: UserRound, label: "Funcionários" },
        { to: "/rh/ponto", icon: Calendar, label: "Ponto Eletrônico" },
        { to: "/rh/treinamentos", icon: GraduationCap, label: "Treinamentos" },
      ],
    },
    {
      label: "Financeiro",
      icon: Wallet,
      items: [
        { to: "/financial", icon: Wallet, label: "Financeiro" },
        { to: "/cost-centers", icon: BarChart3, label: "Centros de Custo" },
        { to: "/fornecedores", icon: Users, label: "Fornecedores" },
        { to: "/relatorios", icon: Home, label: "Relatórios" },
      ],
    },
    {
      label: "Sistema",
      icon: Monitor,
      items: [
        { to: "/configuracoes", icon: Settings, label: "Configurações" },
      ],
    },
  ];

  const adminCategory: SidebarCategory = {
    label: "Administrativo",
    icon: Settings,
    items: [
      { to: "/administrativo/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/administrativo/produtos", icon: Box, label: "Produtos" },
      { to: "/administrativo/fornecedores", icon: Users, label: "Fornecedores" },
      { to: "/administrativo/depositos", icon: Warehouse, label: "Depósitos" },
      { to: "/administrativo/unidades", icon: Building2, label: "Unidades" },
      { to: "/administrativo/usuarios", icon: UserRound, label: "Usuários" },
    ],
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
      toast({
        description: "Logout realizado com sucesso!",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      toast({
        description: "Erro ao sair do sistema. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getUserInitial = () => {
    if (userData?.nome) {
      return userData.nome.charAt(0).toUpperCase();
    } else if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (userData?.nome) {
      return userData.nome;
    } else if (user?.displayName) {
      return user.displayName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Usuário";
  };

  const getUserCargo = () => {
    if (userData?.cargo) {
      return userData.cargo;
    }
    return "";
  };

  const contentVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3 }
    }
  };

  const categoryBtnClasses = `
    flex items-center justify-between px-3 h-10 cursor-pointer transition-all duration-200
    rounded-md mx-1 my-0.5 font-medium
  `;

  const firebaseClasses = {
    sidebar: "bg-[#111827] border-none",
    categoryBtn: {
      active: 'bg-[#0e7490] text-white',
      hover: 'hover:bg-[#0e7490] text-gray-300 hover:text-white'
    },
    menuItem: {
      active: 'bg-[#0e7490] text-white',
      hover: 'hover:bg-[#0e7490] text-gray-300 hover:text-white'
    },
    userProfile: {
      bg: "bg-[#0e7490]",
      text: "text-white",
      mutedText: "text-gray-400"
    },
    dropdownMenu: "bg-[#0e7490] border-[#0891b2]",
    text: {
      heading: "font-medium",
      normal: "font-normal",
      small: "text-sm font-medium",
      tiny: "text-xs font-medium"
    }
  };

  const isAdmin = userData?.cargo === "ADMINISTRATIVO";

  return (
    <Sidebar className="border-r border-[#2b3341]">
      <SidebarContent>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            .font-poppins, .font-poppins * {
              font-family: 'Poppins', sans-serif;
              letter-spacing: 0.02em;
              font-size: 0.9rem;
            }
            
            .font-poppins .text-sm {
              font-weight: 600;
            }
            
            .font-poppins .text-xs {
              font-weight: 600;
            }
            
            .font-poppins .font-medium {
              font-weight: 600;
            }
            
            :root:not(.dark) .font-poppins {
              color: #333333;
            }
            
            :root:not(.dark) .text-gray-300 {
              color: #333333 !important;
            }
            
            :root:not(.dark) .text-gray-400 {
              color: #555555 !important;
            }
            
            :root:not(.dark) .text-gray-500 {
              color: #666666 !important;
            }
            
            :root:not(.dark) .hover\\:bg-\\[\\#2c384a\\]:hover {
              background-color: #e0e0e0 !important;
            }
            
            :root:not(.dark) .bg-\\[\\#2c384a\\] {
              background-color: #f0f0f0 !important;
            }
            
            :root:not(.dark) .bg-\\[\\#1c2834\\] {
              background-color: #ffffff !important;
            }
            
            :root:not(.dark) .border-\\[\\#3e4a5e\\] {
              border-color: #dddddd !important;
            }
          `}
        </style>
        <SidebarGroup>
          <div className="flex flex-col items-center justify-center px-1 py-2">
            <img 
              src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" 
              className="w-16 h-16 rounded-lg object-scale-down" 
            />
          </div>
          
          <div className="overflow-y-auto flex-grow" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {sidebarCategories.map((category, index) => (
              <SidebarGroup key={index}>
                <div 
                  className={`${categoryBtnClasses} ${
                    expandedCategories[category.label] 
                      ? firebaseClasses.categoryBtn.active
                      : firebaseClasses.categoryBtn.hover
                  } ${firebaseClasses.text.normal}`}
                  onClick={() => toggleCategoryExpansion(category.label)}
                >
                  <div className="flex items-center gap-1">
                    <category.icon className="h-5 w-5" />
                    <SidebarGroupLabel className="flex-1 text-1xl font-bold">{category.label}</SidebarGroupLabel>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedCategories[category.label] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {expandedCategories[category.label] && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={contentVariants}
                      className="overflow-hidden"
                    >
                      <SidebarGroupContent className="pl-8 pr-1 mt-0.4">
                        <SidebarMenu>
                          {category.items.map((item) => (
                            <SidebarMenuItem key={item.to}>
                              <SidebarMenuButton
                                isActive={location.pathname === item.to}
                                onClick={() => navigate(item.to)}
                                className={`flex items-center h-10 transition-all duration-200 rounded-md ${
                                  location.pathname === item.to 
                                    ? firebaseClasses.menuItem.active 
                                    : firebaseClasses.menuItem.hover
                                }`}
                              >
                                <item.icon className="mr-2 h-6 w-6" />
                                <span className="flex-1 text-1xl font-bold">{item.label}</span>
                                {item.to === "/carrinho" && totalItens > 0 && (
                                  <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#ff7a59] rounded-full">
                                    {totalItens}
                                  </span>
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarGroup>
            ))}

            {/* Renderiza a categoria Administrativo apenas para admins */}
            {isAdmin && (
              <SidebarGroup key="admin">
                <div 
                  className={`${categoryBtnClasses} ${
                    expandedCategories[adminCategory.label] 
                      ? firebaseClasses.categoryBtn.active
                      : firebaseClasses.categoryBtn.hover
                  } ${firebaseClasses.text.normal}`}
                  onClick={() => toggleCategoryExpansion(adminCategory.label)}
                >
                  <div className="flex items-center gap-1">
                    <adminCategory.icon className="h-5 w-5" />
                    <SidebarGroupLabel className="flex-1 text-1xl font-bold">{adminCategory.label}</SidebarGroupLabel>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedCategories[adminCategory.label] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {expandedCategories[adminCategory.label] && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={contentVariants}
                      className="overflow-hidden"
                    >
                      <SidebarGroupContent className="pl-8 pr-1 mt-0.4">
                        <SidebarMenu>
                          {adminCategory.items.map((item) => (
                            <SidebarMenuItem key={item.to}>
                              <SidebarMenuButton
                                isActive={location.pathname === item.to}
                                onClick={() => navigate(item.to)}
                                className={`flex items-center h-10 transition-all duration-200 rounded-md ${
                                  location.pathname === item.to 
                                    ? firebaseClasses.menuItem.active 
                                    : firebaseClasses.menuItem.hover
                                }`}
                              >
                                <item.icon className="mr-2 h-6 w-6" />
                                <span className="flex-1 text-1xl font-bold">{item.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarGroup>
            )}
          </div>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className={`flex items-center justify-center w-full p-4 h-12 ${firebaseClasses.menuItem.hover} rounded-md mx-auto my-1`}>
                      <div className="flex items-center justify-center space-x-2 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff7a59] text-white shrink-0">
                          {getUserInitial()}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`font-medium text-xs text-gray-300 truncate w-full ${firebaseClasses.text.small}`}>{getDisplayName()}</span>
                        </div>
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`w-64 bg-[#2c384a] border-[#3e4a5e] text-gray-300 ${firebaseClasses.text.normal}`}>
                    <div className="p-2 border-b border-[#3e4a5e]">
                      <p className="font-bold text-sm">{getDisplayName()}</p>
                      <p className="text-xs text-gray-400">{user?.email || ""}</p>
                      {getUserCargo() && (
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {getUserCargo()}
                        </p>
                      )}
                    </div>
                    <DropdownMenuItem onClick={toggleTheme} className="hover:bg-[#3e4a5e] focus:bg-[#3e4a5e] p-2">
                      {theme === "light" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      <span>Mudar para tema {theme === "light" ? "escuro" : "claro"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="hover:bg-[#3e4a5e] focus:bg-[#3e4a5e] p-2">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#3e4a5e]" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-[#ff7a59] hover:bg-[#3e4a5e] focus:bg-[#3e4a5e] p-2">
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