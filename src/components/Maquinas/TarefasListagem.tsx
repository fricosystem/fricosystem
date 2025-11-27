import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, CheckCircle, Clock, XCircle, AlertCircle, 
  Edit, Trash2, PlayCircle 
} from "lucide-react";
import { TarefaManutencaoMaquina, StatusTarefa, PeriodoManutencao } from "@/types/typesManutencaoPreventiva";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteTarefaManutencao, cancelarTarefa, registrarExecucaoTarefa } from "@/firebase/manutencaoPreventiva";

interface TarefasListagemProps {
  tarefas: TarefaManutencaoMaquina[];
  stats: {
    total: number;
    pendentes: number;
    emAndamento: number;
    concluidas: number;
    canceladas: number;
    atrasadas: number;
    proximosMes: number;
  };
  filtros: {
    periodo: PeriodoManutencao | "todos";
    status: StatusTarefa | "todos";
    sistema: string;
    busca: string;
  };
  setFiltros: (filtros: any) => void;
  sistemas: string[];
  onAddTarefa: () => void;
  onEditTarefa?: (tarefa: TarefaManutencaoMaquina) => void;
}

export const TarefasListagem = ({
  tarefas,
  stats,
  filtros,
  setFiltros,
  sistemas,
  onAddTarefa,
  onEditTarefa
}: TarefasListagemProps) => {
  const { toast } = useToast();
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);
  const [tarefaParaCancelar, setTarefaParaCancelar] = useState<string | null>(null);

  const getStatusBadge = (status: StatusTarefa, proximaExecucao: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataExecucao = new Date(proximaExecucao);

    if (status === "concluida") {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
    }
    if (status === "em_andamento") {
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Em Andamento</Badge>;
    }
    if (status === "cancelado") {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
    }
    if (status === "pendente" && dataExecucao < hoje) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Atrasada</Badge>;
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTarefaManutencao(id);
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive"
      });
    } finally {
      setTarefaParaDeletar(null);
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      await cancelarTarefa(id, "Cancelada pelo usuário");
      toast({
        title: "Sucesso",
        description: "Tarefa cancelada com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao cancelar tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a tarefa.",
        variant: "destructive"
      });
    } finally {
      setTarefaParaCancelar(null);
    }
  };

  const handleExecutar = async (tarefa: TarefaManutencaoMaquina) => {
    try {
      await registrarExecucaoTarefa(tarefa.id, tarefa.tempoEstimado);
      toast({
        title: "Sucesso",
        description: "Tarefa executada e próxima data agendada!"
      });
    } catch (error) {
      console.error("Erro ao executar tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível executar a tarefa.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atrasadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Próx. 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.proximosMes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.canceladas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tarefas de Manutenção</CardTitle>
            <Button onClick={onAddTarefa}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select value={filtros.periodo} onValueChange={(value) => setFiltros({ ...filtros, periodo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="Diário">Diário</SelectItem>
                <SelectItem value="Semanal">Semanal</SelectItem>
                <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Bimestral">Bimestral</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Semestral">Semestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelado">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.sistema} onValueChange={(value) => setFiltros({ ...filtros, sistema: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Sistemas</SelectItem>
                {sistemas.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Componente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Manutentor</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarefas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  tarefas.map((tarefa) => (
                    <TableRow key={tarefa.id}>
                      <TableCell>{getStatusBadge(tarefa.status, tarefa.proximaExecucao)}</TableCell>
                      <TableCell>{tarefa.periodoLabel}</TableCell>
                      <TableCell>{tarefa.sistema}</TableCell>
                      <TableCell>{tarefa.componente}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tarefa.descricaoTarefa}</TableCell>
                      <TableCell>{tarefa.manutentorNome}</TableCell>
                      <TableCell>{new Date(tarefa.proximaExecucao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {tarefa.status === "pendente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExecutar(tarefa)}
                              title="Executar tarefa"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditTarefa && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditTarefa(tarefa)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {tarefa.status !== "cancelado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTarefaParaCancelar(tarefa.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTarefaParaDeletar(tarefa.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!tarefaParaDeletar} onOpenChange={() => setTarefaParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => tarefaParaDeletar && handleDelete(tarefaParaDeletar)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={!!tarefaParaCancelar} onOpenChange={() => setTarefaParaCancelar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta tarefa? Ela será marcada como cancelada e não será executada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => tarefaParaCancelar && handleCancelar(tarefaParaCancelar)}>
              Cancelar Tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
