import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { useLocation } from "react-router-dom";
import FloatingActionBar from "@/components/meuFlutuante";
import { usePostMessageFix } from "@/hooks/usePostMessageFix";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  /** Ocupa toda a altura disponível, sem padding nem scroll na main (ex.: Chat) */
  fullHeight?: boolean;
}

const AppLayout = ({ children, title, fullHeight = false }: AppLayoutProps) => {
  // Aplica correção para DataCloneError globalmente
  usePostMessageFix();
  
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);

  // Detectar se é um dispositivo móvel com base na largura da tela
  useEffect(() => {
    const checkIfDesktop = () => {
      // Sidebar apenas no desktop (lg). Tablet e mobile usam o menu flutuante.
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Verificar inicialmente
    checkIfDesktop();

    // Adicionar um listener para quando a janela for redimensionada
    window.addEventListener("resize", checkIfDesktop);

    // Cleanup do listener quando o componente for desmontado
    return () => {
      window.removeEventListener("resize", checkIfDesktop);
    };
  }, []);
  
  const isIDEPage = location.pathname === '/ide';
  
  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden">
        {isDesktop && <AppSidebar />}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <AppHeader title={title} />
          <main className={`flex-1 min-h-0 ${isIDEPage || fullHeight ? 'p-0 overflow-hidden' : 'overflow-auto p-2 sm:p-4 md:p-6'}`}>
            <div className={`w-full max-w-full ${isIDEPage || fullHeight ? 'h-full flex flex-col min-h-0' : ''}`}>
              {children}
            </div>
          </main>
        </div>
        
        {!isDesktop && <FloatingActionBar />}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;