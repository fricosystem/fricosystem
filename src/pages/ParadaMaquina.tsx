import { useState, useEffect } from "react";
import { Bell, ArrowLeft, Plus, ScanQrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NovaParadaMaquina from "@/components/ParadaMaquina/NovaParadaMaquina";
import ListaParadasMaquina from "@/components/ParadaMaquina/ListaParadasMaquina";
import QrScannerModal from "@/components/ParadaMaquina/QrScannerModal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
interface ScannedData {
  setor: string;
  equipamento: string;
}
export default function ParadaMaquina() {
  const navigate = useNavigate();
  const [isNovaParadaOpen, setIsNovaParadaOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const handleQrCodeScanned = async (code: string) => {
    try {
      // Try to parse as JSON first (format: {"setor": "...", "equipamento": "..."})
      let parsed: {
        setor?: string;
        equipamento?: string;
      } | null = null;
      try {
        parsed = JSON.parse(code);
      } catch {
        // If not JSON, treat as equipment name directly
        parsed = {
          equipamento: code
        };
      }

      // Search in equipamentos collection
      const equipamentosRef = collection(db, "equipamentos");
      const snapshot = await getDocs(equipamentosRef);
      let foundEquipamento: {
        equipamento: string;
        setor: string;
      } | null = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        const equipNome = data.equipamento?.toLowerCase() || "";
        const patrimonio = data.patrimonio?.toLowerCase() || "";
        const tag = data.tag?.toLowerCase() || "";
        const searchTerm = (parsed?.equipamento || code).toLowerCase();
        if (equipNome === searchTerm || patrimonio === searchTerm || tag === searchTerm || equipNome.includes(searchTerm) || patrimonio.includes(searchTerm)) {
          foundEquipamento = {
            equipamento: data.equipamento,
            setor: data.setor
          };
        }
      });
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

  // Reset scanned data when form closes
  useEffect(() => {
    if (!isNovaParadaOpen) {
      setScannedData(null);
    }
  }, [isNovaParadaOpen]);
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Parada de Máquina</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Registro de Paradas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative h-11 w-11 sm:h-12 sm:w-12">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal - Lista de Paradas */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto min-h-0">
        <ListaParadasMaquina />
      </main>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-4">
        <Button onClick={() => setIsQrScannerOpen(true)} variant="outline" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg bg-white border-border hover:bg-gray-50" size="icon">
          <ScanQrCode className="sm:h-7 sm:w-7 text-black h-[30px] w-[30px]" />
        </Button>
        <Button onClick={() => setIsNovaParadaOpen(true)} className="h-16 w-16 sm:h-18 sm:w-18 rounded-full shadow-lg" size="icon">
          <Plus className="h-7 w-7 sm:h-8 sm:w-8" />
        </Button>
      </div>

      {/* Modal Deslizante - Nova Parada */}
      <Sheet open={isNovaParadaOpen} onOpenChange={setIsNovaParadaOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-5 sm:p-6">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-lg sm:text-xl">Nova Parada de Máquina</SheetTitle>
          </SheetHeader>
          <NovaParadaMaquina onSuccess={() => setIsNovaParadaOpen(false)} initialData={scannedData} />
        </SheetContent>
      </Sheet>

      {/* Modal QR Scanner */}
      <QrScannerModal isOpen={isQrScannerOpen} onClose={() => setIsQrScannerOpen(false)} onCodeScanned={handleQrCodeScanned} />
    </div>;
}