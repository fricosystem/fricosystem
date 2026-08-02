import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Workflow,
  Save,
  X,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { motion } from "framer-motion";
import {
  useCQAcoesCorretivas,
  useCQMelhoriaContinua,
  useCQNaoConformidades,
  useCQUsuario,
} from "@/hooks/useCQ";
import { alterarStatusAcao } from "@/services/cq/CQFluxo";
import { toDate } from "@/services/cq/CQService";
import type {
  CategoriaIshikawa,
  CQAcaoCorretiva,
  CQMelhoriaContinua,
  CQPlano5W2H,
} from "@/types/typesCQ";
import { Timestamp } from "firebase/firestore";

const CATEGORIAS: { id: CategoriaIshikawa; label: string }[] = [
  { id: "metodo", label: "Método" },
  { id: "maquina", label: "Máquina" },
  { id: "mao_de_obra", label: "Mão de Obra" },
  { id: "material", label: "Material" },
  { id: "medicao", label: "Medição" },
  { id: "meio_ambiente", label: "Meio Ambiente" },
];

const PLANO_VAZIO: CQPlano5W2H = {
  what: "",
  why: "",
  where: "",
  when: "",
  who: "",
  how: "",
  how_much: "",
};

const formatarData = (valor: unknown) => {
  const d = toDate(valor);
  return d ? d.toLocaleDateString("pt-BR") : "—";
};

const MelhoriaContinuaCQ = () => {
  const usuario = useCQUsuario();
  const { data: ncs, loading: loadingNCs } = useCQNaoConformidades();
  const { data: melhorias, criar: criarMelhoria, atualizar: atualizarMelhoria } =
    useCQMelhoriaContinua();
  const { data: acoes, criar: criarAcao } = useCQAcoesCorretivas();

  const [selectedNCId, setSelectedNCId] = useState<string>("");
  const [ishikawa, setIshikawa] = useState<Partial<Record<CategoriaIshikawa, string[]>>>({});
  const [salvando, setSalvando] = useState(false);

  const [causaModal, setCausaModal] = useState<CategoriaIshikawa | null>(null);
  const [novaCausa, setNovaCausa] = useState("");

  const [is5W2HOpen, setIs5W2HOpen] = useState(false);
  const [plano, setPlano] = useState<CQPlano5W2H>(PLANO_VAZIO);
  const [planoNCId, setPlanoNCId] = useState<string>("");

  const [detalhe, setDetalhe] = useState<(CQMelhoriaContinua & { id: string }) | null>(null);

  const ncsAbertas = useMemo(
    () => ncs.filter((nc) => nc.status !== "fechada"),
    [ncs],
  );
  const selectedNC = useMemo(
    () => ncs.find((nc) => nc.id === selectedNCId) || null,
    [ncs, selectedNCId],
  );

  const analisesIshikawa = useMemo(
    () => melhorias.filter((m) => m.tipo === "ishikawa"),
    [melhorias],
  );
  const planos5W2H = useMemo(() => melhorias.filter((m) => m.tipo === "5w2h"), [melhorias]);

  /* -------------------- Ishikawa -------------------- */
  const selecionarNC = (id: string) => {
    setSelectedNCId(id);
    const existente = analisesIshikawa.find((m) => m.nc_id === id);
    setIshikawa(existente?.ishikawa || {});
  };

  const adicionarCausa = () => {
    if (!causaModal || !novaCausa.trim()) return;
    setIshikawa((prev) => ({
      ...prev,
      [causaModal]: [...(prev[causaModal] || []), novaCausa.trim()],
    }));
    setNovaCausa("");
  };

  const removerCausa = (cat: CategoriaIshikawa, index: number) => {
    setIshikawa((prev) => ({
      ...prev,
      [cat]: (prev[cat] || []).filter((_, i) => i !== index),
    }));
  };

  const salvarIshikawa = async () => {
    if (!selectedNC) {
      toast.error("Selecione uma não conformidade");
      return;
    }
    const totalCausas = Object.values(ishikawa).reduce((acc, v) => acc + (v?.length || 0), 0);
    if (totalCausas === 0) {
      toast.error("Adicione ao menos uma causa ao diagrama");
      return;
    }
    setSalvando(true);
    try {
      const existente = analisesIshikawa.find((m) => m.nc_id === selectedNC.id);
      const payload: Partial<CQMelhoriaContinua> = {
        nc_id: selectedNC.id,
        titulo: selectedNC.descricao,
        tipo: "ishikawa",
        ishikawa,
        status: "em_andamento",
      };
      if (existente) {
        await atualizarMelhoria(existente.id, payload);
      } else {
        await criarMelhoria(payload);
      }
      toast.success("Análise de causa raiz salva");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar análise");
    } finally {
      setSalvando(false);
    }
  };

  /* -------------------- 5W2H -------------------- */
  const salvarPlano = async () => {
    if (!planoNCId) {
      toast.error("Vincule o plano a uma não conformidade");
      return;
    }
    if (!plano.what.trim() || !plano.who.trim() || !plano.when) {
      toast.error("Preencha ao menos O quê, Quem e Quando");
      return;
    }
    setSalvando(true);
    try {
      const nc = ncs.find((n) => n.id === planoNCId);
      await criarMelhoria({
        nc_id: planoNCId,
        titulo: plano.what,
        tipo: "5w2h",
        plano,
        status: "planejada",
      });
      await criarAcao({
        nc_id: planoNCId,
        tipo: "corretiva",
        plano,
        status: "planejada",
        responsavel_id: usuario.uid,
        responsavel_nome: plano.who,
        prazo: Timestamp.fromDate(new Date(`${plano.when}T00:00:00`)),
        observacoes: nc?.descricao || "",
      } as Partial<CQAcaoCorretiva>);
      toast.success("Plano 5W2H registrado e ação corretiva criada");
      setIs5W2HOpen(false);
      setPlano(PLANO_VAZIO);
      setPlanoNCId("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar plano");
    } finally {
      setSalvando(false);
    }
  };

  /* -------------------- Eficácia -------------------- */
  const mudarStatusAcao = async (
    acao: CQAcaoCorretiva & { id: string },
    status: CQAcaoCorretiva["status"],
    eficacia?: CQAcaoCorretiva["eficacia"],
  ) => {
    try {
      await alterarStatusAcao(acao.id, status, usuario, { eficacia });
      toast.success("Ação corretiva atualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar ação");
    }
  };

  return (
    <AppLayout title="Plano de Melhoria Contínua">
      <div className="space-y-6">
        <Tabs defaultValue="ishikawa" className="w-full">
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger value="ishikawa">Diagrama de Ishikawa (6M)</TabsTrigger>
            <TabsTrigger value="5w2h">Planos de Ação (5W2H)</TabsTrigger>
            <TabsTrigger value="eficacia">Validação de Eficácia</TabsTrigger>
          </TabsList>

          {/* ---------------- ISHIKAWA ---------------- */}
          <TabsContent value="ishikawa" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-background border border-border p-6 rounded-2xl flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Selecionar Ocorrência (NC)
                  </label>
                  <Select value={selectedNCId} onValueChange={selecionarNC}>
                    <SelectTrigger className="bg-muted border-border text-foreground h-12">
                      <SelectValue
                        placeholder={
                          loadingNCs
                            ? "Carregando não conformidades..."
                            : ncsAbertas.length
                              ? "Escolha uma Não Conformidade em aberto..."
                              : "Nenhuma NC em aberto"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      {ncsAbertas.map((nc) => (
                        <SelectItem key={nc.id} value={nc.id}>
                          {(nc.codigo || nc.id.substring(0, 8)).toUpperCase()} — {nc.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-success hover:bg-success/90 text-foreground font-semibold h-12 px-8"
                  onClick={salvarIshikawa}
                  disabled={!selectedNC || salvando}
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  SALVAR ANÁLISE
                </Button>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-8 right-32 h-1 bg-primary/30 -translate-y-1/2 rounded-full hidden lg:block" />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-destructive/20 border-2 border-destructive p-4 rounded-2xl z-10 max-w-[200px] hidden lg:block">
                  <p className="text-destructive font-bold uppercase text-xs">Problema Central</p>
                  <p className="text-foreground font-bold text-sm line-clamp-3">
                    {selectedNC ? selectedNC.descricao : "Selecione uma NC"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-12">
                  {CATEGORIAS.map((m) => (
                    <div key={m.id} className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-background border border-border rounded-xl">
                          <Workflow className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground font-bold text-sm uppercase tracking-wide">
                          {m.label}
                        </span>
                      </div>
                      <div className="space-y-2 border-l border-border pl-4 ml-4">
                        {(ishikawa[m.id] || []).map((item, i) => (
                          <p
                            key={`${item}-${i}`}
                            className="text-xs text-foreground flex items-center gap-1 group"
                          >
                            <ArrowRight className="h-2 w-2 text-primary shrink-0" />
                            <span className="flex-1">{item}</span>
                            <button
                              onClick={() => removerCausa(m.id, i)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Remover causa"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </p>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!selectedNC}
                          className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
                          onClick={() => {
                            setCausaModal(m.id);
                            setNovaCausa("");
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ---------------- 5W2H ---------------- */}
          <TabsContent value="5w2h" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-foreground font-bold">Planos de Ação Registrados</h3>
              <Button
                className="bg-primary hover:bg-primary/90 text-foreground font-bold"
                onClick={() => setIs5W2HOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Novo 5W2H
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {planos5W2H.length === 0 ? (
                <div className="col-span-2 py-20 text-center text-muted-foreground font-bold uppercase tracking-wide border border-dashed border-border rounded-3xl">
                  Nenhum plano de ação registrado
                </div>
              ) : (
                planos5W2H.map((item) => (
                  <Card key={item.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge className="bg-success/10 text-success border-success/20 uppercase text-xs">
                          {item.status || "planejada"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground uppercase">
                          ID: {item.id.substring(0, 8)}
                        </span>
                      </div>
                      <CardTitle className="text-foreground text-base mt-2">{item.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-muted-foreground uppercase font-bold">Responsável</span>
                          <p className="text-foreground">{item.plano?.who || "—"}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-muted-foreground uppercase font-bold">Prazo</span>
                          <p className="text-foreground">{item.plano?.when || "—"}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border text-primary font-bold hover:bg-primary/10"
                        onClick={() => setDetalhe(item)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Ver Análise Completa
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ---------------- EFICÁCIA ---------------- */}
          <TabsContent value="eficacia" className="mt-6 space-y-4">
            {acoes.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-bold uppercase tracking-wide border border-dashed border-border rounded-3xl">
                Nenhuma ação corretiva cadastrada
              </div>
            ) : (
              acoes.map((acao) => (
                <Card key={acao.id} className="bg-card border-border">
                  <CardContent className="py-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "uppercase text-xs font-semibold border",
                            acao.status === "verificada"
                              ? "bg-success/10 text-success border-success/20"
                              : acao.status === "concluida"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-warning/10 text-warning border-warning/20",
                          )}
                        >
                          {acao.status}
                        </Badge>
                        {acao.eficacia && (
                          <Badge variant="outline" className="border-border text-xs uppercase">
                            {acao.eficacia}
                          </Badge>
                        )}
                      </div>
                      <p className="text-foreground font-bold text-sm">{acao.plano?.what}</p>
                      <p className="text-xs text-muted-foreground">
                        Responsável: {acao.responsavel_nome} · Prazo: {formatarData(acao.prazo)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {acao.status === "planejada" && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-foreground font-bold"
                          onClick={() => mudarStatusAcao(acao, "em_andamento")}
                        >
                          Iniciar
                        </Button>
                      )}
                      {acao.status === "em_andamento" && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-foreground font-bold"
                          onClick={() => mudarStatusAcao(acao, "concluida")}
                        >
                          Concluir
                        </Button>
                      )}
                      {acao.status === "concluida" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-foreground font-bold"
                            onClick={() => mudarStatusAcao(acao, "verificada", "eficaz")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Eficaz
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive font-bold"
                            onClick={() => mudarStatusAcao(acao, "verificada", "nao_eficaz")}
                          >
                            Não eficaz
                          </Button>
                        </>
                      )}
                      {acao.status === "verificada" && (
                        <span className="text-xs uppercase font-semibold text-success flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Verificada por {acao.verificado_por}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL: adicionar causa */}
      <Dialog open={!!causaModal} onOpenChange={(o) => !o && setCausaModal(null)}>
        <DialogContent className="bg-background border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              Causas: {CATEGORIAS.find((c) => c.id === causaModal)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Nova causa detectada
            </label>
            <div className="flex gap-2">
              <Input
                className="bg-muted border-border text-foreground"
                value={novaCausa}
                onChange={(e) => setNovaCausa(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarCausa()}
                placeholder="Descreva a causa..."
              />
              <Button className="bg-primary hover:bg-primary/90" onClick={adicionarCausa}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="pt-3 space-y-1">
              {(causaModal ? ishikawa[causaModal] || [] : []).map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  className="flex items-center justify-between text-xs text-foreground bg-muted border border-border rounded px-3 py-2"
                >
                  {c}
                  <button
                    onClick={() => causaModal && removerCausa(causaModal, i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-muted text-foreground" onClick={() => setCausaModal(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: 5W2H */}
      <Dialog open={is5W2HOpen} onOpenChange={setIs5W2HOpen}>
        <DialogContent className="bg-background border-border max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-semibold uppercase tracking-wider">
              <Workflow className="h-5 w-5 text-primary" />
              PLANO DE AÇÃO 5W2H
            </DialogTitle>
            <DialogDescription className="text-muted-foreground uppercase text-xs tracking-wide">
              Gera automaticamente uma ação corretiva vinculada à NC
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6 px-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                Não conformidade vinculada *
              </label>
              <Select value={planoNCId} onValueChange={setPlanoNCId}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Selecione a NC" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  {ncsAbertas.map((nc) => (
                    <SelectItem key={nc.id} value={nc.id}>
                      {(nc.codigo || nc.id.substring(0, 8)).toUpperCase()} — {nc.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    WHAT (O quê?) *
                  </label>
                  <Textarea
                    rows={2}
                    className="bg-transparent border-none p-0 text-foreground text-sm resize-none focus-visible:ring-0"
                    value={plano.what}
                    onChange={(e) => setPlano({ ...plano, what: e.target.value })}
                    placeholder="Descreva a ação..."
                  />
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    WHY (Por quê?)
                  </label>
                  <Textarea
                    rows={2}
                    className="bg-transparent border-none p-0 text-foreground text-sm resize-none focus-visible:ring-0"
                    value={plano.why}
                    onChange={(e) => setPlano({ ...plano, why: e.target.value })}
                    placeholder="Motivo da ação..."
                  />
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    WHO (Quem?) *
                  </label>
                  <Input
                    className="bg-transparent border-none p-0 text-foreground text-sm focus-visible:ring-0"
                    value={plano.who}
                    onChange={(e) => setPlano({ ...plano, who: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    WHEN (Quando?) *
                  </label>
                  <Input
                    type="date"
                    className="bg-transparent border-none p-0 text-foreground text-sm focus-visible:ring-0"
                    value={plano.when}
                    onChange={(e) => setPlano({ ...plano, when: e.target.value })}
                  />
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    WHERE (Onde?)
                  </label>
                  <Input
                    className="bg-transparent border-none p-0 text-foreground text-sm focus-visible:ring-0"
                    value={plano.where}
                    onChange={(e) => setPlano({ ...plano, where: e.target.value })}
                    placeholder="Setor/Equipamento"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      HOW (Como?)
                    </label>
                    <Input
                      className="bg-transparent border-none p-0 text-foreground text-sm focus-visible:ring-0"
                      value={plano.how}
                      onChange={(e) => setPlano({ ...plano, how: e.target.value })}
                      placeholder="Método"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      HOW MUCH (Quanto?)
                    </label>
                    <Input
                      className="bg-transparent border-none p-0 text-foreground text-sm focus-visible:ring-0"
                      value={plano.how_much}
                      onChange={(e) => setPlano({ ...plano, how_much: e.target.value })}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setIs5W2HOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-foreground font-semibold px-8"
              onClick={salvarPlano}
              disabled={salvando}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              SALVAR PLANO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: detalhe */}
      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="bg-background border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{detalhe?.titulo}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs uppercase tracking-wide">
              Registrado em {formatarData(detalhe?.criado_em)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 text-sm">
            {detalhe?.plano &&
              (
                [
                  ["O quê", detalhe.plano.what],
                  ["Por quê", detalhe.plano.why],
                  ["Onde", detalhe.plano.where],
                  ["Quando", detalhe.plano.when],
                  ["Quem", detalhe.plano.who],
                  ["Como", detalhe.plano.how],
                  ["Quanto", detalhe.plano.how_much],
                ] as [string, string][]
              ).map(([label, valor]) => (
                <div key={label} className="bg-muted border border-border rounded-xl p-3">
                  <p className="text-xs uppercase font-semibold text-muted-foreground">{label}</p>
                  <p className="text-foreground">{valor || "—"}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MelhoriaContinuaCQ;
