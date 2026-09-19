import { useState, useEffect } from "react";
import { NovaOrdemServico } from "@/components/OrdensServico/NovaOrdemServico";
import { HistoricoOS } from "@/components/OrdensServico/HistoricoOS";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TabType = "nova-os" | "historico";

export function OrdensServicoTab() {
  const [activeTab, setActiveTab] = useState<TabType>("nova-os");
  const [openCount, setOpenCount] = useState(0);

  // Carregar contagem de OS abertas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordensRef = collection(db, "ordens_servicos");
        const snapshot = await getDocs(ordensRef);
        
        let abertas = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "aberta") abertas++;
        });
        
        setOpenCount(abertas);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      }
    };

    fetchStats();
  }, [activeTab]);

  const tabs = [
    { id: "nova-os" as TabType, label: "Nova OS" },
    { id: "historico" as TabType, label: "Histórico" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs estilizadas */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === "historico" && openCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                  {openCount > 99 ? "99+" : openCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Conteúdo das Tabs */}
      {activeTab === "nova-os" && (
        <NovaOrdemServico />
      )}
      
      {activeTab === "historico" && (
        <HistoricoOS />
      )}
    </div>
  );
}
