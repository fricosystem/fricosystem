import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2 } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ManualCard from "@/components/Manuais/ManualCard";
import ManuaisViewerModal from "@/components/Manuais/ManuaisViewerModal";
import AddManualModal from "@/components/Manuais/AddManualModal";
import EditManualModal from "@/components/Manuais/EditManualModal";
import ManuaisFilterBar, { ManuaisFilterState } from "@/components/Manuais/ManuaisFilterBar";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Manual {
  id: string;
  titulo: string;
  subtitulo: string;
  imagens: string[];
  capaUrl: string;
  ativo: boolean;
  dataCriacao: string;
  // Legacy field for backwards compatibility
  pdfUrl?: string;
}

const Manuais = () => {
  const [manuais, setManuais] = useState<Manual[]>([]);
  const [filteredManuais, setFilteredManuais] = useState<Manual[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ManuaisFilterState>({ status: "ativos" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchManuais();
  }, []);

  useEffect(() => {
    if (!manuais) return;

    const filtered = manuais.filter((manual) => {
      // Filtrar por status
      if (filters.status === "ativos" && !manual.ativo) return false;
      if (filters.status === "inativos" && manual.ativo) return false;

      // Filtrar por busca
      const searchLower = searchTerm.toLowerCase();
      return (
        manual.titulo.toLowerCase().includes(searchLower) ||
        manual.subtitulo.toLowerCase().includes(searchLower)
      );
    });

    setFilteredManuais(filtered);
  }, [searchTerm, manuais, filters]);

  const fetchManuais = async () => {
    try {
      setLoading(true);
      const manuaisRef = collection(db, "pdf_manuais");
      const manuaisQuery = query(manuaisRef, orderBy("dataCriacao", "desc"));
      const snapshot = await getDocs(manuaisQuery);
      
      const manuaisData: Manual[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        titulo: doc.data().titulo || "",
        subtitulo: doc.data().subtitulo || "",
        imagens: doc.data().imagens || [],
        capaUrl: doc.data().capaUrl || "",
        ativo: doc.data().ativo !== false,
        dataCriacao: doc.data().dataCriacao || new Date().toISOString(),
        pdfUrl: doc.data().pdfUrl || "",
      }));

      setManuais(manuaisData);
      setFilteredManuais(manuaisData.filter(m => m.ativo));
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar manuais:", err);
      setError("Falha ao carregar manuais");
      toast({
        title: "Erro",
        description: "Falha ao carregar manuais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (manual: Manual) => {
    setSelectedManual(manual);
    setIsViewerOpen(true);
  };

  const handleEdit = (manual: Manual) => {
    setSelectedManual(manual);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (manual: Manual) => {
    try {
      const manualRef = doc(db, "pdf_manuais", manual.id);
      await updateDoc(manualRef, { ativo: !manual.ativo });
      
      setManuais(manuais.map((m) =>
        m.id === manual.id ? { ...m, ativo: !m.ativo } : m
      ));

      toast({
        description: `Manual ${manual.ativo ? "desativado" : "ativado"} com sucesso!`,
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do manual",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
          <Button className="mt-4" onClick={fetchManuais}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (manuais.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhum manual cadastrado</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar primeiro manual
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou subtítulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {isMobile ? "Adicionar" : "Adicionar Manual"}
            </Button>
          </div>

          <ManuaisFilterBar onFiltersChange={setFilters} />
        </div>

        {filteredManuais.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum manual encontrado" : "Nenhum manual nesta categoria"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredManuais.map((manual) => (
              <ManualCard
                key={manual.id}
                manual={manual}
                onClick={() => handleCardClick(manual)}
                onEdit={() => handleEdit(manual)}
                onToggleStatus={() => handleToggleStatus(manual)}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <AppLayout title="Manuais">
      <div className="h-full flex flex-col w-full max-w-full overflow-hidden">
        {renderContent()}

        <AddManualModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchManuais}
        />

        {selectedManual && (
          <>
            <EditManualModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedManual(null);
              }}
              manual={selectedManual}
              onSuccess={fetchManuais}
            />

            <ManuaisViewerModal
              isOpen={isViewerOpen}
              onClose={() => {
                setIsViewerOpen(false);
                setSelectedManual(null);
              }}
              imagens={selectedManual.imagens}
              titulo={`${selectedManual.titulo} - ${selectedManual.subtitulo}`}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Manuais;
