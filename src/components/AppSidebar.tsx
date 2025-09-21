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
    Layers,
    Home,
    Boxes,
    Package,
    ClipboardList,
    Truck,
    Warehouse,
    ShoppingCart,
    AlertTriangle,
    FileText,
    Users,
    Wallet,
    TrendingUp,
    Settings,
    FileSpreadsheet,
    ListChecks,
    PackagePlus,
    Ruler,
    Wrench,
    ShoppingBag,
    Factory,
    Receipt,
    CalendarCheck,
    PieChart,
    Bell,
    PackageSearch,
    Download,
    Database,
    LogOut,
    Sun,
    Moon,
    ChevronUp,
    ChevronDown,
    UserRound,
    Briefcase,
    Building2,
    // Novos Ã­cones especÃ­ficos
    BarChart3,
    ShoppingBasket,
    Scan,
    FileInput,
    ReceiptText,
    ArrowRightLeft,
    MapPin,
    TreePine,
    FileOutput,
    ClipboardCheck,
    RotateCcw,
    UserCheck,
    Building,
    DollarSign,
    Calculator,
    Upload,
    Shield,
    Cog,
    PackageCheck,
    Gavel,
    MessageSquare,
    Mail,
    Calendar,
    Code,
    Monitor
  } from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useEffect, useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badgeCount?: number;
  permission?: string;
}

interface SidebarCategory {
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
  badgeCount?: number;
}

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { totalItens } = useCarrinho();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const isAdmin = userData?.cargo === "DESENVOLVEDOR";
  const isDesenvolvedor = userData?.cargo === "DESENVOLVEDOR";
  
  // Verifica se o usuÃ¡rio estÃ¡ ativo
  useEffect(() => {
    if (userData?.ativo === "nÃ£o") {
      navigate("/bem-vindo");
      toast({
        title: "Conta inativa",
        description: "Sua conta está inativa. Entre em contato com o administrador.",
        variant: "destructive",
      });
    }
  }, [userData, navigate, toast]);

  // Filtra os itens do sidebar baseado nas permissÃµes do usuÃ¡rio
  const filterItemsByPermission = (items: SidebarItem[]) => {
    if (!userData?.permissoes) return items;
    // Se o usuÃ¡rio tem permissÃ£o "tudo", retorna todos os itens
    if (userData.permissoes.includes("tudo")) return items;
    // Caso contrÃ¡rio, filtra normalmente
    return items.filter(item => {
      // Se nÃ£o tem permissÃ£o definida, permite acesso
      if (!item.permission) return true;
      // Verifica se a permissÃ£o estÃ¡ no array de permissÃµes do usuÃ¡rio
      return userData.permissoes.includes(item.permission);
    });
  };

  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };

  // FunÃ§Ã£o para filtrar categorias que tenham pelo menos um item válido
  const filterCategoriesWithItems = (categories: SidebarCategory[]) => {
    return categories
      .map(category => ({
        ...category,
        items: filterItemsByPermission(category.items)
      }))
      .filter(category => category.items.length > 0); // Remove categorias vazias
  };

  const allSidebarCategories: SidebarCategory[] = useMemo(() => [
    {
      label: "Principal",
      icon: Layers,
      items: [
        { to: "/dashboard", icon: BarChart3, label: "Dashboard Geral", permission: "dashboard" },
        { to: "/fornecedor-produtos", icon: ShoppingBasket, label: "Ordens de Compra", permission: "ordens_compra" },
      ],
    },
    {
      label: "Estoque",
      icon: Boxes,
      items: [
         { to: "/produtos", icon: PackageCheck, label: "Produtos", permission: "produtos" },
         { to: "/inventario", icon: Scan, label: "Inventário", permission: "inventario" },
        { to: "/entrada-manual", icon: PackagePlus, label: "Entrada Manual", permission: "entrada_manual" },
        { to: "/notas-fiscais", icon: FileInput, label: "NF - Entrada XML", permission: "notas_fiscais" },
        { to: "/transferencia", icon: ArrowRightLeft, label: "Transferência", permission: "transferencia" },
        { to: "/enderecamento", icon: MapPin, label: "Endereçamento", permission: "enderecamento" },
        { to: "/medida-de-lenha", icon: TreePine, label: "Cubagem e medida de Lenha", permission: "medida_lenha" },
        { to: "/relatorios", icon: FileSpreadsheet, label: "Relatórios", permission: "relatorios" },
      ],
    },
    {
      label: "Requisições",
      icon: ClipboardList,
      items: [
        { to: "/requisicoes", icon: ClipboardCheck, label: "Requisições", badgeCount: pendingRequestsCount, permission: "requisicoes" },
        { to: "/carrinho", icon: ShoppingCart, label: "Carrinho", permission: "carrinho" },
        { to: "/ordensServico", icon: Wrench, label: "Ordens de Serviço", permission: "ordens_servico" },
        { to: "/devolucao", icon: RotateCcw, label: "Devoluções", permission: "devolucoes" },
      ],
    },
    {
      label: "Compras",
      icon: ShoppingCart,
      items: [
        { to: "/compras", icon: ShoppingBag, label: "Compras", permission: "compras" },
        { to: "/fornecedores", icon: Building, label: "Fornecedores", permission: "fornecedores" },
      ],
    },
    {
      label: "Financeiro",
      icon: Wallet,
      items: [
        { to: "/notas-fiscais-lancamento", icon: ReceiptText, label: "NF - Lançamento", permission: "notas_fiscais_lancamento" },
        { to: "/centro-custo", icon: PieChart, label: "Centro de Custo", permission: "centro_custo" },
      ],
    },
    {
      label: "Utilitários",
      icon: FileText,
      items: [
        { to: "/importar-planilha", icon: Upload, label: "Importar dados", permission: "importar_dados" },
      ],
    },
    {
      label: "Produção",
      icon: Factory,
      items: [
        { to: "/pcp", icon: TrendingUp, label: "PCP", permission: "pcp" },
      ],
    },
    {
      label: "Comunicação",
      icon: MessageSquare,
      items: [
        { to: "/chat", icon: MessageSquare, label: "Chat", permission: "chat" },
        { to: "/email", icon: Mail, label: "Email", permission: "email" },
        { to: "/reunioes", icon: Calendar, label: "Reuniões", permission: "reunioes" },
      ],
    },
    ...(isAdmin ? [{
      label: "Administrativo",
      icon: Settings,
      items: [
        { to: "/gestao-usuarios", icon: UserCheck, label: "Gestão de Usuários", permission: "gestao_usuarios" },
        { to: "/gestao-produtos", icon: Cog, label: "Gestão de Produtos", permission: "gestao_produtos" },
        { to: "/unidades", icon: Building2, label: "Gestão de Unidades", permission: "gestao_unidades" },
      ],
    }] : []),
    ...(isDesenvolvedor ? [{
      label: "Desenvolvedor",
      icon: Code,
      items: [
        { to: "/planejamento-desenvolvimento", icon: ClipboardList, label: "Planejamento", permission: "planejamento_desenvolvimento" },
        { to: "/ide", icon: Monitor, label: "IDE", permission: "ide" },
      ],
    }] : []),
  ], [pendingRequestsCount, isAdmin, isDesenvolvedor]);

  // Aplicar filtro para mostrar apenas categorias que tenham itens vÃ¡lidos
  const sidebarCategories = useMemo(() => 
    filterCategoriesWithItems(allSidebarCategories), 
    [allSidebarCategories, userData?.permissoes]
  );
  
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    
    sidebarCategories.forEach((category) => {
      const shouldExpand = category.items.some(item => location.pathname === item.to);
      initialExpandedState[category.label] = shouldExpand;
    });
    
    setExpandedCategories(initialExpandedState);
  }, [location.pathname, sidebarCategories]);

  useEffect(() => {
    if (!user || !userData?.unidade) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "requisicoes"),
        where("unidade", "==", userData.unidade)
      ),
      (snapshot) => {
        let count = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.solicitante && Array.isArray(data.solicitante)) {
            const hasPending = data.solicitante.some((item: any) => 
              item.status && item.status.toLowerCase() === "pendente"
            );
            if (hasPending) count++;
          }
        });
        setPendingRequestsCount(count);
      },
      (error) => {
        console.error("Erro ao monitorar requisições pendentes:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar requisições pendentes",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [user, userData?.unidade]);
  
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

  const getUserUnidade = () => {
    if (userData?.unidade) {
      return userData.unidade;
    }
    return "";
  };
  
  const toggleCategoryExpansion = (categoryLabel: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel]
    }));
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
            className="w-20 h-20 rounded-xl object-scale-down" 
          />
        </div>
          
          <div className="overflow-y-auto flex-grow" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {sidebarCategories.map((category, index) => (
              <SidebarGroup key={index}>
                {category.items.length > 0 && (
                  <>
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
                        {category.badgeCount && category.badgeCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#ff7a59] rounded-full">
                            {category.badgeCount}
                          </span>
                        )}
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
                                    {item.to === "/requisicoes" && pendingRequestsCount > 0 && (
                                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#ff7a59] rounded-full">
                                        {pendingRequestsCount}
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
                  </>
                )}
              </SidebarGroup>
            ))}
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
                        {userData?.imagem_perfil ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                            <img 
                              src={userData.imagem_perfil} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff7a59] text-white shrink-0">
                            {getUserInitial()}
                          </div>
                        )}
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`font-medium text-xs text-gray-300 truncate w-full uppercase ${firebaseClasses.text.small}`}>{getDisplayName()}</span>
                          {getUserCargo() && (
                            <span className={`text-xs text-gray-400 truncate w-full ${firebaseClasses.text.tiny}`}>
                              {getUserCargo()}
                            </span>
                          )}
                        </div>
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`w-64 bg-card border-border text-card-foreground ${firebaseClasses.text.normal}`}>
                    <div className="p-2 border-b border-border">
                      <div className="flex items-center space-x-3">
                        {userData?.imagem_perfil ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                            <img 
                              src={userData.imagem_perfil} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff7a59] text-white">
                            {getUserInitial()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{getDisplayName()}</p>
                          <p className="text-xs text-muted-foreground flex items-start">
                            <UserRound className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span className="truncate">{user?.email || ""}</span>
                          </p>
                          
                          <div className="flex flex-wrap gap-y-1">
                            {getUserCargo() && (
                              <div className="flex items-center mr-3">
                                <Briefcase className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{getUserCargo()}</span>
                              </div>
                            )}
                            
                            {getUserUnidade() && (
                              <div className="flex items-center">
                                <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{getUserUnidade()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuItem onClick={() => navigate("/perfil")} className="hover:bg-muted focus:bg-muted p-2">
                      <UserRound className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={toggleTheme} className="hover:bg-muted focus:bg-muted p-2">
                      {theme === "light" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      <span>Mudar para tema {theme === "light" ? "escuro" : "claro"}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate("/perfil")} className="hover:bg-muted focus:bg-muted p-2">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-border" />
                    
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:bg-muted focus:bg-muted p-2">
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