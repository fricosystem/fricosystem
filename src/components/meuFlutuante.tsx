import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCarrinho } from "@/hooks/useCarrinho";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { 
  Layers, Home, Boxes, Package, ClipboardList, Truck, Warehouse, 
  ShoppingCart, AlertTriangle, FileText, Users, Wallet, TrendingUp, 
  Settings, FileSpreadsheet, ListChecks, PackagePlus, Ruler, Wrench, 
  ShoppingBag, Factory, Receipt, CalendarCheck, PieChart, Bell, 
  PackageSearch, Download, Database, LogOut, Sun, Moon, ChevronUp, 
  ChevronDown, UserRound, Briefcase, Building2, BarChart3, 
  ShoppingBasket, Scan, FileInput, ReceiptText, ArrowRightLeft, 
  MapPin, TreePine, FileOutput, ClipboardCheck, RotateCcw, UserCheck, 
  Building, DollarSign, Calculator, Upload, Shield, Cog, PackageCheck, 
  Gavel, X, Menu, MessageSquare, Mail, Calendar
} from "lucide-react";

const FuturisticFloatingMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { totalItens } = useCarrinho();
  const { toast } = useToast();
  
  const [activeMenu, setActiveMenu] = useState(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [minimized, setMinimized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const isAdmin = userData?.cargo === "DESENVOLVEDOR";

  useEffect(() => {
    if (userData?.ativo === "não") {
      navigate("/bem-vindo");
      toast({
        title: "Conta inativa",
        description: "Sua conta está inativa. Entre em contato com o administrador.",
        variant: "destructive",
      });
    }
  }, [userData, navigate, toast]);

  const filterItemsByPermission = (items) => {
    if (!userData?.permissoes) return items;
    if (userData.permissoes.includes("tudo")) return items;
    return items.filter(item => {
      if (!item.permission) return true;
      return userData.permissoes.includes(item.permission);
    });
  };

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
            const hasPending = data.solicitante.some((item) => 
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

  const getUserEmail = () => {
    if (!user) return null;
    return user.email || null;
  };

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

  const getUserUnidade = () => {
    if (userData?.unidade) {
      return userData.unidade;
    }
    return "";
  };

  const menuCategories = [
    {
      id: "principal",
      icon: <Layers size={24} />,
      label: "Principal",
      items: filterItemsByPermission([
        { id: "dashboard", icon: <BarChart3 size={20} />, label: "Dashboard Geral", path: "/dashboard", permission: "dashboard" },
        { id: "fornecedor-produtos", icon: <ShoppingBasket size={20} />, label: "Ordens de Compra", path: "/fornecedor-produtos", permission: "ordens_compra" },
      ]),
    },
    {
      id: "estoque",
      icon: <Boxes size={24} />,
      label: "Estoque",
      items: filterItemsByPermission([
        { id: "produtos", icon: <PackageCheck size={20} />, label: "Produtos", path: "/produtos", permission: "produtos" },
        { id: "inventario", icon: <Scan size={20} />, label: "Inventário", path: "/inventario", permission: "inventario" },
        { id: "entrada-manual", icon: <PackagePlus size={20} />, label: "Entrada Manual", path: "/entrada-manual", permission: "entrada_manual" },
        { id: "notas-fiscais", icon: <FileInput size={20} />, label: "NF - Entrada XML", path: "/notas-fiscais", permission: "notas_fiscais" },
        { id: "transferencia", icon: <ArrowRightLeft size={20} />, label: "Transferência", path: "/transferencia", permission: "transferencia" },
        { id: "enderecamento", icon: <MapPin size={20} />, label: "Endereçamento", path: "/enderecamento", permission: "enderecamento" },
        { id: "medida-de-lenha", icon: <TreePine size={20} />, label: "Cubagem e medida de Lenha", path: "/medida-de-lenha", permission: "medida_lenha" },
        { id: "relatorios", icon: <FileSpreadsheet size={20} />, label: "Relatórios", path: "/relatorios", permission: "relatorios" },
      ]),
    },
    {
      id: "requisicoes",
      icon: <ClipboardList size={24} />,
      label: "Requisições",
      items: filterItemsByPermission([
        { id: "requisicoes", icon: <ClipboardCheck size={20} />, label: "Requisições", path: "/requisicoes", badge: pendingRequestsCount > 0 ? pendingRequestsCount : null, permission: "requisicoes" },
        { id: "carrinho", icon: <ShoppingCart size={20} />, label: "Carrinho", path: "/carrinho", badge: totalItens > 0 ? totalItens : null, permission: "carrinho" },
        { id: "ordensServico", icon: <Wrench size={20} />, label: "Ordens de Serviço", path: "/ordensServico", permission: "ordens_servico" },
        { id: "devolucao", icon: <RotateCcw size={20} />, label: "Devoluções", path: "/devolucao", permission: "devolucoes" },
      ]),
    },
    {
      id: "compras",
      icon: <ShoppingCart size={24} />,
      label: "Compras",
      items: filterItemsByPermission([
        { id: "compras", icon: <ShoppingBag size={20} />, label: "Compras", path: "/compras", permission: "compras" },
        { id: "fornecedores", icon: <Building size={20} />, label: "Fornecedores", path: "/fornecedores", permission: "fornecedores" },
      ]),
    },
    {
      id: "financeiro",
      icon: <Wallet size={24} />,
      label: "Financeiro",
      items: filterItemsByPermission([
        { id: "notas-fiscais-lancamento", icon: <ReceiptText size={20} />, label: "NF - Lançamento", path: "/notas-fiscais-lancamento", permission: "notas_fiscais_lancamento" },
        { id: "centro-custo", icon: <PieChart size={20} />, label: "Centro de Custo", path: "/centro-custo", permission: "centro_custo" },
      ]),
    },
    {
      id: "utilitarios",
      icon: <FileText size={24} />,
      label: "Utilitários",
      items: filterItemsByPermission([
        { id: "importar-planilha", icon: <Upload size={20} />, label: "Importar dados", path: "/importar-planilha", permission: "importar_dados" },
      ]),
    },
    {
      id: "producao",
      icon: <Factory size={24} />,
      label: "Produção",
      items: filterItemsByPermission([
        { id: "pcp", icon: <TrendingUp size={20} />, label: "PCP", path: "/pcp", permission: "pcp" },
      ]),
    },
    {
      id: "comunicacao",
      icon: <MessageSquare size={24} />,
      label: "Comunicação",
      items: filterItemsByPermission([
        { id: "chat", icon: <MessageSquare size={20} />, label: "Chat", path: "/chat", permission: "chat" },
        { id: "email", icon: <Mail size={20} />, label: "Email", path: "/email", permission: "email" },
        { id: "agendamento", icon: <Calendar size={20} />, label: "Agendamento", path: "/agendamento", permission: "agendamento" },
      ]),
    },
    ...(isAdmin ? [{
      id: "administrativo",
      icon: <Settings size={24} />,
      label: "Administrativo",
      items: filterItemsByPermission([
        { id: "gestao-usuarios", icon: <UserCheck size={20} />, label: "Gestão de Usuários", path: "/gestao-usuarios", permission: "gestao_usuarios" },
        { id: "gestao-produtos", icon: <Cog size={20} />, label: "Gestão de Produtos", path: "/gestao-produtos", permission: "gestao_produtos" },
        { id: "unidades", icon: <Building2 size={20} />, label: "Gestão de Unidades", path: "/unidades", permission: "gestao_unidades" },
      ]),
    }] : []),
    {
      id: "sistema",
      icon: <Settings size={24} />,
      label: "Sistema",
      items: [
        { 
          id: "perfil", 
          icon: <UserRound size={20} />, 
          label: "Perfil", 
          path: "/perfil" 
        },
        { 
          id: "theme", 
          icon: theme === "light" ? <Moon size={20} /> : <Sun size={20} />, 
          label: `Tema ${theme === "light" ? "Escuro" : "Claro"}`, 
          onClick: toggleTheme 
        },
        { 
          id: "config", 
          icon: <Settings size={20} />, 
          label: "Configurações", 
          path: "/perfil" 
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
            ? "bg-blue-600/30 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300" 
            : "hover:bg-blue-600/20 dark:hover:bg-blue-500/20"
        } rounded-lg ${className || ""}`}
      >
        <span className={`mr-3 ${
          isActive 
            ? "text-blue-600 dark:text-blue-400" 
            : "text-blue-500 dark:text-blue-400"
        }`}>{icon}</span>
        <span className={`${
          isActive 
            ? "text-blue-700 dark:text-blue-300" 
            : "text-gray-700 dark:text-gray-200"
        }`}>{label}</span>
        {badge && (
          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isVisible && !minimized && (
        <div id="floating-menu-container" className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 ${theme === "dark" ? "dark" : ""}`}>
          {activeMenu && (
            <div className="bg-white dark:bg-gray-900 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 rounded-2xl shadow-xl mb-4 border border-blue-200 dark:border-blue-900 min-w-72 max-w-80 overflow-hidden transition-all duration-300 ease-in-out">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  {menuCategories.find(cat => cat.id === activeMenu)?.label}
                </h3>
                <button 
                  onClick={() => setActiveMenu(null)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              
              {activeMenu === "sistema" && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    {userData?.imagem_perfil ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img 
                          src={userData.imagem_perfil} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold">
                        {getUserInitial()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 dark:text-gray-100">{getDisplayName()}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ""}</span>
                      {getUserCargo() && (
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {getUserCargo()}
                        </div>
                      )}
                      {getUserUnidade() && (
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Building2 className="h-3 w-3 mr-1" />
                          {getUserUnidade()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
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
            <div className="relative bg-white dark:bg-gray-900 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 rounded-full shadow-lg px-2 py-2 flex items-center justify-center space-x-1">
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
                    {category.id === "requisicoes" && pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {pendingRequestsCount}
                      </span>
                    )}
                    {category.id === "carrinho" && totalItens > 0 && (
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

      <button
        onClick={toggleMinimize}
        className={`fixed z-50 flex items-center justify-center rounded-full p-3 shadow-lg transition-all duration-300 ${
          minimized ? "bottom-4 right-4" : "bottom-4 left-1/2 transform -translate-x-1/2"
        } ${
          selectedCategory?.id === "requisicoes" && pendingRequestsCount > 0 
            ? "bg-red-500 text-white" 
            : selectedCategory?.id === "carrinho" && totalItens > 0
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400"
        }`}
        style={{ width: "48px", height: "48px" }}
      >
        {minimized ? (
          <div className="relative flex items-center">
            {userData?.imagem_perfil ? (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={userData.imagem_perfil} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <>
                <Menu size={20} className="text-blue-500" />
                {selectedCategory?.icon && (
                  <div className="ml-2">
                    {React.cloneElement(selectedCategory.icon, { size: 20 })}
                    {selectedCategory?.id === "requisicoes" && pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {pendingRequestsCount}
                      </span>
                    )}
                    {selectedCategory?.id === "carrinho" && totalItens > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-600 rounded-full">
                        {totalItens}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <X size={20} className="text-blue-600 dark:text-blue-400" />
        )}
      </button>
    </>
  );
};

export default FuturisticFloatingMenu;