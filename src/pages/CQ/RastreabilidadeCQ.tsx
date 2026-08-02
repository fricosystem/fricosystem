import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Plus,
  Search,
  Package,
  ShieldAlert,
  Network,
  AlertTriangle,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCQLotes, useCQUsuario } from "@/hooks/useCQ";
import { alterarStatusLote, rastrearLote } from "@/services/cq/CQFluxo";
import { CQService, toDate } from "@/services/cq/CQService";
import { CQ_COLLECTIONS, type CQLote, type StatusLote } from "@/types/typesCQ";

const STATUS_LOTE: Record<StatusLote, { label: string; classe: string }> = {
  em_producao: { label: "Em produção", classe: "bg-primary/10 text-primary border-primary/20" },
  liberado: { label: "Liberado", classe: "bg-success/10 text-success border-success/20" },
  bloqueado: { label: "Bloqueado", classe: "bg-destructive/10 text-destructive border-destructive/20" },
  em_recall: { label: "Em recall", classe: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  expedido: { label: "Expedido", classe: "bg-primary/10 text-primary border-primary/20" },
};

const formatarData = (v: unknown) => {
  const d = toDate(v);
  return d ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
};

type Rastreio = Awaited<ReturnType<typeof rastrearLote>>;

const RastreabilidadeCQ = () => {
  const usuario = useCQUsuario();
  const { data: lotes, loading, criar } = useCQLotes({ ordenarPor: "criado_em" });

  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("lotes");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<(CQLote & { id: string }) | null>(null);
  const [rastreio, setRastreio] = useState<Rastreio>(null);
  const [carregandoRastreio, setCarregandoRastreio] = useState(false);
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [motivoRecall, setMotivoRecall] = useState("");
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[]>([]);

  const [form, setForm] = useState({
    codigo: "",
    produto_nome: "",
    quantidade: "",
    unidade: "kg",
    data_producao: "",
    data_validade: "",
    origem: "",
    destino: "",
    status: "em_producao" as StatusLote,
  });

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lotes;
    return lotes.filter((l) =>
      [l.codigo, l.produto_nome, l.origem, l.destino]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termo)),
    );
  }, [lotes, busca]);

  const resumo = useMemo(() => {
    const conta = (s: StatusLote) => lotes.filter((l) => l.status === s).length;
    return {
      total: lotes.length,
      bloqueados: conta("bloqueado"),
      recall: conta("em_recall"),
      liberados: conta("liberado"),
    };
  }, [lotes]);

  useEffect(() => {
    if (aba !== "auditoria") return;
    CQService.list(CQ_COLLECTIONS.auditoria, {
      ordenarPor: "data_hora",
      limite: 100,
      incluirInativos: true,
    })
      .then((d) => setAuditoria(d as Record<string, unknown>[]))
      .catch(() => toast.error("Erro ao carregar trilha de auditoria"));
  }, [aba]);

  const abrirRastreio = async (lote: CQLote & { id: string }) => {
    setLoteSelecionado(lote);
    setAba("arvore");
    setCarregandoRastreio(true);
    try {
      setRastreio(await rastrearLote(lote.id));
    } catch {
      toast.error("Erro ao carregar rastreabilidade do lote");
    } finally {
      setCarregandoRastreio(false);
    }
  };

  const salvarLote = async () => {
    if (!form.codigo.trim()) return toast.error("Informe o código do lote");
    if (!form.produto_nome.trim()) return toast.error("Informe o produto");
    setSalvando(true);
    try {
      await criar({
        codigo: form.codigo.trim().toUpperCase(),
        produto_nome: form.produto_nome.trim(),
        quantidade: Number(form.quantidade) || 0,
        unidade: form.unidade,
        data_producao: (form.data_producao
          ? new Date(form.data_producao)
          : new Date()) as unknown as CQLote["data_producao"],
        data_validade: (form.data_validade
          ? new Date(form.data_validade)
          : null) as unknown as CQLote["data_validade"],
        origem: form.origem,
        destino: form.destino,
        status: form.status,
        recall: null,
        execucoes_ids: [],
        ncs_ids: [],
      });
      toast.success("Lote registrado");
      setIsFormOpen(false);
      setForm({
        codigo: "",
        produto_nome: "",
        quantidade: "",
        unidade: "kg",
        data_producao: "",
        data_validade: "",
        origem: "",
        destino: "",
        status: "em_producao",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar lote");
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (lote: CQLote & { id: string }, novo: StatusLote) => {
    try {
      await alterarStatusLote(lote.id, novo, usuario);
      toast.success(`Lote ${lote.codigo}: ${STATUS_LOTE[novo].label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar status");
    }
  };

  const abrirRecall = (lote: CQLote & { id: string }) => {
    setLoteSelecionado(lote);
    setMotivoRecall("");
    setIsRecallOpen(true);
  };

  const confirmarRecall = async () => {
    if (!loteSelecionado) return;
    if (!motivoRecall.trim()) return toast.error("Informe o motivo do recall");
    try {
      await alterarStatusLote(loteSelecionado.id, "em_recall", usuario, motivoRecall.trim());
      toast.success(`Recall aberto para o lote ${loteSelecionado.codigo}`);
      setIsRecallOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao abrir recall");
    }
  };

  return (
    <AppLayout title="Rastreabilidade e Lotes">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Lotes ativos", valor: resumo.total, cor: "border-l-primary", icon: Package },
            { label: "Liberados", valor: resumo.liberados, cor: "border-l-success", icon: CheckCircle2 },
            { label: "Bloqueados", valor: resumo.bloqueados, cor: "border-l-destructive", icon: Ban },
            { label: "Em recall", valor: resumo.recall, cor: "border-l-orange-500", icon: AlertTriangle },
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

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger value="lotes">Lotes</TabsTrigger>
            <TabsTrigger value="arvore">Árvore de rastreio</TabsTrigger>
            <TabsTrigger value="auditoria">Trilha de auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="lotes" className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar lote ou produto..."
                  className="pl-10 bg-background border-border"
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-foreground font-bold" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Novo lote
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs uppercase">Lote / Produto</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Produção</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Quantidade</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Inspeções / NCs</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                      <TableHead className="text-right text-muted-foreground text-xs uppercase">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse uppercase font-bold">
                          Carregando lotes...
                        </TableCell>
                      </TableRow>
                    ) : lista.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground uppercase font-bold">
                          Nenhum lote cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      lista.map((l) => (
                        <TableRow key={l.id} className="border-border hover:bg-muted/20">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground font-mono">{l.codigo}</span>
                              <span className="text-xs text-muted-foreground">{l.produto_nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {formatarData(l.data_producao)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {l.quantidade} {l.unidade}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {(l.execucoes_ids || []).length} / {(l.ncs_ids || []).length}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_LOTE[l.status]?.classe}>
                              {STATUS_LOTE[l.status]?.label || l.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-primary hover:bg-primary/10 text-xs font-bold uppercase"
                                onClick={() => abrirRastreio(l)}
                              >
                                Rastrear
                              </Button>
                              {l.status !== "liberado" && l.status !== "em_recall" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-success hover:bg-success/10 text-xs font-bold uppercase"
                                  onClick={() => mudarStatus(l, "liberado")}
                                >
                                  Liberar
                                </Button>
                              )}
                              {l.status !== "bloqueado" && l.status !== "em_recall" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:bg-muted text-xs font-bold uppercase"
                                  onClick={() => mudarStatus(l, "bloqueado")}
                                >
                                  Bloquear
                                </Button>
                              )}
                              {l.status !== "em_recall" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                  title="Abrir recall"
                                  onClick={() => abrirRecall(l)}
                                >
                                  <ShieldAlert className="h-4 w-4" />
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

          <TabsContent value="arvore" className="mt-6">
            {!loteSelecionado ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground uppercase font-bold">
                  Selecione um lote na aba "Lotes" para ver a árvore de rastreabilidade
                </CardContent>
              </Card>
            ) : carregandoRastreio ? (
              <Card className="bg-card border-border">
                <CardContent className="py-16 text-center animate-pulse text-muted-foreground uppercase font-bold">
                  Montando árvore de rastreabilidade...
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      Lote {loteSelecionado.codigo}
                    </CardTitle>
                    <CardDescription>
                      {loteSelecionado.produto_nome} • {loteSelecionado.quantidade} {loteSelecionado.unidade} •
                      Produzido em {formatarData(loteSelecionado.data_producao)}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground uppercase tracking-wide">
                      Inspeções ({rastreio?.execucoes.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(rastreio?.execucoes || []).map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between items-center p-3 bg-background border border-border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">{e.modelo_nome}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatarData(e.criado_em)} • {e.responsavel_nome}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            e.resultado === "conforme"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {e.total_conformes}/{e.total_campos} conformes
                        </Badge>
                      </div>
                    ))}
                    {!rastreio?.execucoes.length && (
                      <p className="text-muted-foreground text-xs uppercase font-bold py-6 text-center">
                        Nenhuma inspeção vinculada
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground uppercase tracking-wide">
                      Não conformidades ({rastreio?.ncs.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(rastreio?.ncs || []).map((nc) => (
                      <div key={nc.id} className="p-3 bg-background border border-border rounded-lg">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-foreground font-bold">{nc.descricao}</p>
                          <Badge className="bg-destructive/10 text-destructive uppercase text-xs">{nc.gravidade}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
                          {nc.status.replace("_", " ")} • {formatarData(nc.criado_em)}
                        </p>
                      </div>
                    ))}
                    {!rastreio?.ncs.length && (
                      <p className="text-muted-foreground text-xs uppercase font-bold py-6 text-center">
                        Nenhuma não conformidade
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground uppercase tracking-wide">
                      Ações corretivas ({rastreio?.acoes.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(rastreio?.acoes || []).map((a) => (
                      <div
                        key={a.id}
                        className="flex justify-between items-center p-3 bg-background border border-border rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-foreground font-bold">{a.plano?.what || "Ação corretiva"}</p>
                          <p className="text-xs text-muted-foreground">{a.responsavel_nome}</p>
                        </div>
                        <Badge className="bg-muted text-foreground uppercase text-xs">{a.status}</Badge>
                      </div>
                    ))}
                    {!rastreio?.acoes.length && (
                      <p className="text-muted-foreground text-xs uppercase font-bold py-6 text-center">
                        Nenhuma ação corretiva
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="auditoria" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Trilha de auditoria do módulo</CardTitle>
                <CardDescription>Últimos 100 eventos registrados no Controle de Qualidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {auditoria.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground uppercase font-bold">Nenhum evento registrado</p>
                ) : (
                  auditoria.map((log) => (
                    <div
                      key={String(log.id)}
                      className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold uppercase",
                            log.tipo_operacao === "CRIAR"
                              ? "border-success/50 text-success"
                              : log.tipo_operacao === "EDITAR"
                                ? "border-primary/50 text-primary"
                                : "border-destructive/50 text-destructive",
                          )}
                        >
                          {String(log.tipo_operacao)}
                        </Badge>
                        <div>
                          <p className="text-xs text-foreground font-bold">
                            {String(log.colecao || "").replace("cq_", "").replace(/_/g, " ").toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{String(log.entidade_id || "").substring(0, 10)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground font-bold">{String(log.nome_usuario || "")}</p>
                        <p className="text-xs text-muted-foreground font-mono">{formatarData(log.data_hora)}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* NOVO LOTE */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-background border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground uppercase font-bold">Novo lote de produção</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Os lotes recebem automaticamente as inspeções e NCs registradas na execução.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Código *</label>
              <Input
                className="bg-muted border-border"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Produto *</label>
              <Input
                className="bg-muted border-border"
                value={form.produto_nome}
                onChange={(e) => setForm({ ...form, produto_nome: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Quantidade</label>
              <Input
                type="number"
                className="bg-muted border-border"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Unidade</label>
              <Input
                className="bg-muted border-border"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Data de produção</label>
              <Input
                type="datetime-local"
                className="bg-muted border-border"
                value={form.data_producao}
                onChange={(e) => setForm({ ...form, data_producao: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Validade</label>
              <Input
                type="date"
                className="bg-muted border-border"
                value={form.data_validade}
                onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Origem</label>
              <Input
                className="bg-muted border-border"
                value={form.origem}
                onChange={(e) => setForm({ ...form, origem: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Destino</label>
              <Input
                className="bg-muted border-border"
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Status inicial</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusLote })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {(Object.keys(STATUS_LOTE) as StatusLote[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LOTE[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-foreground font-bold"
              disabled={salvando}
              onClick={salvarLote}
            >
              {salvando ? "Salvando..." : "Registrar lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RECALL */}
      <Dialog open={isRecallOpen} onOpenChange={setIsRecallOpen}>
        <DialogContent className="bg-background border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 uppercase font-bold">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Abrir recall
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Lote {loteSelecionado?.codigo} — {loteSelecionado?.produto_nome}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            className="bg-muted border-border"
            placeholder="Motivo do recall"
            value={motivoRecall}
            onChange={(e) => setMotivoRecall(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsRecallOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-destructive hover:bg-destructive/90 text-foreground font-bold" onClick={confirmarRecall}>
              Confirmar recall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RastreabilidadeCQ;
