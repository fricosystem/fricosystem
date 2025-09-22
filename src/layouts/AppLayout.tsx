import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { useLocation } from "react-router-dom";
import FloatingActionBar from "@/components/meuFlutuante";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é um dispositivo móvel com base na largura da tela
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px é o breakpoint para md no Tailwind
    };

    // Verificar inicialmente
    checkIfMobile();

    // Adicionar um listener para quando a janela for redimensionada
    window.addEventListener("resize", checkIfMobile);

    // Cleanup do listener quando o componente for desmontado
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);
  
  const isIDEPage = location.pathname === '/ide';
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full">
          <AppHeader title={title} />
          <main className={`flex-1 overflow-auto ${isIDEPage ? 'p-0' : 'p-6'}`}>
            {children}
          </main>
        </div>
        
        {isMobile && <FloatingActionBar />}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;