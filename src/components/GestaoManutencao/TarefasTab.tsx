import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ClipboardList, Search, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NovaTarefaModal } from "@/components/ManutencaoPreventiva/NovaTarefaModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatsCard from "@/components/StatsCard";

interface Tarefa {
  id: string;
  tipo: string;
  maquinaId: string;
  maquinaNome: string;
  setor?: string;
  periodoLabel: string;
  sistema?: string;
  subconjunto?: string;
  componente?: string;
  descricaoTarefa: string;
  manutentorId?: string;
  manutentorNome?: string;
  proximaExecucao: string;
  dataHoraAgendada?: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: "pendente" | "em_andamento" | "concluida" | "cancelada";
  ativo: boolean;
  createdAt: any;
}

const prioridadeColors = {
  baixa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  media: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  critica: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const statusColors = {
  pendente: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  em_andamento: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  concluida: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelada: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const TarefasTab = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const fetchTarefas = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "tarefas_manutencao"), orderBy("proximaExecucao", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ativo: docSnap.data().ativo !== false,
        ...docSnap.data(),
      })) as Tarefa[];
      setTarefas(data);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarefas();
  }, []);

  const stats = useMemo(() => {
    const total = tarefas.length;
    const ativos = tarefas.filter(t => t.ativo).length;
    const inativos = tarefas.filter(t => !t.ativo).length;
    const pendentes = tarefas.filter(t => t.status === "pendente").length;

    return { total, ativos, inativos, pendentes };
  }, [tarefas]);

  const handleToggleAtivo = async (tarefa: Tarefa) => {
    try {
      await updateDoc(doc(db, "tarefas_manutencao", tarefa.id), {
        ativo: !tarefa.ativo,
        updatedAt: new Date(),
      });
      toast.success(tarefa.ativo ? "Tarefa desativada" : "Tarefa ativada");
      fetchTarefas();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const filteredTarefas = tarefas.filter((t) => {
    const matchesSearch = t.descricaoTarefa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maquinaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.manutentorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tipo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "ativo" && t.ativo) || 
      (statusFilter === "inativo" && !t.ativo);
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Tarefas"
          value={stats.total.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Tarefas cadastradas"
        />
        <StatsCard
          title="Tarefas Ativas"
          value={stats.ativos.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Em operação"
        />
        <StatsCard
          title="Tarefas Inativas"
          value={stats.inativos.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Desativadas"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pendentes.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Aguardando execução"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: "todos" | "ativo" | "inativo") => setStatusFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTarefas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Manutentor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTarefas.map((tarefa) => (
                    <TableRow key={tarefa.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {tarefa.descricaoTarefa}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tarefa.maquinaNome}</p>
                          {tarefa.setor && (
                            <p className="text-xs text-muted-foreground">{tarefa.setor}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{tarefa.tipo}</TableCell>
                      <TableCell>{tarefa.periodoLabel}</TableCell>
                      <TableCell>{tarefa.manutentorNome || "-"}</TableCell>
                      <TableCell>{formatDate(tarefa.proximaExecucao)}</TableCell>
                      <TableCell>
                        <Badge className={prioridadeColors[tarefa.prioridade] || prioridadeColors.media}>
                          {tarefa.prioridade?.charAt(0).toUpperCase() + tarefa.prioridade?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[tarefa.status] || statusColors.pendente}>
                          {statusLabels[tarefa.status] || "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={tarefa.ativo}
                          onCheckedChange={() => handleToggleAtivo(tarefa)}
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

      <NovaTarefaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchTarefas}
      />
    </div>
  );
};

export default TarefasTab;