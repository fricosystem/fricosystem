import { useState, useEffect } from "react";
import { Plus, Factory, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import SetorCard from "@/components/Maquinas/SetorCard";

interface Maquina {
  id: string;
  setor: string;
  status: "Ativa" | "Inativa";
}

interface SetorInfo {
  nome: string;
  total: number;
  ativas: number;
  inativas: number;
}

const Setores = () => {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [novoSetor, setNovoSetor] = useState("");
  const [setorEditando, setSetorEditando] = useState("");
  const [novoNomeSetor, setNovoNomeSetor] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMaquinas = async () => {
    try {
      setLoading(true);
      const equipamentosRef = collection(db, "equipamentos");
      const snapshot = await getDocs(equipamentosRef);
      
      const maquinasData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          setor: data.setor || "",
          status: data.status || "Ativa",
        } as Maquina;
      });
      
      setMaquinas(maquinasData);
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os setores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const setores = (() => {
    const setorMap = new Map<string, SetorInfo>();
    
    maquinas.forEach(maquina => {
      const setor = maquina.setor || "Sem Setor";
      
      if (!setorMap.has(setor)) {
        setorMap.set(setor, {
          nome: setor,
          total: 0,
          ativas: 0,
          inativas: 0
        });
      }
      
      const info = setorMap.get(setor)!;
      info.total++;
      if (maquina.status === "Ativa") {
        info.ativas++;
      } else {
        info.inativas++;
      }
    });
    
    return Array.from(setorMap.values())
      .filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  })();

  const handleSetorSelect = (setor: string) => {
    navigate(`/maquinas?setor=${encodeURIComponent(setor)}`);
  };

  const handleEditSetor = (setor: string) => {
    setSetorEditando(setor);
    setNovoNomeSetor(setor);
    setIsEditModalOpen(true);
  };

  const handleSaveEditSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoNomeSetor.trim()) {
      toast({
        title: "Erro",
        description: "Nome do setor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (novoNomeSetor.trim().toLowerCase() === setorEditando.toLowerCase()) {
      setIsEditModalOpen(false);
      return;
    }

    // Verifica se o novo nome já existe
    const setorExistente = maquinas.some(
      m => m.setor.toLowerCase() === novoNomeSetor.trim().toLowerCase() && 
           m.setor.toLowerCase() !== setorEditando.toLowerCase()
    );

    if (setorExistente) {
      toast({
        title: "Erro",
        description: "Já existe um setor com este nome.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Busca todos os equipamentos do setor antigo e atualiza
      const equipamentosRef = collection(db, "equipamentos");
      const q = query(equipamentosRef, where("setor", "==", setorEditando));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(docSnap => 
        updateDoc(doc(db, "equipamentos", docSnap.id), {
          setor: novoNomeSetor.trim(),
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Sucesso",
        description: "Nome do setor atualizado com sucesso!",
      });

      setIsEditModalOpen(false);
      setSetorEditando("");
      setNovoNomeSetor("");
      fetchMaquinas();
    } catch (error) {
      console.error("Erro ao atualizar setor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome do setor.",
        variant: "destructive",
      });
    }
  };

  const handleAddSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoSetor.trim()) {
      toast({
        title: "Erro",
        description: "Nome do setor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o setor já existe
    const setorExistente = maquinas.some(
      m => m.setor.toLowerCase() === novoSetor.trim().toLowerCase()
    );

    if (setorExistente) {
      toast({
        title: "Erro",
        description: "Este setor já existe.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Cria um equipamento placeholder para o novo setor
      await addDoc(collection(db, "equipamentos"), {
        equipamento: `Equipamento Inicial - ${novoSetor}`,
        patrimonio: "",
        setor: novoSetor.trim(),
        tag: "",
        imagemUrl: "",
        status: "Inativa",
        descricao: "Equipamento placeholder criado automaticamente ao adicionar o setor.",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Sucesso",
        description: "Setor adicionado com sucesso!",
      });

      setIsModalOpen(false);
      setNovoSetor("");
      fetchMaquinas();
    } catch (error) {
      console.error("Erro ao adicionar setor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o setor.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Setores">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Setores</h1>
            <p className="text-muted-foreground mt-1">
              Selecione um setor para visualizar as máquinas
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Setor
          </Button>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando setores...</p>
          </div>
        ) : setores.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Nenhum setor encontrado com este termo." : "Nenhum setor cadastrado."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Setor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{setores.length}</div>
                  <p className="text-sm text-muted-foreground">Setores</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{maquinas.length}</div>
                  <p className="text-sm text-muted-foreground">Total de Máquinas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {maquinas.filter(m => m.status === "Ativa").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Máquinas Ativas</p>
                </CardContent>
              </Card>
            </div>

            {/* Grid de setores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {setores.map((setor) => (
                <SetorCard
                  key={setor.nome}
                  setor={setor.nome}
                  quantidadeMaquinas={setor.total}
                  maquinasAtivas={setor.ativas}
                  maquinasInativas={setor.inativas}
                  onClick={() => handleSetorSelect(setor.nome)}
                  onEdit={handleEditSetor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal Adicionar Setor */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Setor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSetor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeSetor">Nome do Setor *</Label>
                <Input
                  id="nomeSetor"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  placeholder="Ex: Produção, Manutenção, etc."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNovoSetor("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Adicionar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Setor */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Editar Nome do Setor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveEditSetor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editNomeSetor">Nome do Setor *</Label>
                <Input
                  id="editNomeSetor"
                  value={novoNomeSetor}
                  onChange={(e) => setNovoNomeSetor(e.target.value)}
                  placeholder="Ex: Produção, Manutenção, etc."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSetorEditando("");
                    setNovoNomeSetor("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Setores;
