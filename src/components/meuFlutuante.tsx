import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCarrinho } from "@/hooks/useCarrinho";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar, Settings, Box, ClipboardList, 
  ShoppingCart, Factory, UserRound, Wallet, LayoutDashboard,
  PackageSearch, Warehouse, Truck, Receipt, BarChart, LogOut,
  FileText, Sun, Moon, Layers, Briefcase, Boxes, Network,
  ArrowLeftRight, ArchiveRestore, Clipboard, ClipboardCheck,
  Package, CheckSquare, HardHat, GraduationCap, BarChart3,
  Users, Monitor, ArrowLeftFromLine, ArrowDownFromLine, Home,
  Building2
} from "lucide-react";

const FuturisticFloatingMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { totalItens } = useCarrinho();
  const { toast } = useToast();
  
  const [activeMenu, setActiveMenu] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [minimized, setMinimized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Verifica se o usuário é admin
  const isAdmin = userData?.cargo === "admin";

  // Efeito para fechar o menu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuContainer = document.getElementById("floating-menu-container");
      if (menuContainer && !menuContainer.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carrega o tema do Firestore quando o componente montar
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
            const savedTheme = userDoc.data().tema;
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
          } else {
            const defaultTheme = "dark";
            setTheme(defaultTheme);
            document.documentElement.classList.toggle("dark", defaultTheme === "dark");
            await setDoc(doc(db, "usuarios", userDoc.id), { tema: defaultTheme }, { merge: true });
          }
        } else {
          setTheme("dark");
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
        setTheme("dark");
      }
    };
    
    loadTheme();
  }, [user]);

  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };

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

  const navigateTo = (path) => {
    navigate(path);
    setActiveMenu(null);
    setMinimized(true);
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

  const toggleSubmenu = (menuId) => {
    if (activeMenu === menuId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuId);
      setSelectedCategory(menuCategories.find(cat => cat.id === menuId));
    }
    setMinimized(false);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
    if (!minimized) {
      setActiveMenu(null);
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
    return "Usuário";
  };

  // Categorias do menu principal (incluindo administrativo condicional)
  const menuCategories = [
    {
      id: "principal",
      icon: <Layers size={24} />,
      label: "Principal",
      items: [
        { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/dashboard" },
        { id: "requisicoes", icon: <ClipboardList size={20} />, label: "Requisições", path: "/requisicoes" },
        { 
          id: "carrinho", 
          icon: <ShoppingCart size={20} />, 
          label: "Carrinho", 
          path: "/carrinho", 
          badge: totalItens > 0 ? totalItens : null 
        }
      ]
    },
    {
      id: "estoque",
      icon: <Boxes size={24} />,
      label: "Estoque",
      items: [
        { id: "produtos", icon: <Box size={20} />, label: "Produtos", path: "/produtos" },
        { id: "inventario", icon: <PackageSearch size={20} />, label: "Inventário", path: "/inventory" },
        { id: "enderecamento", icon: <Warehouse size={20} />, label: "Endereçamento", path: "/enderecamento" },
        { id: "entradaManual", icon: <ArchiveRestore size={20} />, label: "Entrada Manual", path: "/entradaProdutosET" },
        { id: "transferencia", icon: <ArrowLeftRight size={20} />, label: "Transferência", path: "/transferenciasET" },
        { id: "compras", icon: <Truck size={20} />, label: "Compras", path: "/compras" },
        { id: "pedidos", icon: <Truck size={20} />, label: "Pedidos", path: "/pedidos" }
      ]
    },
    {
      id: "operacional",
      icon: <Network size={24} />,
      label: "Operacional",
      items: [
        { id: "ordensServico", icon: <Clipboard size={20} />, label: "Ordens de Serviço", path: "/ordensServico" },
        { id: "notas-fiscais", icon: <Receipt size={20} />, label: "Notas Fiscais", path: "/notas-fiscais" }
      ]
    },
    {
      id: "producao",
      icon: <Factory size={24} />,
      label: "Produção",
      items: [
        { id: "producao-dash", icon: <BarChart size={20} />, label: "Dashboard Prod", path: "/producao" },
        { id: "planejamento", icon: <ClipboardCheck size={20} />, label: "Planejamento", path: "/producao/planejamento" },
        { 
          id: "planejamentoDiario", 
          icon: <Calendar size={20} />, 
          label: "Planejamento Diário", 
          path: "/producao/planejamentoDiarioProducao" 
        },
        { 
          id: "produtosProducao", 
          icon: <Package size={20} />, 
          label: "Produtos Produção", 
          path: "/producao/produtosProducao" 
        },
        { 
          id: "produtosFinais", 
          icon: <CheckSquare size={20} />, 
          label: "Produtos Finais", 
          path: "/producao/produtosFinaisProducao" 
        }
      ]
    },
    {
      id: "rh",
      icon: <HardHat size={24} />,
      label: "Recursos Humanos",
      items: [
        { id: "funcionarios", icon: <UserRound size={20} />, label: "Funcionários", path: "/rh/funcionarios" },
        { id: "ponto", icon: <Calendar size={20} />, label: "Ponto Eletrônico", path: "/rh/ponto" },
        { id: "treinamentos", icon: <GraduationCap size={20} />, label: "Treinamentos", path: "/rh/treinamentos" }
      ]
    },
    {
      id: "financeiro",
      icon: <Wallet size={24} />,
      label: "Financeiro",
      items: [
        { id: "financeiro-dash", icon: <Wallet size={20} />, label: "Financeiro", path: "/financial" },
        { id: "centros-custo", icon: <BarChart3 size={20} />, label: "Centros de Custo", path: "/cost-centers" },
        { id: "fornecedores", icon: <Users size={20} />, label: "Fornecedores", path: "/fornecedores" },
        { id: "relatorios", icon: <FileText size={20} />, label: "Relatórios", path: "/relatorios" }
      ]
    },
    // Categoria administrativa condicional
    ...(isAdmin ? [{
      id: "administrativo",
      icon: <Settings size={24} />,
      label: "Administrativo",
      items: [
        { 
          id: "admin-dashboard", 
          icon: <LayoutDashboard size={20} />, 
          label: "Dashboard", 
          path: "/administrativo/dashboard" 
        },
        { 
          id: "admin-usuarios", 
          icon: <UserRound size={20} />, 
          label: "Usuários", 
          path: "/administrativo/usuarios" 
        },
        { 
          id: "admin-produtos", 
          icon: <Box size={20} />, 
          label: "Produtos", 
          path: "/administrativo/produtos" 
        },
        { 
          id: "admin-fornecedores", 
          icon: <Users size={20} />, 
          label: "Fornecedores", 
          path: "/administrativo/fornecedores" 
        },
        { 
          id: "admin-depositos", 
          icon: <Warehouse size={20} />, 
          label: "Depósitos", 
          path: "/administrativo/depositos" 
        },
        { 
          id: "admin-unidades", 
          icon: <Building2 size={20} />, 
          label: "Unidades", 
          path: "/administrativo/unidades" 
        }
      ]
    }] : []),
    {
      id: "sistema",
      icon: <Monitor size={24} />,
      label: "Sistema",
      items: [
        { 
          id: "config", 
          icon: <Settings size={20} />, 
          label: "Configurações", 
          path: "/configuracoes" 
        },
        { 
          id: "theme", 
          icon: theme === "light" ? <Moon size={20} /> : <Sun size={20} />, 
          label: `Tema ${theme === "light" ? "Escuro" : "Claro"}`, 
          onClick: toggleTheme 
        },
        { 
          id: "logout", 
          icon: <LogOut size={20} />, 
          label: "Sair", 
          className: "text-red-500", 
          onClick: handleSignOut 
        }
      ]
    }
  ];

  const SubMenuItem = ({ icon, label, badge, className, onClick, path }) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      } else if (path) {
        navigateTo(path);
      }
    };
    
    const isActive = path && location.pathname === path;
    
    return (
      <button 
        onClick={handleClick}
        className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
          isActive 
            ? "bg-green-600/30 dark:bg-green-600/30 text-green-700 dark:text-green-300" 
            : "hover:bg-green-600/20 dark:hover:bg-green-500/20"
        } rounded-lg ${className || ""}`}
      >
        <span className={`mr-3 ${
          isActive 
            ? "text-green-600 dark:text-green-400" 
            : "text-green-500 dark:text-green-400"
        }`}>{icon}</span>
        <span className={`${
          isActive 
            ? "text-green-700 dark:text-green-300" 
            : "text-gray-700 dark:text-gray-200"
        }`}>{label}</span>
        {badge && (
          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 dark:bg-green-500 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const UserProfileSection = () => {
    return (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold">
            {getUserInitial()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 dark:text-gray-100">{getDisplayName()}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ""}</span>
            {getUserCargo() && (
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Briefcase className="h-3 w-3 mr-1" />
                {getUserCargo()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MinimizedButton = () => {
    return (
      <button
        onClick={toggleMinimize}
        className={`fixed z-50 flex items-center justify-center rounded-full p-3 shadow-lg transition-all duration-300 ${
          minimized ? "bottom-4 right-4" : "bottom-8 left-1/2 transform -translate-x-1/2"
        } ${
          selectedCategory?.id === "principal" && totalItens > 0 
            ? "bg-green-600 text-white" 
            : "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400"
        }`}
      >
        {minimized ? (
          <div className="relative flex items-center">
            <ArrowLeftFromLine size={24} className="text-green-500" />
            {selectedCategory?.icon && (
              <div className="ml-2">
                {selectedCategory.icon}
                {selectedCategory?.id === "principal" && totalItens > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                    {totalItens}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <ArrowDownFromLine size={24} className="text-green-600 dark:text-green-400" />
        )}
      </button>
    );
  };

  return (
    <>
      {!minimized && (
        <div id="floating-menu-container" className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 ${theme === "dark" ? "dark" : ""}`}>
          {activeMenu && (
            <div className="bg-white dark:bg-gray-900 backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90 rounded-2xl shadow-xl mb-4 border border-blue-200 dark:border-blue-900 min-w-72 max-w-80 overflow-hidden transition-all duration-300 ease-in-out animate-fadeIn">
              {activeMenu === "sistema" && <UserProfileSection />}
              
              <div className="p-2 max-h-96 overflow-y-auto">
                {menuCategories.find(cat => cat.id === activeMenu)?.items.map((item, idx) => (
                  <SubMenuItem 
                    key={idx}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    className={item.className}
                    onClick={item.onClick}
                    path={item.path}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-sm opacity-75"></div>
            <div className="relative bg-white dark:bg-gray-900 backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90 rounded-full shadow-lg px-2 py-2 flex items-center justify-center space-x-1">
              {menuCategories.map((category, idx) => {
                const isCategoryActive = category.items?.some(item => 
                  item.path && location.pathname === item.path
                );
                
                return (
                  <button
                    key={idx}
                    onClick={() => toggleSubmenu(category.id)}
                    className={`p-3 rounded-full transition-all duration-300 relative group ${
                      activeMenu === category.id || isCategoryActive
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    }`}
                    aria-label={category.label}
                  >
                    {category.id === "principal" && totalItens > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                        {totalItens}
                      </span>
                    )}
                    {category.icon}
                    
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <MinimizedButton />
    </>
  );
};

export default FuturisticFloatingMenu;