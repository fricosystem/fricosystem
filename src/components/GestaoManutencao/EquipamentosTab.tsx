import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Pencil, Cog, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatsCard from "@/components/StatsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Equipamento {
  id: string;
  equipamento: string;
  patrimonio: string;
  setor: string;
  tag: string;
  imagemUrl?: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
  createdAt: any;
  updatedAt: any;
  // Campos de auditoria/versionamento
  versao?: number;
  historico?: HistoricoVersao[];
  criadoPor?: string;
  atualizadoPor?: string;
}

interface HistoricoVersao {
  versao: number;
  data: any;
  usuario?: string;
  alteracoes: {
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  }[];
}

interface Setor {
  id: string;
  nome: string;
}

const EquipamentosTab = () => {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Equipamento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [setorFilter, setSetorFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);
  
  const [formData, setFormData] = useState({
    equipamento: "",
    patrimonio: "",
    setor: "",
    tag: "",
    descricao: "",
    status: "Ativa" as "Ativa" | "Inativa",
  });
  const { toast } = useToast();

  const fetchSetores = async () => {
    try {
      // Buscar setores únicos dos equipamentos
      const equipamentosRef = collection(db, "equipamentos");
      const snapshot = await getDocs(equipamentosRef);
      
      const setoresUnicos = new Set<string>();
      snapshot.docs.forEach(doc => {
        const setor = doc.data().setor;
        if (setor) setoresUnicos.add(setor);
      });
      
      setSetores(Array.from(setoresUnicos).map((nome, index) => ({
        id: String(index),
        nome
      })));
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
    }
  };

  const fetchEquipamentos = async () => {
    try {
      setLoading(true);
      const equipamentosRef = collection(db, "equipamentos");
      const snapshot = await getDocs(equipamentosRef);
      
      const equipamentosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          equipamento: data.equipamento || "",
          patrimonio: data.patrimonio || "",
          setor: data.setor || "",
          tag: data.tag || "",
          imagemUrl: data.imagemUrl || "",
          status: data.status || "Ativa",
          descricao: data.descricao || "",
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          versao: data.versao || 1,
          historico: data.historico || [],
          criadoPor: data.criadoPor || "",
          atualizadoPor: data.atualizadoPor || "",
        } as Equipamento;
      });
      
      // Ordenar por data de criação (mais recentes primeiro)
      equipamentosData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      setEquipamentos(equipamentosData);
      setFilteredEquipamentos(equipamentosData);
    } catch (error) {
      console.error("Erro ao buscar equipamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipamentos();
    fetchSetores();
  }, []);

  useEffect(() => {
    let filtered = equipamentos;

    if (searchTerm) {
      filtered = filtered.filter(eq => 
        eq.equipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.setor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(eq => eq.status === statusFilter);
    }

    if (setorFilter !== "todos") {
      filtered = filtered.filter(eq => eq.setor === setorFilter);
    }

    setFilteredEquipamentos(filtered);
  }, [equipamentos, searchTerm, statusFilter, setorFilter]);

  const stats = useMemo(() => {
    const total = equipamentos.length;
    const ativos = equipamentos.filter(e => e.status === "Ativa").length;
    const inativos = equipamentos.filter(e => e.status === "Inativa").length;
    const setoresCount = new Set(equipamentos.map(e => e.setor)).size;

    return { total, ativos, inativos, setoresCount };
  }, [equipamentos]);

  const criarRegistroHistorico = (
    equipamentoAntigo: Equipamento,
    novosDados: typeof formData
  ): HistoricoVersao => {
    const alteracoes: HistoricoVersao["alteracoes"] = [];

    if (equipamentoAntigo.equipamento !== novosDados.equipamento) {
      alteracoes.push({
        campo: "Nome do Equipamento",
        valorAnterior: equipamentoAntigo.equipamento,
        valorNovo: novosDados.equipamento,
      });
    }
    if (equipamentoAntigo.patrimonio !== novosDados.patrimonio) {
      alteracoes.push({
        campo: "Patrimônio",
        valorAnterior: equipamentoAntigo.patrimonio,
        valorNovo: novosDados.patrimonio,
      });
    }
    if (equipamentoAntigo.setor !== novosDados.setor) {
      alteracoes.push({
        campo: "Setor",
        valorAnterior: equipamentoAntigo.setor,
        valorNovo: novosDados.setor,
      });
    }
    if (equipamentoAntigo.tag !== novosDados.tag) {
      alteracoes.push({
        campo: "Tag",
        valorAnterior: equipamentoAntigo.tag,
        valorNovo: novosDados.tag,
      });
    }
    if (equipamentoAntigo.descricao !== novosDados.descricao) {
      alteracoes.push({
        campo: "Descrição",
        valorAnterior: equipamentoAntigo.descricao || "",
        valorNovo: novosDados.descricao,
      });
    }
    if (equipamentoAntigo.status !== novosDados.status) {
      alteracoes.push({
        campo: "Status",
        valorAnterior: equipamentoAntigo.status,
        valorNovo: novosDados.status,
      });
    }

    return {
      versao: (equipamentoAntigo.versao || 1) + 1,
      data: Timestamp.now(),
      alteracoes,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipamento.trim()) {
      toast({
        title: "Erro",
        description: "O nome do equipamento é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.setor) {
      toast({
        title: "Erro",
        description: "Selecione um setor.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEquipamento) {
        // Criar registro de histórico
        const novoHistorico = criarRegistroHistorico(editingEquipamento, formData);
        const historicoAtualizado = [...(editingEquipamento.historico || []), novoHistorico];

        const equipamentoRef = doc(db, "equipamentos", editingEquipamento.id);
        await updateDoc(equipamentoRef, {
          equipamento: formData.equipamento.trim(),
          patrimonio: formData.patrimonio.trim(),
          setor: formData.setor,
          tag: formData.tag.trim(),
          descricao: formData.descricao.trim(),
          status: formData.status,
          updatedAt: serverTimestamp(),
          versao: novoHistorico.versao,
          historico: historicoAtualizado,
        });

        toast({
          title: "Sucesso",
          description: `Equipamento atualizado com sucesso! (Versão ${novoHistorico.versao})`,
        });
      } else {
        await addDoc(collection(db, "equipamentos"), {
          equipamento: formData.equipamento.trim(),
          patrimonio: formData.patrimonio.trim(),
          setor: formData.setor,
          tag: formData.tag.trim(),
          descricao: formData.descricao.trim(),
          status: formData.status,
          imagemUrl: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          versao: 1,
          historico: [],
        });

        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingEquipamento(null);
      resetForm();
      fetchEquipamentos();
      fetchSetores();
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o equipamento.",
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
      descricao: "",
      status: "Ativa",
    });
  };

  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento);
    setFormData({
      equipamento: equipamento.equipamento,
      patrimonio: equipamento.patrimonio,
      setor: equipamento.setor,
      tag: equipamento.tag,
      descricao: equipamento.descricao || "",
      status: equipamento.status,
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (equipamento: Equipamento, newStatus: "Ativa" | "Inativa") => {
    try {
      const novoHistorico = criarRegistroHistorico(equipamento, {
        ...formData,
        equipamento: equipamento.equipamento,
        patrimonio: equipamento.patrimonio,
        setor: equipamento.setor,
        tag: equipamento.tag,
        descricao: equipamento.descricao || "",
        status: newStatus,
      });
      
      const historicoAtualizado = [...(equipamento.historico || []), novoHistorico];

      const equipamentoRef = doc(db, "equipamentos", equipamento.id);
      await updateDoc(equipamentoRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
        versao: novoHistorico.versao,
        historico: historicoAtualizado,
      });
      
      toast({
        title: "Sucesso",
        description: `Equipamento ${newStatus === "Ativa" ? "ativado" : "desativado"} com sucesso!`,
      });
      
      fetchEquipamentos();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };


  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Equipamentos"
          value={stats.total.toString()}
          icon={<Cog className="h-4 w-4" />}
          description="Equipamentos cadastrados"
        />
        <StatsCard
          title="Equipamentos Ativos"
          value={stats.ativos.toString()}
          icon={<Cog className="h-4 w-4" />}
          description="Em funcionamento"
        />
        <StatsCard
          title="Equipamentos Inativos"
          value={stats.inativos.toString()}
          icon={<Cog className="h-4 w-4" />}
          description="Desativados"
        />
        <StatsCard
          title="Setores"
          value={stats.setoresCount.toString()}
          icon={<Cog className="h-4 w-4" />}
          description="Com equipamentos"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nome, patrimônio, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Ativa">Ativos</SelectItem>
              <SelectItem value="Inativa">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={setorFilter} onValueChange={setSetorFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filtrar por Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Setores</SelectItem>
              {setores.map((setor) => (
                <SelectItem key={setor.id} value={setor.nome}>
                  {setor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEquipamentos}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEquipamento(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEquipamento ? "Editar Equipamento" : "Novo Equipamento"}
                </DialogTitle>
                <DialogDescription>
                  {editingEquipamento 
                    ? `Atualize as informações do equipamento. Versão atual: ${editingEquipamento.versao || 1}` 
                    : "Preencha as informações para criar um novo equipamento."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipamento">Nome do Equipamento *</Label>
                  <Input
                    id="equipamento"
                    value={formData.equipamento}
                    onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                    placeholder="Ex: Compressor de Ar, Motor Principal..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patrimonio">Patrimônio</Label>
                    <Input
                      id="patrimonio"
                      value={formData.patrimonio}
                      onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                      placeholder="Código do patrimônio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <Input
                      id="tag"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      placeholder="Tag de identificação"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">Setor *</Label>
                  <Select
                    value={formData.setor}
                    onValueChange={(value) => setFormData({ ...formData, setor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {setores.length === 0 ? (
                        <SelectItem value="empty" disabled>Nenhum setor encontrado</SelectItem>
                      ) : (
                        setores.map((setor) => (
                          <SelectItem key={setor.id} value={setor.nome}>
                            {setor.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value: "Ativa" | "Inativa") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativo</SelectItem>
                      <SelectItem value="Inativa">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingEquipamento(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEquipamento ? "Salvar Alterações" : "Criar Equipamento"}
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
          <CardTitle>Lista de Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando equipamentos...</p>
            </div>
          ) : filteredEquipamentos.length === 0 ? (
            <div className="text-center py-12">
              <Cog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "todos" || setorFilter !== "todos"
                  ? "Nenhum equipamento encontrado com os filtros aplicados."
                  : "Nenhum equipamento cadastrado."}
              </p>
              {!searchTerm && statusFilter === "todos" && setorFilter === "todos" && (
                <Button onClick={() => {
                  setEditingEquipamento(null);
                  resetForm();
                  setIsModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Equipamento
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipamentos.map((equipamento) => (
                    <TableRow key={equipamento.id}>
                      <TableCell className="font-medium">{equipamento.equipamento}</TableCell>
                      <TableCell>{equipamento.patrimonio || "-"}</TableCell>
                      <TableCell>{equipamento.setor}</TableCell>
                      <TableCell>{equipamento.tag || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={equipamento.status === "Ativa" ? "default" : "secondary"}>
                          {equipamento.status === "Ativa" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(equipamento)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={equipamento.status === "Ativa" ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleStatusChange(equipamento, equipamento.status === "Ativa" ? "Inativa" : "Ativa")}
                          >
                            {equipamento.status === "Ativa" ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
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

export default EquipamentosTab;
