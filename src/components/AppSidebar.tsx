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
  Briefcase
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

// Definindo a interface para os itens do sidebar
interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

// Definindo a interface para as categorias do sidebar
interface SidebarCategory {
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth(); // Corrigido para usar 'logout' do AuthContext
  const { totalItens } = useCarrinho();
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Firebase usa tema escuro por padrão
  const { toast } = useToast();
  
  // Estado para controlar quais categorias estão expandidas
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Função auxiliar para obter o email do usuário de forma segura
  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };
  
  // Inicializa as categorias expandidas com base na rota atual
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    
    // Determina qual categoria deve estar expandida com base na rota atual
    sidebarCategories.forEach((category) => {
      const shouldExpand = category.items.some(item => location.pathname === item.to);
      initialExpandedState[category.label] = shouldExpand;
    });
    
    setExpandedCategories(initialExpandedState);
  }, [location.pathname]);
  
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
    
    // Adiciona a fonte Roboto ao head
    const addRobotoFont = () => {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
      document.head.appendChild(fontLink);
      
      // Aplica a fonte Roboto globalmente
      document.body.style.fontFamily = '"Roboto", sans-serif';
    };
    
    addRobotoFont();
  }, [user]);
  
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
        console.log(`Novo documento criado com tema ${newTheme} para o usuário ${userEmail}`);
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
  
  // Função para alternar o estado de expansão de uma categoria
  const toggleCategoryExpansion = (categoryLabel: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel]
    }));
  };
  
  // Categorias do sidebar com seus respectivos ícones e itens
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
        { to: "/transfer", icon: FileText, label: "Entrada/Transferência" },
      ],
    },
    {
      label: "Operacional",
      icon: Network,
      items: [
        { to: "/ordensServico", icon: Clipboard, label: "Ordens de Serviço" },
        { to: "/orders", icon: Truck, label: "Compras/Pedidos" },
        { to: "/notas-fiscais", icon: Receipt, label: "Notas Fiscais" },
      ],
    },
    {
      label: "Produção",
      icon: Factory,
      items: [
        { to: "/producao", icon: BarChart, label: "Dashboard Prod" },
        { to: "/producao/planejamento", icon: ClipboardCheck, label: "Planejamento" },
        { to: "/producao/funcionarios", icon: Factory, label: "Funcionários" },
        { to: "/linhas-producao", icon: LineChart, label: "Linhas de Produção" },
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
        { to: "/administrativo", icon: Settings, label: "Administrativo" },
        { to: "/configuracoes", icon: Settings, label: "Configurações" },
      ],
    },
  ];

  // Função de logout corrigida
  const handleSignOut = async () => {
    try {
      await logout(); // Corrigido para usar a função logout do AuthContext
      // Redirecionar para a página de login após o logout
      navigate("/");
      // Adicionar feedback de sucesso
      toast({
        description: "Logout realizado com sucesso!",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      toast({
        description: "Erro ao sair do sistema. Tente novamente.",
        variant: "destructive",
        duration: 3000, // Corrigido o erro I3000 para 3000
      });
    }
  };

  // Obter a primeira letra do nome do usuário ou do email
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

  // Obter o nome de exibição
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

  // Obter o cargo do usuário
  const getUserCargo = () => {
    if (userData?.cargo) {
      return userData.cargo;
    }
    return "";
  };

  // Variantes para animação de expansão
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

  // Classes CSS comuns para botões expansivos e itens de menu
  const categoryBtnClasses = `
    flex items-center justify-between px-3 h-10 cursor-pointer transition-all duration-200
    rounded-md mx-1 my-0.5 font-medium
  `;

  // Classes para o estilo Firebase com a fonte Roboto
  const firebaseClasses = {
    sidebar: "bg-[#1c2834] border-none font-roboto",
    categoryBtn: {
      active: 'bg-[#2c384a] text-white',
      hover: 'hover:bg-[#2c384a] text-gray-300 hover:text-white'
    },
    menuItem: {
      active: 'bg-[#2c384a] text-white',
      hover: 'hover:bg-[#2c384a] text-gray-300 hover:text-white'
    },
    userProfile: {
      bg: "bg-[#2c384a]",
      text: "text-white",
      mutedText: "text-gray-400"
    },
    dropdownMenu: "bg-[#2c384a] border-[#3e4a5e]",
    // Classes específicas para a fonte Roboto
    text: {
      heading: "font-roboto font-medium",
      normal: "font-roboto font-normal",
      small: "font-roboto text-sm",
      tiny: "font-roboto text-xs"
    }
  };

  return (
    <Sidebar className="border-r border-[#2b3341]">
      <SidebarContent>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          /* Aplicar Roboto em todos os elementos dentro do sidebar */
          .font-poppins, .font-poppins * {
            font-family: 'Poppins', sans-serif;
            letter-spacing: 0.02em;
            font-size: 0.9rem;
          }
          
          /* Ajustes para pesos de fonte específicos do Firebase */
          .font-poppins .text-sm {
            font-weight: 600;
          }
          
          .font-poppins .text-xs {
            font-weight: 600;
          }
          
          .font-poppins .font-medium {
            font-weight: 600;
          }
          
          /* Ajustes para melhorar a visibilidade no tema claro */
          :root:not(.dark) .font-poppins {
            color: #333333; /* Cor escura para texto em tema claro */
          }
          
          :root:not(.dark) .text-gray-300 {
            color: #333333 !important; /* Substituir texto cinza claro por um mais escuro no tema claro */
          }
          
          :root:not(.dark) .text-gray-400 {
            color: #555555 !important; /* Substituir texto cinza claro por um mais escuro no tema claro */
          }
          
          :root:not(.dark) .text-gray-500 {
            color: #666666 !important; /* Substituir texto cinza claro por um mais escuro no tema claro */
          }
          
          /* Ajustes para os items do menu no tema claro */
          :root:not(.dark) .hover\\:bg-\\[\\#2c384a\\]:hover {
            background-color: #e0e0e0 !important; /* Fundo mais claro para hover no tema claro */
          }
          
          :root:not(.dark) .bg-\\[\\#2c384a\\] {
            background-color: #f0f0f0 !important; /* Fundo mais claro no tema claro */
          }
          
          :root:not(.dark) .bg-\\[\\#1c2834\\] {
            background-color: #ffffff !important; /* Fundo do sidebar no tema claro */
          }
          
          :root:not(.dark) .border-\\[\\#3e4a5e\\] {
            border-color: #dddddd !important; /* Cor da borda para tema claro */
          }
        `}
      </style>
        <SidebarGroup>
          {/* Novo cabeçalho com a estrutura solicitada */}
          <div className="flex flex-col items-center justify-center px-1 py-2">
            <img 
              src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" 
              className="w-16 h-16 rounded-lg object-scale-down" 
            />
          </div>
          {/* Categorias do Firebase que estão na imagem */}
          
          
          {/* Renderizar cada categoria do sidebar */}
          <div className="overflow-y-auto flex-grow" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {sidebarCategories.map((category, index) => (
              <SidebarGroup key={index}>
                {/* Categoria com ícone e botão para expandir/colapsar */}
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
                    {/* Aumentado o tamanho do texto das categorias */}
                    <SidebarGroupLabel className="flex-1 text-1xl font-bold">{category.label}</SidebarGroupLabel>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedCategories[category.label] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </div>
                
                {/* Conteúdo da categoria com animação */}
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
                                {/* Reduzido o tamanho do texto das subcategorias */}
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
          </div>
        </SidebarGroup>
        
        {/* Perfil fixado na parte inferior */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* User Profile Dropdown */}
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
