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
          label: "Principal",
          icon: Layers,
          items: [
            { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          ],
        },
        {
          label: "Estoque",
          icon: Boxes,
          items: [
            { to: "/produtos", icon: Box, label: "Produtos" },
            { to: "/requisicoes", icon: ClipboardList, label: "Requisições" },
            { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
            { to: "/inventory", icon: PackageSearch, label: "Inventário" },
            { to: "/enderecamento", icon: Warehouse, label: "Endereçamento" },
            { to: "/entradaProdutosET", icon: ArchiveRestore, label: "Entrada Manual" },
            { to: "/transferenciasET", icon: ArrowLeftRight, label: "Transferência" },
            { to: "/compras", icon: Truck, label: "Compras" },
            { to: "/pedidos", icon: Truck, label: "Pedidos" },
          ],
        },
        {
          label: "Operacional",
          icon: Network,
          items: [
            { to: "/ordensServico", icon: Clipboard, label: "Ordens de Serviço" },
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
        ...(isAdmin ? [{
          label: "Administrativo",
          icon: Settings,
          items: [
            { to: "/administrativo/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { to: "/administrativo/usuarios", icon: UserRound, label: "Usuários" },
            { to: "/administrativo/produtos", icon: Box, label: "Produtos" },
            { to: "/administrativo/fornecedores", icon: Users, label: "Fornecedores" },
            { to: "/administrativo/depositos", icon: Warehouse, label: "Depósitos" },
            { to: "/administrativo/unidades", icon: Building2, label: "Unidades" },
          ],
        }] : []),
        {
          label: "Sistema",
          icon: Monitor,
          items: [
            { to: "/configuracoes", icon: Settings, label: "Configurações" },
          ],
        },
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