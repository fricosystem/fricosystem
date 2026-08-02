import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Ban,
  PlayCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCQAgendamentos, useCQModelos, useCQUsuario } from "@/hooks/useCQ";
import { alterarStatusAgendamento, marcarAgendamentosAtrasados } from "@/services/cq/CQFluxo";
import { toDate } from "@/services/cq/CQService";
import type { CQAgendamento, FrequenciaCQ, StatusAgendamento } from "@/types/typesCQ";

const STATUS_META: Record<StatusAgendamento, { label: string; classe: string }> = {
  agendado: { label: "Agendado", classe: "bg-primary/10 text-primary border-primary/20" },
  em_execucao: { label: "Em execução", classe: "bg-primary/10 text-primary border-primary/20" },
  concluido: { label: "Concluído", classe: "bg-success/10 text-success border-success/20" },
  atrasado: { label: "Atrasado", classe: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelado: { label: "Cancelado", classe: "bg-muted text-muted-foreground border-border" },
};

const FREQUENCIAS: { valor: FrequenciaCQ; label: string }[] = [
  { valor: "unica", label: "Única" },
  { valor: "diaria", label: "Diária" },
  { valor: "semanal", label: "Semanal" },
  { valor: "quinzenal", label: "Quinzenal" },
  { valor: "mensal", label: "Mensal" },
  { valor: "por_lote", label: "Por lote" },
];

const formatarData = (valor: unknown) => {
  const d = toDate(valor);
  return d ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
};

const AgendamentoCQ = () => {
  const usuario = useCQUsuario();
  const { data: agendamentos, loading, criar, atualizar, desativar } = useCQAgendamentos();
  const { data: modelos } = useCQModelos();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<(CQAgendamento & { id: string }) | null>(null);

  const [form, setForm] = useState({
    modelo_id: "",
    setor: "",
    turno: "",
    responsavel_nome: "",
    data_prevista: "",
    frequencia: "unica" as FrequenciaCQ,
    observacoes: "",
  });

  const modelosPublicados = useMemo(
    () => modelos.filter((m) => m.publicado !== false),
    [modelos],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return agendamentos.filter((a) => {
      const okStatus = filtroStatus === "todos" || a.status === filtroStatus;
      const okBusca =
        !termo ||
        [a.modelo_nome, a.setor, a.turno, a.responsavel_nome]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo));
      return okStatus && okBusca;
    });
  }, [agendamentos, busca, filtroStatus]);

  const resumo = useMemo(() => {
    const conta = (s: StatusAgendamento) => agendamentos.filter((a) => a.status === s).length;
    return {
      agendado: conta("agendado"),
      em_execucao: conta("em_execucao"),
      atrasado: conta("atrasado"),
      concluido: conta("concluido"),
    };
  }, [agendamentos]);

  const abrirNovo = () => {
    setEditando(null);
    setForm({
      modelo_id: "",
      setor: "",
      turno: "",
      responsavel_nome: usuario.nome,
      data_prevista: "",
      frequencia: "unica",
      observacoes: "",
    });
    setIsFormOpen(true);
  };

  const abrirEdicao = (ag: CQAgendamento & { id: string }) => {
    const d = toDate(ag.data_prevista);
    setEditando(ag);
    setForm({
      modelo_id: ag.modelo_id || "",
      setor: ag.setor || "",
      turno: ag.turno || "",
      responsavel_nome: ag.responsavel_nome || "",
      data_prevista: d
        ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : "",
      frequencia: ag.frequencia || "unica",
      observacoes: ag.observacoes || "",
    });
    setIsFormOpen(true);
  };

  const salvar = async () => {
    const modelo = modelos.find((m) => m.id === form.modelo_id);
    if (!modelo) return toast.error("Selecione um modelo de inspeção");
    if (!form.data_prevista) return toast.error("Informe a data prevista");
    if (!form.responsavel_nome.trim()) return toast.error("Informe o responsável");

    setSalvando(true);
    try {
      const payload: Partial<CQAgendamento> = {
        modelo_id: modelo.id,
        modelo_nome: modelo.nome,
        setor: form.setor || modelo.setor || "",
        turno: form.turno,
        responsavel_id:
          form.responsavel_nome.trim() === usuario.nome ? usuario.uid : editando?.responsavel_id || "",
        responsavel_nome: form.responsavel_nome.trim(),
        data_prevista: new Date(form.data_prevista) as unknown as CQAgendamento["data_prevista"],
        frequencia: form.frequencia,
        observacoes: form.observacoes,
        status: editando?.status || "agendado",
      };

      if (editando) {
        await atualizar(editando.id, payload);
        toast.success("Agendamento atualizado");
      } else {
        await criar(payload);
        toast.success("Inspeção agendada");
      }
      setIsFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar agendamento");
    } finally {
      setSalvando(false);
    }
  };

  const transicionar = async (id: string, novo: StatusAgendamento) => {
    try {
      await alterarStatusAgendamento(id, novo, usuario);
      toast.success(`Status alterado para ${STATUS_META[novo].label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transição inválida");
    }
  };

  const sincronizarAtrasos = async () => {
    try {
      const total = await marcarAgendamentosAtrasados(usuario);
      toast.success(
        total ? `${total} agendamento(s) marcados como atrasados` : "Nenhum agendamento vencido",
      );
    } catch {
      toast.error("Erro ao verificar atrasos");
    }
  };

  return (
    <AppLayout title="Agendamento de Inspeções CQ">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Agendados", valor: resumo.agendado, cor: "border-l-primary", icon: CalendarClock },
            { label: "Em execução", valor: resumo.em_execucao, cor: "border-l-primary/60", icon: PlayCircle },
            { label: "Atrasados", valor: resumo.atrasado, cor: "border-l-destructive", icon: AlertTriangle },
            { label: "Concluídos", valor: resumo.concluido, cor: "border-l-success", icon: CheckCircle2 },
          ].map((c) => (
            <Card key={c.label} className={`bg-card border-border border-l-4 ${c.cor}`}>
              <CardContent className="pt-6">
                <c.icon className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{c.valor}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por modelo, setor ou responsável..."
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border text-muted-foreground" onClick={sincronizarAtrasos}>
              <RefreshCw className="h-4 w-4 mr-2" /> Verificar atrasos
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-foreground font-bold" onClick={abrirNovo}>
              <Plus className="h-4 w-4 mr-2" /> Novo agendamento
            </Button>
          </div>
        </div>

        <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
          <TabsList className="bg-muted border border-border p-1 flex-wrap h-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {(Object.keys(STATUS_META) as StatusAgendamento[]).map((s) => (
              <TabsTrigger key={s} value={s}>
                {STATUS_META[s].label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filtroStatus} className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Cronograma de inspeções</CardTitle>
                <CardDescription>
                  Dados em tempo real da coleção de agendamentos do Controle de Qualidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs uppercase">Modelo / Setor</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Data prevista</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Responsável</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Frequência</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                      <TableHead className="text-right text-muted-foreground text-xs uppercase">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse uppercase font-bold">
                          Carregando agendamentos...
                        </TableCell>
                      </TableRow>
                    ) : lista.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground uppercase font-bold">
                          Nenhum agendamento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      lista.map((ag) => (
                        <TableRow key={ag.id} className="border-border hover:bg-muted/20">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{ag.modelo_nome}</span>
                              <span className="text-xs text-muted-foreground">
                                {ag.setor || "Sem setor"} {ag.turno ? `• Turno ${ag.turno}` : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground text-xs font-mono">
                            {formatarData(ag.data_prevista)}
                          </TableCell>
                          <TableCell className="text-foreground text-xs">{ag.responsavel_nome}</TableCell>
                          <TableCell className="text-muted-foreground text-xs capitalize">
                            {FREQUENCIAS.find((f) => f.valor === ag.frequencia)?.label || ag.frequencia}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_META[ag.status]?.classe}>
                              {STATUS_META[ag.status]?.label || ag.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(ag.status === "agendado" || ag.status === "atrasado") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-primary hover:bg-primary/10 text-xs font-bold uppercase"
                                  onClick={() => transicionar(ag.id, "em_execucao")}
                                >
                                  Iniciar
                                </Button>
                              )}
                              {ag.status !== "concluido" && ag.status !== "cancelado" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:bg-muted text-xs font-bold uppercase"
                                  onClick={() => abrirEdicao(ag)}
                                >
                                  Editar
                                </Button>
                              )}
                              {ag.status !== "concluido" && ag.status !== "cancelado" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                  title="Cancelar agendamento"
                                  onClick={() => transicionar(ag.id, "cancelado")}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              {ag.status === "cancelado" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:bg-muted text-xs font-bold uppercase"
                                  onClick={() => desativar(ag.id)}
                                >
                                  Arquivar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-background border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold uppercase tracking-tight">
              {editando ? "Editar agendamento" : "Novo agendamento de inspeção"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vincule um modelo homologado, defina responsável, data e frequência.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Modelo de inspeção *</label>
              <Select value={form.modelo_id} onValueChange={(v) => setForm({ ...form, modelo_id: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder={modelosPublicados.length ? "Selecione" : "Nenhum modelo cadastrado"} />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {modelosPublicados.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} (v{m.versao})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Setor</label>
              <Input
                className="bg-muted border-border"
                value={form.setor}
                onChange={(e) => setForm({ ...form, setor: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Turno</label>
              <Input
                className="bg-muted border-border"
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Responsável *</label>
              <Input
                className="bg-muted border-border"
                value={form.responsavel_nome}
                onChange={(e) => setForm({ ...form, responsavel_nome: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Data prevista *</label>
              <Input
                type="datetime-local"
                className="bg-muted border-border"
                value={form.data_prevista}
                onChange={(e) => setForm({ ...form, data_prevista: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Frequência</label>
              <Select
                value={form.frequencia}
                onValueChange={(v) => setForm({ ...form, frequencia: v as FrequenciaCQ })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {FREQUENCIAS.map((f) => (
                    <SelectItem key={f.valor} value={f.valor}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Observações</label>
              <Textarea
                className="bg-muted border-border"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-foreground font-bold"
              disabled={salvando}
              onClick={salvar}
            >
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Agendar inspeção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AgendamentoCQ;
