import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, ClipboardList, RefreshCw, Loader2, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTarefas = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "tarefas_manutencao"), orderBy("proximaExecucao", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
    const pendentes = tarefas.filter(t => t.status === "pendente").length;
    const emAndamento = tarefas.filter(t => t.status === "em_andamento").length;
    const concluidas = tarefas.filter(t => t.status === "concluida").length;

    return { total, pendentes, emAndamento, concluidas };
  }, [tarefas]);

  const filteredTarefas = useMemo(() => {
    let filtered = tarefas;

    if (searchTerm) {
      filtered = filtered.filter((t) =>
        t.descricaoTarefa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.maquinaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.manutentorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (prioridadeFilter !== "todos") {
      filtered = filtered.filter(t => t.prioridade === prioridadeFilter);
    }

    return filtered;
  }, [tarefas, searchTerm, statusFilter, prioridadeFilter]);

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
          title="Pendentes"
          value={stats.pendentes.toString()}
          icon={<Clock className="h-4 w-4" />}
          description="Aguardando execução"
        />
        <StatsCard
          title="Em Andamento"
          value={stats.emAndamento.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Sendo executadas"
        />
        <StatsCard
          title="Concluídas"
          value={stats.concluidas.toString()}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Finalizadas"
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
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Prioridades</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTarefas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTarefas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "todos" || prioridadeFilter !== "todos" 
                ? "Nenhuma tarefa encontrada com os filtros aplicados" 
                : "Nenhuma tarefa cadastrada"}
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
                    <TableHead className="text-right">Ações</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement edit functionality
                              toast.info("Edição em desenvolvimento");
                            }}
                          >
                            <Pencil className="h-4 w-4" />
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

      <NovaTarefaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchTarefas}
      />
    </div>
  );
};

export default TarefasTab;
