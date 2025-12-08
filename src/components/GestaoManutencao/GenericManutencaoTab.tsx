import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Pencil, LucideIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatsCard from "@/components/StatsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";


interface Item {
  id: string;
  nome: string;
  descricao?: string;
  status: "Ativo" | "Inativo";
  criado_em: any;
}

interface GenericManutencaoTabProps {
  collectionName: string;
  title: string;
  singularTitle: string;
  icon: LucideIcon;
  placeholder?: string;
}

const GenericManutencaoTab = ({ 
  collectionName, 
  title, 
  singularTitle, 
  icon: Icon,
  placeholder 
}: GenericManutencaoTabProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    status: "Ativo" as "Ativo" | "Inativo",
  });
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsRef = collection(db, collectionName);
      const q = query(itemsRef, orderBy("criado_em", "desc"));
      const snapshot = await getDocs(q);
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "Ativo",
      } as Item));
      
      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (error) {
      console.error(`Erro ao buscar ${title.toLowerCase()}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível carregar ${title.toLowerCase()}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [collectionName]);

  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const ativos = items.filter(s => s.status === "Ativo").length;
    const inativos = items.filter(s => s.status === "Inativo").length;

    return { total, ativos, inativos };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: `O nome ${singularTitle.toLowerCase()} é obrigatório.`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        const itemRef = doc(db, collectionName, editingItem.id);
        await updateDoc(itemRef, {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          status: formData.status,
        });
        toast({
          title: "Sucesso",
          description: `${singularTitle} atualizado com sucesso!`,
        });
      } else {
        await addDoc(collection(db, collectionName), {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          status: formData.status,
          criado_em: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: `${singularTitle} criado com sucesso!`,
        });
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error(`Erro ao salvar ${singularTitle.toLowerCase()}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível salvar ${singularTitle.toLowerCase()}.`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      status: "Ativo",
    });
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      descricao: item.descricao || "",
      status: item.status,
    });
    setIsModalOpen(true);
  };


  const handleStatusChange = async (item: Item, newStatus: "Ativo" | "Inativo") => {
    try {
      const itemRef = doc(db, collectionName, item.id);
      await updateDoc(itemRef, { status: newStatus });
      
      toast({
        title: "Sucesso",
        description: `${singularTitle} ${newStatus === "Ativo" ? "ativado" : "desativado"} com sucesso!`,
      });
      
      fetchItems();
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
          title={`Total de ${title}`}
          value={stats.total.toString()}
          icon={<Icon className="h-4 w-4" />}
          description={`${title} cadastrados`}
        />
        <StatsCard
          title={`${title} Ativos`}
          value={stats.ativos.toString()}
          icon={<Icon className="h-4 w-4" />}
          description="Em uso"
        />
        <StatsCard
          title={`${title} Inativos`}
          value={stats.inativos.toString()}
          icon={<Icon className="h-4 w-4" />}
          description="Desativados"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingItem(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo {singularTitle}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? `Editar ${singularTitle}` : `Novo ${singularTitle}`}
                </DialogTitle>
                <DialogDescription>
                  {editingItem 
                    ? `Atualize as informações do ${singularTitle.toLowerCase()}.` 
                    : `Preencha as informações para criar um novo ${singularTitle.toLowerCase()}.`}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder={placeholder || `Nome do ${singularTitle.toLowerCase()}...`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição ou observações..."
                    rows={3}
                  />
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
                      setEditingItem(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Salvar Alterações" : `Criar ${singularTitle}`}
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
          <CardTitle>Lista de {title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando {title.toLowerCase()}...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "todos"
                  ? `Nenhum ${singularTitle.toLowerCase()} encontrado com os filtros aplicados.`
                  : `Nenhum ${singularTitle.toLowerCase()} cadastrado.`}
              </p>
              {!searchTerm && statusFilter === "todos" && (
                <Button onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setIsModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro {singularTitle}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Editar</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {item.descricao || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.status === "Ativo"}
                          onCheckedChange={(checked) => 
                            handleStatusChange(item, checked ? "Ativo" : "Inativo")
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

export default GenericManutencaoTab;
