import { useState, useEffect } from "react";
import { NovaOrdemServico } from "@/components/OrdensServico/NovaOrdemServico";
import { HistoricoOS } from "@/components/OrdensServico/HistoricoOS";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardPlus, History } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="nova-os" className="flex items-center gap-2">
            <ClipboardPlus className="h-4 w-4" />
            Nova OS
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2 relative">
            <History className="h-4 w-4" />
            Histórico
            {openCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                {openCount > 99 ? "99+" : openCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="nova-os" className="mt-0">
          <NovaOrdemServico />
        </TabsContent>
        
        <TabsContent value="historico" className="mt-0">
          <HistoricoOS />
        </TabsContent>
      </Tabs>
    </div>
  );
}
