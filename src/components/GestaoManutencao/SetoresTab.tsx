import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Pencil, Factory } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatsCard from "@/components/StatsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";


interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  status: "Ativo" | "Inativo";
  criado_em: any;
}

interface Unidade {
  id: string;
  nome: string;
  status?: string;
}

const SetoresTab = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [filteredSetores, setFilteredSetores] = useState<Setor[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [unidadeFilter, setUnidadeFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    unidade: "",
    status: "Ativo" as "Ativo" | "Inativo",
  });
  const { toast } = useToast();

  const fetchUnidades = async () => {
    try {
      setLoadingUnidades(true);
      const unidadesRef = collection(db, "unidades");
      const q = query(unidadesRef, orderBy("nome", "asc"));
      const snapshot = await getDocs(q);
      
      const unidadesData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || "",
        status: doc.data().status || "Ativa",
      } as Unidade));
      
      setUnidades(unidadesData);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades.",
        variant: "destructive",
      });
    } finally {
      setLoadingUnidades(false);
    }
  };

  const fetchSetores = async () => {
    try {
      setLoading(true);
      const setoresRef = collection(db, "setores");
      const q = query(setoresRef, orderBy("criado_em", "desc"));
      const snapshot = await getDocs(q);
      
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "Ativo",
      } as Setor));
      
      setSetores(setoresData);
      setFilteredSetores(setoresData);
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
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
    fetchSetores();
    fetchUnidades();
  }, []);

  useEffect(() => {
    let filtered = setores;

    if (searchTerm) {
      filtered = filtered.filter(setor => 
        setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setor.unidade.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(setor => setor.status === statusFilter);
    }

    if (unidadeFilter !== "todas") {
      filtered = filtered.filter(setor => setor.unidade === unidadeFilter);
    }

    setFilteredSetores(filtered);
  }, [setores, searchTerm, statusFilter, unidadeFilter]);

  const stats = useMemo(() => {
    const total = setores.length;
    const ativos = setores.filter(s => s.status === "Ativo").length;
    const inativos = setores.filter(s => s.status === "Inativo").length;

    return {
      total,
      ativos,
      inativos,
    };
  }, [setores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do setor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unidade) {
      toast({
        title: "Erro",
        description: "Selecione uma unidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingSetor) {
        const setorRef = doc(db, "setores", editingSetor.id);
        await updateDoc(setorRef, {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          unidade: formData.unidade,
          status: formData.status,
        });
        toast({
          title: "Sucesso",
          description: "Setor atualizado com sucesso!",
        });
      } else {
        await addDoc(collection(db, "setores"), {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          unidade: formData.unidade,
          status: formData.status,
          criado_em: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Setor criado com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingSetor(null);
      resetForm();
      fetchSetores();
    } catch (error) {
      console.error("Erro ao salvar setor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o setor.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      unidade: "",
      status: "Ativo",
    });
  };

  const handleEdit = (setor: Setor) => {
    setEditingSetor(setor);
    setFormData({
      nome: setor.nome,
      descricao: setor.descricao || "",
      unidade: setor.unidade,
      status: setor.status,
    });
    setIsModalOpen(true);
  };


  const handleStatusChange = async (setor: Setor, newStatus: "Ativo" | "Inativo") => {
    try {
      const setorRef = doc(db, "setores", setor.id);
      await updateDoc(setorRef, {
        status: newStatus,
      });
      
      toast({
        title: "Sucesso",
        description: `Setor ${newStatus === "Ativo" ? "ativado" : "desativado"} com sucesso!`,
      });
      
      fetchSetores();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total de Setores"
          value={stats.total.toString()}
          icon={<Factory className="h-4 w-4" />}
          description="Setores cadastrados"
        />
        <StatsCard
          title="Setores Ativos"
          value={stats.ativos.toString()}
          icon={<Factory className="h-4 w-4" />}
          description="Em funcionamento"
        />
        <StatsCard
          title="Setores Inativos"
          value={stats.inativos.toString()}
          icon={<Factory className="h-4 w-4" />}
          description="Desativados"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nome ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Setores</SelectItem>
              <SelectItem value="Ativo">Setores Ativos</SelectItem>
              <SelectItem value="Inativo">Setores Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filtrar por Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Unidades</SelectItem>
              {unidades.map((unidade) => (
                <SelectItem key={unidade.id} value={unidade.nome}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchSetores();
              fetchUnidades();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSetor(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Setor
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSetor ? "Editar Setor" : "Novo Setor"}
                </DialogTitle>
                <DialogDescription>
                  {editingSetor ? "Atualize as informações do setor." : "Preencha as informações para criar um novo setor."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Setor *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Produção, Manutenção, Almoxarifado..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição ou observações sobre o setor..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade *</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingUnidades ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : unidades.length === 0 ? (
                        <SelectItem value="empty" disabled>Nenhuma unidade cadastrada</SelectItem>
                      ) : (
                        unidades.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.nome}>
                            {unidade.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Ativo" | "Inativo") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSetor(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSetor ? "Salvar Alterações" : "Criar Setor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Setores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando setores...</p>
            </div>
          ) : filteredSetores.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "todos" || unidadeFilter !== "todas"
                  ? "Nenhum setor encontrado com os filtros aplicados."
                  : "Nenhum setor cadastrado."}
              </p>
              {!searchTerm && statusFilter === "todos" && unidadeFilter === "todas" && (
                <Button onClick={() => {
                  setEditingSetor(null);
                  resetForm();
                  setIsModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Setor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Setor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Editar</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSetores.map((setor) => (
                    <TableRow key={setor.id}>
                      <TableCell className="font-medium">{setor.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{setor.descricao || "-"}</TableCell>
                      <TableCell>{setor.unidade}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(setor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={setor.status === "Ativo"}
                          onCheckedChange={(checked) => 
                            handleStatusChange(setor, checked ? "Ativo" : "Inativo")
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default SetoresTab;
