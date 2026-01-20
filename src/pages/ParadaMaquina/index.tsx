import { useState, useEffect } from "react";
import { Plus, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import NovaParadaMaquina from "./components/NovaParadaMaquina";
import ParadasAbertas from "./components/ParadasAbertas";
import HistoricoParadas from "./components/HistoricoParadas";
import { PerfilParada } from "./components/PerfilParada";
import { BottomNavigationParada } from "./components/BottomNavigationParada";
import { NovaOrdemServico } from "@/pages/OrdensServico/components/NovaOrdemServico";
import { HistoricoOS } from "@/pages/OrdensServico/components/HistoricoOS";
import QrScannerModal from "./components/QrScannerModal";
import { OfflineStatusBar } from "@/pages/ExecucaoPreventiva/components/OfflineStatusBar";
import { OfflineSyncProvider } from "@/contexts/OfflineSyncContext";
import { useBlockBackNavigation } from "@/hooks/useBlockBackNavigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCachedCollection } from "@/lib/offlineDB";

interface ScannedData {
  setor: string;
  equipamento: string;
}

type MainTabType = "paradas" | "os" | "perfil";
type SubTabType = "abertas" | "historico" | "nova-os" | "historico-os";

export default function ParadaMaquina() {
  useBlockBackNavigation();
  const [activeTab, setActiveTab] = useState<MainTabType>("paradas");
  const [subTab, setSubTab] = useState<SubTabType>("abertas");
  const [isNovaParadaOpen, setIsNovaParadaOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [osBadgeCount, setOsBadgeCount] = useState(0);
  const [stats, setStats] = useState({
    abertas: 0,
    emAndamento: 0,
    concluidas: 0,
    total: 0
  });

  // Carregar contagem de OS abertas
  useEffect(() => {
    const fetchOsStats = async () => {
      try {
        const ordensRef = collection(db, "ordens_servicos");
        const snapshot = await getDocs(ordensRef);
        
        let abertas = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "aberta") abertas++;
        });
        
        setOsBadgeCount(abertas);
      } catch (error) {
        console.error("Erro ao buscar estatísticas de OS:", error);
      }
    };

    fetchOsStats();
  }, [activeTab, subTab]);

  // Sincronizar sub-aba quando mudar a aba principal
  useEffect(() => {
    if (activeTab === "paradas") {
      setSubTab("abertas");
    } else if (activeTab === "os") {
      setSubTab("nova-os");
    }
  }, [activeTab]);
  
  const handleQrCodeScanned = async (code: string) => {
    const isOffline = !navigator.onLine;
    
    try {
      let parsed: { setor?: string; equipamento?: string } | null = null;
      try {
        parsed = JSON.parse(code);
      } catch {
        parsed = { equipamento: code };
      }

      let foundEquipamento: { equipamento: string; setor: string } | null = null;

      if (isOffline) {
        const cachedEquipamentos = await getCachedCollection('equipamentos');
        for (const data of cachedEquipamentos) {
          const equipNome = data.equipamento?.toLowerCase() || "";
          const patrimonio = data.patrimonio?.toLowerCase() || "";
          const tag = data.tag?.toLowerCase() || "";
          const searchTerm = (parsed?.equipamento || code).toLowerCase();
          if (
            equipNome === searchTerm ||
            patrimonio === searchTerm ||
            tag === searchTerm ||
            equipNome.includes(searchTerm) ||
            patrimonio.includes(searchTerm)
          ) {
            foundEquipamento = {
              equipamento: data.equipamento,
              setor: data.setor
            };
            break;
          }
        }
      } else {
        const equipamentosRef = collection(db, "equipamentos");
        const snapshot = await getDocs(equipamentosRef);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const equipNome = data.equipamento?.toLowerCase() || "";
          const patrimonio = data.patrimonio?.toLowerCase() || "";
          const tag = data.tag?.toLowerCase() || "";
          const searchTerm = (parsed?.equipamento || code).toLowerCase();
          if (
            equipNome === searchTerm ||
            patrimonio === searchTerm ||
            tag === searchTerm ||
            equipNome.includes(searchTerm) ||
            patrimonio.includes(searchTerm)
          ) {
            foundEquipamento = {
              equipamento: data.equipamento,
              setor: data.setor
            };
          }
        });
      }
      
      if (foundEquipamento) {
        setScannedData(foundEquipamento);
        setIsNovaParadaOpen(true);
        toast.success(`Equipamento encontrado: ${foundEquipamento.equipamento}`);
      } else {
        toast.error("Equipamento não encontrado na base de dados");
      }
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      toast.error("Erro ao processar QR Code");
    }
  };

  useEffect(() => {
    if (!isNovaParadaOpen) {
      setScannedData(null);
    }
  }, [isNovaParadaOpen]);

  const getPageTitle = () => {
    switch (activeTab) {
      case "paradas":
        return "Paradas de Máquina";
      case "os":
        return "Ordens de Serviço";
      case "perfil":
        return "Perfil";
      default:
        return "Parada de Máquina";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "paradas":
        return "Gestão de Paradas";
      case "os":
        return "Ordens de Serviço";
      case "perfil":
        return "Configurações";
      default:
        return "";
    }
  };

  const showFloatingButtons = activeTab === "paradas" && subTab === "abertas";

  return (
    <OfflineSyncProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Barra de Status Offline */}
        <OfflineStatusBar />

        {/* Header Fixo */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto py-4 px-6 flex items-center gap-3">
            <img src="/APEX LOGO.png" alt="Fricó" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">{getPageTitle()}</h1>
              <p className="text-xs text-muted-foreground">{getPageSubtitle()}</p>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto min-h-0 pb-36">
          {/* Paradas */}
          {activeTab === "paradas" && subTab === "abertas" && (
            <ParadasAbertas 
              onCountChange={setOpenCount}
              onStatsChange={setStats}
            />
          )}
          {activeTab === "paradas" && subTab === "historico" && (
            <HistoricoParadas />
          )}
          
          {/* OS */}
          {activeTab === "os" && subTab === "nova-os" && (
            <NovaOrdemServico />
          )}
          {activeTab === "os" && subTab === "historico-os" && (
            <HistoricoOS />
          )}
          
          {/* Perfil */}
          {activeTab === "perfil" && <PerfilParada stats={stats} />}
        </main>

        {/* Botões Flutuantes - Apenas na aba Paradas/Abertas */}
        {showFloatingButtons && (
          <div className="fixed bottom-44 right-4 z-30 flex flex-col gap-3">
            <Button 
              onClick={() => setIsQrScannerOpen(true)} 
              variant="outline" 
              className="h-14 w-14 rounded-full shadow-xl bg-background border-2" 
              size="icon"
            >
              <Scan className="h-7 w-7" />
            </Button>
            <Button 
              onClick={() => setIsNovaParadaOpen(true)} 
              className="h-14 w-14 rounded-full shadow-xl" 
              size="icon"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNavigationParada 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          badgeCount={openCount}
          subTab={subTab}
          onSubTabChange={setSubTab}
          osBadgeCount={osBadgeCount}
        />

        {/* Modal Deslizante - Nova Parada */}
        <Sheet open={isNovaParadaOpen} onOpenChange={setIsNovaParadaOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4">
            <SheetHeader className="mb-4">
              <SheetTitle>Nova Parada de Máquina</SheetTitle>
            </SheetHeader>
            <NovaParadaMaquina onSuccess={() => setIsNovaParadaOpen(false)} initialData={scannedData} />
          </SheetContent>
        </Sheet>

        {/* Modal QR Scanner */}
        <QrScannerModal isOpen={isQrScannerOpen} onClose={() => setIsQrScannerOpen(false)} onCodeScanned={handleQrCodeScanned} />
      </div>
    </OfflineSyncProvider>
  );
}
