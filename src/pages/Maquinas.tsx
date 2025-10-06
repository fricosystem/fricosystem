import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Camera, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CameraModal from "@/components/CameraModal";

interface Maquina {
  id: string;
  nome: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
  dataCriacao: any;
  dataAtualizacao: any;
}

const Maquinas = () => {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [filteredMaquinas, setFilteredMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    imagemUrl: "",
    status: "Ativa" as "Ativa" | "Inativa",
    descricao: "",
  });
  const { toast } = useToast();

  const fetchMaquinas = async () => {
    try {
      setLoading(true);
      const maquinasRef = collection(db, "maquinas");
      const q = query(maquinasRef, orderBy("dataCriacao", "desc"));
      const snapshot = await getDocs(q);
      
      const maquinasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Maquina));
      
      setMaquinas(maquinasData);
      setFilteredMaquinas(maquinasData);
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as máquinas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaquinas();
  }, []);

  // Memoiza a filtragem para evitar recálculos desnecessários
  const filteredMaquinasData = useMemo(() => {
    let filtered = maquinas;

    if (searchTerm) {
      filtered = filtered.filter(maquina => 
        maquina.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todas") {
      filtered = filtered.filter(maquina => maquina.status === statusFilter);
    }

    return filtered;
  }, [maquinas, searchTerm, statusFilter]);

  useEffect(() => {
    setFilteredMaquinas(filteredMaquinasData);
  }, [filteredMaquinasData]);

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
        const maquinaRef = doc(db, "maquinas", editingMaquina.id);
        await updateDoc(maquinaRef, {
          ...formData,
          dataAtualizacao: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Máquina atualizada com sucesso!",
        });
      } else {
        await addDoc(collection(db, "maquinas"), {
          ...formData,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Máquina cadastrada com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingMaquina(null);
      resetForm();
      fetchMaquinas();
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
      nome: "",
      imagemUrl: "",
      status: "Ativa",
      descricao: "",
    });
  };

  const handleEdit = useCallback((maquina: Maquina) => {
    setEditingMaquina(maquina);
    setFormData({
      nome: maquina.nome,
      imagemUrl: maquina.imagemUrl,
      status: maquina.status,
      descricao: maquina.descricao || "",
    });
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta máquina?")) return;
    
    try {
      await deleteDoc(doc(db, "maquinas", id));
      toast({
        title: "Sucesso",
        description: "Máquina excluída com sucesso!",
      });
      fetchMaquinas();
    } catch (error) {
      console.error("Erro ao excluir máquina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a máquina.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handlePhotoTaken = useCallback((imageUrl: string) => {
    setFormData(prev => ({ ...prev, imagemUrl: imageUrl }));
    setIsCameraOpen(false);
    toast({
      title: "Foto capturada",
      description: "A foto foi salva com sucesso!",
    });
  }, [toast]);

  // Memoiza as estatísticas
  const stats = useMemo(() => ({
    total: maquinas.length,
    ativas: maquinas.filter(m => m.status === "Ativa").length,
    inativas: maquinas.filter(m => m.status === "Inativa").length,
  }), [maquinas]);

  return (
    <AppLayout title="Gerenciador de Máquinas">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Máquinas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as máquinas da empresa
            </p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setEditingMaquina(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Máquina
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Máquinas</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máquinas Ativas</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máquinas Inativas</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inativas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar máquinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="Ativa">Ativas</SelectItem>
              <SelectItem value="Inativa">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Máquinas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando máquinas...</p>
          </div>
        ) : filteredMaquinas.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "todas" 
                ? "Nenhuma máquina encontrada com os filtros aplicados."
                : "Nenhuma máquina cadastrada. Adicione sua primeira máquina!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMaquinas.map((maquina) => (
              <Card key={maquina.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <img 
                    src={maquina.imagemUrl} 
                    alt={maquina.nome}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={maquina.status === "Ativa" ? "default" : "secondary"}>
                      {maquina.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{maquina.nome}</CardTitle>
                  {maquina.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {maquina.descricao}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => window.location.href = `/maquinas/${maquina.id}`}
                      className="w-full"
                    >
                      Ver Detalhes
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(maquina)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(maquina.id)}
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                <Label htmlFor="nome">Nome da Máquina *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Torno CNC"
                  required
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
