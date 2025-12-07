import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, ClipboardList, Search, Loader2, Trash2 } from "lucide-react";
import { NovaTarefaModal } from "@/components/ManutencaoPreventiva/NovaTarefaModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tarefaToDelete, setTarefaToDelete] = useState<Tarefa | null>(null);

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

  const handleDelete = async () => {
    if (!tarefaToDelete) return;
    
    try {
      await deleteDoc(doc(db, "tarefas_manutencao", tarefaToDelete.id));
      toast.success("Tarefa excluída com sucesso");
      fetchTarefas();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    } finally {
      setTarefaToDelete(null);
    }
  };

  const handleStatusChange = async (tarefa: Tarefa, newStatus: Tarefa["status"]) => {
    try {
      await updateDoc(doc(db, "tarefas_manutencao", tarefa.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success("Status atualizado com sucesso");
      fetchTarefas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredTarefas = tarefas.filter((t) =>
    t.descricaoTarefa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.maquinaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.manutentorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tarefas de Manutenção
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                            variant="destructive"
                            size="sm"
                            onClick={() => setTarefaToDelete(tarefa)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={!!tarefaToDelete} onOpenChange={() => setTarefaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{tarefaToDelete?.descricaoTarefa}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TarefasTab;