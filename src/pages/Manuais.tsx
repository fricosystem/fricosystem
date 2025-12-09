import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import PageLayout from "@/components/PageLayout";
import ManualCard from "@/components/Manuais/ManualCard";
import ManuaisViewerModal from "@/components/Manuais/ManuaisViewerModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Manual {
  id: string;
  empresa: string;
  nomeManual: string;
  pdfUrl: string;
  capaUrl?: string;
}

const Manuais = () => {
  const [manuais, setManuais] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchManuais = async () => {
      try {
        const manuaisRef = collection(db, "manuais_biblioteca");
        const snapshot = await getDocs(manuaisRef);
        const manuaisData: Manual[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Manual[];
        setManuais(manuaisData);
      } catch (error) {
        console.error("Erro ao buscar manuais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManuais();
  }, []);

  const filteredManuais = manuais.filter(manual =>
    manual.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.nomeManual.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (manual: Manual) => {
    setSelectedManual(manual);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedManual(null);
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manuais</h1>
            <p className="text-muted-foreground">
              Biblioteca de manuais técnicos e documentos
            </p>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa ou nome do manual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredManuais.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "Nenhum manual encontrado" : "Nenhum manual cadastrado"}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {searchTerm ? "Tente buscar por outro termo" : "Os manuais aparecerão aqui quando forem adicionados"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredManuais.map((manual) => (
              <ManualCard
                key={manual.id}
                empresa={manual.empresa}
                nomeManual={manual.nomeManual}
                capaUrl={manual.capaUrl}
                onClick={() => handleCardClick(manual)}
              />
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {selectedManual && (
        <ManuaisViewerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          pdfUrl={selectedManual.pdfUrl}
          titulo={`${selectedManual.empresa} - ${selectedManual.nomeManual}`}
        />
      )}
    </PageLayout>
  );
};

export default Manuais;
