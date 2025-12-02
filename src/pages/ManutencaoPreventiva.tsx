import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, CheckCircle, AlertCircle, Clock, Settings, Trash2 } from "lucide-react";
import { NovoManutentorModal } from "@/components/ManutencaoPreventiva/NovoManutentorModal";
import { NovaTarefaModal } from "@/components/ManutencaoPreventiva/NovaTarefaModal";
import { RegistrarExecucaoModal } from "@/components/ManutencaoPreventiva/RegistrarExecucaoModal";
import { DashboardKPIs } from "@/components/ManutencaoPreventiva/DashboardKPIs";
import { CalendarioManutencao } from "@/components/ManutencaoPreventiva/CalendarioManutencao";
import { TimelineManutencao } from "@/components/ManutencaoPreventiva/TimelineManutencao";
import { diasParaManutencao, determinarStatusPorManutencao } from "@/utils/manutencaoUtils";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao, Manutentor } from "@/types/typesManutencaoPreventiva";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { deleteTarefaManutencao, deleteManutentor } from "@/firebase/manutencaoPreventiva";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/layouts/AppLayout";
import { useNavigate } from "react-router-dom";

export default function ManutencaoPreventiva() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showManutentorModal, setShowManutentorModal] = useState(false);
  const [showTarefaModal, setShowTarefaModal] = useState(false);
  const [showExecucaoModal, setShowExecucaoModal] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<TarefaManutencao | null>(null);
  
  const [tarefas, setTarefas] = useState<TarefaManutencao[]>([]);
  const [manutentores, setManutentores] = useState<Manutentor[]>([]);
  const [busca, setBusca] = useState("");

  // Efeito para mostrar alertas de tarefas críticas ao carregar
  useEffect(() => {
    if (tarefas.length === 0) return;
    
    const hoje = new Date().toISOString().split('T')[0];
    const tarefasCriticas = tarefas.filter(
      t => t.status === "pendente" && (t.proximaExecucao < hoje || t.proximaExecucao === hoje)
    );
    
    if (tarefasCriticas.length > 0) {
      const mensagens = tarefasCriticas.slice(0, 3).map(t => t.descricaoTarefa).join(", ");
      toast({
        title: `${tarefasCriticas.length} manutenção(ões) crítica(s)!`,
        description: `Tarefas urgentes: ${mensagens}`,
        variant: "destructive",
      });
    }
  }, [tarefas.length]);

  useEffect(() => {
    // Ordenar por dataHoraAgendada para cronograma
    const qTarefas = query(collection(db, "tarefas_manutencao"), orderBy("dataHoraAgendada", "asc"));
    const unsubTarefas = onSnapshot(qTarefas, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TarefaManutencao));
      setTarefas(docs);
    });

    const qManutentores = query(collection(db, "manutentores"), orderBy("nome", "asc"));
    const unsubManutentores = onSnapshot(qManutentores, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manutentor));
      setManutentores(docs);
    });

    return () => {
      unsubTarefas();
      unsubManutentores();
    };
  }, []);

  const tarefasFiltradas = tarefas.filter(t => 
    t.maquinaNome.toLowerCase().includes(busca.toLowerCase()) ||
    t.descricaoTarefa.toLowerCase().includes(busca.toLowerCase()) ||
    t.manutentorNome.toLowerCase().includes(busca.toLowerCase())
  );

  const hoje = new Date().toISOString().split('T')[0];
  const totalTarefas = tarefas.length;
  const pendentesHoje = tarefas.filter(t => t.proximaExecucao === hoje && t.status === "pendente").length;
  const atrasadas = tarefas.filter(t => t.proximaExecucao < hoje && t.status === "pendente").length;
  const concluidas = tarefas.filter(t => t.status === "concluida").length;

  const handleDeleteTarefa = async (id: string) => {
    if (confirm("Deseja realmente excluir esta tarefa?")) {
      try {
        await deleteTarefaManutencao(id);
        toast({ title: "Sucesso", description: "Tarefa excluída" });
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao excluir tarefa", variant: "destructive" });
      }
    }
  };

  const handleDeleteManutentor = async (id: string) => {
    if (confirm("Deseja realmente excluir este manutentor?")) {
      try {
        await deleteManutentor(id);
        toast({ title: "Sucesso", description: "Manutentor excluído" });
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao excluir manutentor", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (tarefa: TarefaManutencao) => {
    if (tarefa.status === "concluida") {
      return <Badge className="bg-green-500">Concluída</Badge>;
    }
    if (tarefa.proximaExecucao < hoje) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }
    if (tarefa.proximaExecucao === hoje) {
      return <Badge className="bg-orange-500">Hoje</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const formatDataHora = (dataHora?: string) => {
    if (!dataHora) return "-";
    const date = new Date(dataHora);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout title="Manutenção Preventiva">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Sistema completo de manutenção preventiva</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/configuracoes-manutencao")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button onClick={() => setShowManutentorModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Manutentor
            </Button>
            <Button onClick={() => setShowTarefaModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTarefas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes Hoje</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendentesHoje}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atrasadas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{concluidas}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="manutentores">Manutentores</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardKPIs tarefas={tarefas} />
              <TimelineManutencao 
                tarefas={tarefas
                  .filter(t => t.status === "pendente")
                  .slice(0, 10)
                  .map(t => ({
                    id: t.id,
                    nome: t.descricaoTarefa,
                    maquina: t.maquinaNome,
                    maquinaId: t.maquinaId,
                    data: t.proximaExecucao,
                    diasRestantes: diasParaManutencao(t.proximaExecucao),
                    urgencia: determinarStatusPorManutencao(t.proximaExecucao) === "Crítico" ? "critico" :
                             determinarStatusPorManutencao(t.proximaExecucao) === "Atenção" ? "alto" : "baixo"
                  }))
                }
                todasTarefas={tarefas}
              />
            </div>
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarioManutencao 
              tarefas={tarefas}
              onTarefaClick={(tarefa) => {
                setTarefaSelecionada(tarefa);
                setShowExecucaoModal(true);
              }}
            />
          </TabsContent>

          <TabsContent value="tarefas" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={() => setShowTarefaModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora Agendada</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Manutentor</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefasFiltradas.map((tarefa) => (
                    <TableRow key={tarefa.id}>
                      <TableCell>{getStatusBadge(tarefa)}</TableCell>
                      <TableCell className="font-medium">{formatDataHora(tarefa.dataHoraAgendada)}</TableCell>
                      <TableCell>{tarefa.maquinaNome}</TableCell>
                      <TableCell>{tarefa.sistema || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{tarefa.descricaoTarefa}</TableCell>
                      <TableCell>{tarefa.manutentorNome}</TableCell>
                      <TableCell>{tarefa.periodoLabel}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {tarefa.status === "pendente" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setTarefaSelecionada(tarefa);
                                setShowExecucaoModal(true);
                              }}
                            >
                              Executar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteTarefa(tarefa.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tarefasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma tarefa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="manutentores" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manutentores.map((manutentor) => (
                    <TableRow key={manutentor.id}>
                      <TableCell className="font-medium">{manutentor.nome}</TableCell>
                      <TableCell>{manutentor.funcao}</TableCell>
                      <TableCell>
                        {manutentor.ativo ? (
                          <Badge className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteManutentor(manutentor.id)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        <NovoManutentorModal
          open={showManutentorModal}
          onOpenChange={setShowManutentorModal}
          onSuccess={() => {}}
        />

        <NovaTarefaModal
          open={showTarefaModal}
          onOpenChange={setShowTarefaModal}
          onSuccess={() => {}}
        />

        <RegistrarExecucaoModal
          open={showExecucaoModal}
          onOpenChange={setShowExecucaoModal}
          tarefa={tarefaSelecionada}
          onSuccess={() => setTarefaSelecionada(null)}
        />
      </div>
    </AppLayout>
  );
}
