import { useState, useEffect } from "react";
import { BottomNavigationOS } from "./components/BottomNavigationOS";
import { NovaOrdemServico } from "./components/NovaOrdemServico";
import { HistoricoOS } from "./components/HistoricoOS";
import { PerfilOS } from "./components/PerfilOS";
import { useBlockBackNavigation } from "@/hooks/useBlockBackNavigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedLogo } from "@/hooks/useThemedLogo";

type TabType = "nova-os" | "historico" | "perfil";

export default function OrdensServico() {
  useBlockBackNavigation();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("nova-os");
  const [openCount, setOpenCount] = useState(0);
  const [stats, setStats] = useState({
    abertas: 0,
    concluidas: 0,
    total: 0
  });
  const logoSrc = useThemedLogo();

  // Carregar contagem de OS abertas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordensRef = collection(db, "ordens_servicos");
        const snapshot = await getDocs(ordensRef);
        
        let abertas = 0;
        let concluidas = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "aberta") abertas++;
          if (data.status === "concluida") concluidas++;
        });
        
        setOpenCount(abertas);
        setStats({
          abertas,
          concluidas,
          total: snapshot.size
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      }
    };

    fetchStats();
  }, [activeTab]);

  const getPageTitle = () => {
    switch (activeTab) {
      case "nova-os":
        return "Ordens de Serviço";
      case "historico":
        return "Histórico de OS";
      case "perfil":
        return "Perfil";
      default:
        return "Ordens de Serviço";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "nova-os":
        return "Nova Ordem de Serviço";
      case "historico":
        return "Ordens Registradas";
      case "perfil":
        return "Configurações";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto py-4 px-6 flex items-center gap-3">
          <img 
            src={logoSrc} 
            alt="APEX HUB" 
            className="h-10 w-10 object-contain" 
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{getPageTitle()}</h1>
            <p className="text-xs text-muted-foreground">{getPageSubtitle()}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto min-h-0 pb-24">
        {activeTab === "nova-os" && <NovaOrdemServico />}
        {activeTab === "historico" && <HistoricoOS />}
        {activeTab === "perfil" && <PerfilOS stats={stats} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigationOS 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        badgeCount={openCount}
      />
    </div>
  );
}
