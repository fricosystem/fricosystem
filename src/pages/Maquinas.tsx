import { useState, useEffect, useCallback } from "react";
import { Plus, Camera, Check, Search, ArrowLeft } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { addDoc, updateDoc, doc, deleteDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import CameraModal from "@/components/CameraModal";
import MaquinasDoSetor from "@/components/Maquinas/MaquinasDoSetor";
import { useEquipamentos } from "@/contexts/EquipamentosContext";

interface Maquina {
  id: string;
  equipamento: string;
  patrimonio: string;
  setor: string;
  tag: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
  createdAt: any;
  updatedAt: any;
}

const Maquinas = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setorSelecionado = searchParams.get("setor");
  
  const { maquinas, equipamentos, loading, fetchData, invalidateCache } = useEquipamentos();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>("");
  const [formData, setFormData] = useState({
    equipamento: "",
    patrimonio: "",
    setor: "",
    tag: "",
    imagemUrl: "",
    status: "Ativa" as "Ativa" | "Inativa",
    descricao: "",
  });
  const { toast } = useToast();

  // Redireciona para setores se não tiver setor selecionado
  useEffect(() => {
    if (!setorSelecionado) {
      navigate("/setores", { replace: true });
    }
  }, [setorSelecionado, navigate]);

  // Carrega dados ao montar (usa cache se disponível)
  useEffect(() => {
    if (setorSelecionado) {
      fetchData();
    }
  }, [setorSelecionado, fetchData]);

  const refreshData = useCallback(() => {
    invalidateCache();
    fetchData(true);
  }, [invalidateCache, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagemUrl) {
      toast({
        title: "Erro",
        description: "É necessário tirar uma foto da máquina.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingMaquina) {
        const equipamentoRef = doc(db, "equipamentos", editingMaquina.id);
        await updateDoc(equipamentoRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Máquina atualizada com sucesso!",
        });
      } else {
        await addDoc(collection(db, "equipamentos"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Máquina cadastrada com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingMaquina(null);
      resetForm();
      refreshData();
    } catch (error) {
      console.error("Erro ao salvar máquina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a máquina.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      equipamento: "",
      patrimonio: "",
      setor: "",
      tag: "",
      imagemUrl: "",
      status: "Ativa",
      descricao: "",
    });
    setEquipamentoSelecionado("");
  };

  const handleEdit = useCallback((maquina: Maquina) => {
    setEditingMaquina(maquina);
    setFormData({
      equipamento: maquina.equipamento,
      patrimonio: maquina.patrimonio,
      setor: maquina.setor,
      tag: maquina.tag,
      imagemUrl: maquina.imagemUrl,
      status: maquina.status,
      descricao: maquina.descricao || "",
    });
    setEquipamentoSelecionado(maquina.equipamento);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta máquina?")) return;
    
    try {
      await deleteDoc(doc(db, "equipamentos", id));
      toast({
        title: "Sucesso",
        description: "Máquina excluída com sucesso!",
      });
      refreshData();
    } catch (error) {
      console.error("Erro ao excluir máquina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a máquina.",
        variant: "destructive",
      });
    }
  }, [toast, refreshData]);

  const handleRename = useCallback(async (id: string, novoNome: string) => {
    try {
      const equipamentoRef = doc(db, "equipamentos", id);
      await updateDoc(equipamentoRef, {
        equipamento: novoNome,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Sucesso",
        description: "Nome da máquina atualizado com sucesso!",
      });
      refreshData();
    } catch (error) {
      console.error("Erro ao renomear máquina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear a máquina.",
        variant: "destructive",
      });
    }
  }, [toast, refreshData]);

  const handlePhotoTaken = useCallback((imageUrl: string) => {
    setFormData(prev => ({ ...prev, imagemUrl: imageUrl }));
    setIsCameraOpen(false);
    toast({
      title: "Foto capturada",
      description: "A foto foi salva com sucesso!",
    });
  }, [toast]);

  const handleAddMaquina = () => {
    resetForm();
    setEditingMaquina(null);
    setIsModalOpen(true);
  };

  if (!setorSelecionado) {
    return null;
  }

  if (loading) {
    return (
      <AppLayout title="Máquinas">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Máquinas">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate("/setores")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Máquinas</h1>
              <p className="text-muted-foreground mt-1">
                Setor: {setorSelecionado}
              </p>
            </div>
          </div>
          <Button onClick={handleAddMaquina} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Máquina
          </Button>
        </div>

        {/* Conteúdo */}
        <MaquinasDoSetor
          setor={setorSelecionado}
          maquinas={maquinas}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onVoltar={() => navigate("/setores")}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onVerDetalhes={(id) => navigate(`/maquinas/${id}`)}
          onRename={handleRename}
        />

        {/* Modal de Cadastro */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingMaquina ? "Editar Máquina" : "Nova Máquina"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equipamento">Equipamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !equipamentoSelecionado && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      {loading
                        ? "Carregando equipamentos..."
                        : equipamentoSelecionado
                          ? equipamentos.find(e => e.equipamento === equipamentoSelecionado)?.patrimonio + " - " + equipamentoSelecionado
                          : "Selecione o equipamento"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar equipamento..." className="h-9" />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                        <CommandGroup>
                          {equipamentos.map((equipamento) => (
                            <CommandItem
                              key={equipamento.id}
                              value={`${equipamento.patrimonio} ${equipamento.equipamento} ${equipamento.setor} ${equipamento.tag}`}
                              onSelect={() => {
                               setEquipamentoSelecionado(equipamento.equipamento);
                                setFormData(prev => ({
                                  ...prev,
                                  equipamento: equipamento.equipamento,
                                  patrimonio: equipamento.patrimonio,
                                  setor: equipamento.setor,
                                  tag: equipamento.tag,
                                }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  equipamentoSelecionado === equipamento.equipamento
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{equipamento.patrimonio} - {equipamento.equipamento}</span>
                                <span className="text-xs text-muted-foreground">
                                  Setor: {equipamento.setor} | Tag: {equipamento.tag}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patrimonio">Patrimônio</Label>
                  <Input
                    id="patrimonio"
                    value={formData.patrimonio}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag</Label>
                  <Input
                    id="tag"
                    value={formData.tag}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Input
                  id="setor"
                  value={formData.setor}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Foto da Máquina *</Label>
                {formData.imagemUrl ? (
                  <div className="space-y-2">
                    <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={formData.imagemUrl} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tirar Nova Foto
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full h-24 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Tirar Foto</span>
                    </div>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "Ativa" | "Inativa") => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Informações adicionais sobre a máquina..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingMaquina(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingMaquina ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Camera Modal */}
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onPhotoTaken={handlePhotoTaken}
        />
      </div>
    </AppLayout>
  );
};

export default Maquinas;
