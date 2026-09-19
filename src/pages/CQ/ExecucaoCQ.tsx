import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  Plus,
  Clock,
  AlertTriangle,
  ChevronRight,
  CloudOff,
  User,
  LogOut,
  Scan,
  MapPin,
  ClipboardList,
  Calendar,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNavigationCQ, TabType } from "@/components/CQ/Execucao/BottomNavigationCQ";
import { getThemedLogo } from "@/hooks/useThemedLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useBlockBackNavigation } from "@/hooks/useBlockBackNavigation";
import {
  useCQAgendamentos,
  useCQExecucoes,
  useCQModelos,
  useCQNaoConformidades,
  useCQUsuario,
} from "@/hooks/useCQ";
import { montarRespostas, registrarExecucao } from "@/services/cq/CQFluxo";
import { toDate } from "@/services/cq/CQService";
import type {
  CQAgendamento,
  CQModeloPlanilha,
  CQNaoConformidade,
  GravidadeNC,
} from "@/types/typesCQ";

type Valor = string | number | boolean | null;

const formatarData = (v: unknown) => {
  const d = toDate(v);
  return d ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
};

const ExecucaoCQ = () => {
  useBlockBackNavigation();
  const { user, logout } = useAuth();
  const usuario = useCQUsuario();
  const logoPath = getThemedLogo("dark");

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: modelos, loading: loadingModelos } = useCQModelos();
  const { data: agendamentos } = useCQAgendamentos();
  const { data: ncs, loading: loadingNcs, criar: criarNC } = useCQNaoConformidades();
  const { data: execucoes } = useCQExecucoes({ limite: 50 });

  const [modeloAtivo, setModeloAtivo] = useState<(CQModeloPlanilha & { id: string }) | null>(null);
  const [agendamentoAtivo, setAgendamentoAtivo] = useState<(CQAgendamento & { id: string }) | null>(null);
  const [valores, setValores] = useState<Record<string, Valor>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [inicio, setInicio] = useState<Date | null>(null);
  const [isNCOpen, setIsNCOpen] = useState(false);
  const [ncForm, setNcForm] = useState<{ descricao: string; gravidade: GravidadeNC; setor: string }>({
    descricao: "",
    gravidade: "media",
    setor: "",
  });

  const modelosPublicados = useMemo(
    () => modelos.filter((m) => m.publicado !== false),
    [modelos],
  );

  const meusAgendamentos = useMemo(
    () =>
      agendamentos.filter(
        (a) =>
          a.status !== "concluido" &&
          a.status !== "cancelado" &&
          (!a.responsavel_id || a.responsavel_id === usuario.uid || !usuario.uid),
      ),
    [agendamentos, usuario.uid],
  );

  const ncsAbertas = useMemo(() => ncs.filter((n) => n.status !== "fechada"), [ncs]);

  const minhasExecucoes = useMemo(
    () => execucoes.filter((e) => e.responsavel_id === usuario.uid),
    [execucoes, usuario.uid],
  );

  const conformidadePessoal = useMemo(() => {
    const campos = minhasExecucoes.reduce((a, e) => a + (e.total_campos || 0), 0);
    const conformes = minhasExecucoes.reduce((a, e) => a + (e.total_conformes || 0), 0);
    return campos ? Math.round((conformes / campos) * 100) : 0;
  }, [minhasExecucoes]);

  useEffect(() => {
    const on = () => {
      setIsOnline(true);
      toast.success("Sincronização reativada");
    };
    const off = () => {
      setIsOnline(false);
      toast.warning("Modo offline ativado");
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const iniciarColeta = (
    modelo: CQModeloPlanilha & { id: string },
    agendamento?: CQAgendamento & { id: string },
  ) => {
    setModeloAtivo(modelo);
    setAgendamentoAtivo(agendamento || null);
    setValores({});
    setObservacoes({});
    setInicio(new Date());
  };

  const iniciarPorAgendamento = (ag: CQAgendamento & { id: string }) => {
    const modelo = modelos.find((m) => m.id === ag.modelo_id);
    if (!modelo) return toast.error("Modelo vinculado não encontrado ou desativado");
    iniciarColeta(modelo, ag);
  };

  const finalizarColeta = async () => {
    if (!modeloAtivo || !usuario.uid) return;
    const obrigatoriosVazios = (modeloAtivo.campos || []).filter(
      (c) => c.obrigatorio && (valores[c.id] === undefined || valores[c.id] === "" || valores[c.id] === null),
    );
    if (obrigatoriosVazios.length) {
      return toast.error(`Preencha os campos obrigatórios: ${obrigatoriosVazios.map((c) => c.label).join(", ")}`);
    }

    setSalvando(true);
    try {
      const respostas = montarRespostas(
        modeloAtivo,
        valores,
        Object.fromEntries(Object.entries(observacoes).map(([k, v]) => [k, { observacao: v }])),
      );
      const res = await registrarExecucao(
        {
          modelo: modeloAtivo,
          respostas,
          agendamento_id: agendamentoAtivo?.id,
          setor: agendamentoAtivo?.setor || modeloAtivo.setor,
          turno: agendamentoAtivo?.turno,
          iniciado_em: inicio || new Date(),
          assinar: true,
        },
        usuario,
      );
      toast.success(
        res.ncsGeradas.length
          ? `Inspeção registrada — ${res.ncsGeradas.length} NC gerada(s) automaticamente`
          : "Inspeção registrada e assinada digitalmente",
      );
      setModeloAtivo(null);
      setAgendamentoAtivo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar inspeção");
    } finally {
      setSalvando(false);
    }
  };

  const registrarNCManual = async () => {
    if (!ncForm.descricao.trim()) return toast.error("Descreva o desvio");
    setSalvando(true);
    try {
      await criarNC({
        descricao: ncForm.descricao.trim(),
        gravidade: ncForm.gravidade,
        status: "aberta",
        disposicao: "pendente",
        origem: "manual",
        setor: ncForm.setor,
        responsavel_id: usuario.uid,
        responsavel_nome: usuario.nome,
      } as Partial<CQNaoConformidade>);
      toast.success("Não conformidade registrada");
      setIsNCOpen(false);
      setNcForm({ descricao: "", gravidade: "media", setor: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar NC");
    } finally {
      setSalvando(false);
    }
  };

  const renderDashboard = () => {
    const proximo = meusAgendamentos[0];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <ClipboardList className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{meusAgendamentos.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Inspeções pendentes</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
              <p className="text-2xl font-bold text-foreground">{ncsAbertas.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Desvios em aberto</p>
            </CardContent>
          </Card>
        </div>

        {proximo ? (
          <Card className="bg-gradient-to-br from-card to-background border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Scan className="h-24 w-24 text-primary" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Próxima inspeção
                </span>
              </div>
              <CardTitle className="text-xl text-foreground font-bold">{proximo.modelo_nome}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {proximo.setor || "Sem setor"} {proximo.turno ? `• Turno ${proximo.turno}` : ""}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-bold">
                  Previsto: {formatarData(proximo.data_prevista)}
                </span>
              </div>
              <Button
                className="w-full h-14 bg-primary hover:bg-primary/90 text-foreground font-bold text-lg"
                onClick={() => iniciarPorAgendamento(proximo)}
              >
                <Scan className="mr-2 h-5 w-5" /> INICIAR COLETA
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground font-bold uppercase">Nenhuma inspeção agendada</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Minha performance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-success">{conformidadePessoal}%</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Conformidade</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{minhasExecucoes.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Coletas registradas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInspecoes = () => {
    const termo = busca.trim().toLowerCase();
    const lista = modelosPublicados.filter(
      (m) => !termo || m.nome.toLowerCase().includes(termo) || (m.setor || "").toLowerCase().includes(termo),
    );
    return (
      <div className="space-y-4 pb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar formulário..."
            className="pl-12 h-14 bg-card border-border rounded-2xl text-foreground"
          />
        </div>

        {loadingModelos ? (
          <div className="py-20 text-center animate-pulse text-muted-foreground font-semibold uppercase">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground font-semibold uppercase">Nenhum modelo publicado</div>
        ) : (
          lista.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => iniciarColeta(item)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-background text-muted-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold text-sm">{item.nome}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-background text-xs border-border h-4">
                      {item.campos?.length || 0} campos
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">v{item.versao}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))
        )}
      </div>
    );
  };

  const renderNC = () => (
    <div className="space-y-4 pb-10">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-foreground font-bold uppercase text-lg">Desvios em aberto</h3>
        <Button
          size="sm"
          className="bg-destructive hover:bg-destructive/90 text-foreground font-bold rounded-xl h-10"
          onClick={() => setIsNCOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> NOVA NC
        </Button>
      </div>

      {loadingNcs ? (
        <div className="py-20 text-center animate-pulse text-muted-foreground font-semibold uppercase">Carregando...</div>
      ) : ncsAbertas.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground font-semibold uppercase">Nenhum desvio em aberto</div>
      ) : (
        ncsAbertas.map((nc) => (
          <Card key={nc.id} className="bg-card border-border border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-primary uppercase">#{nc.id.substring(0, 8)}</span>
                <Badge
                  className={cn(
                    "uppercase text-xs",
                    nc.gravidade === "critica" || nc.gravidade === "alta"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning",
                  )}
                >
                  {nc.gravidade}
                </Badge>
              </div>
              <h4 className="text-foreground font-bold text-sm mb-3 leading-snug">{nc.descricao}</h4>
              <div className="flex justify-between text-xs text-muted-foreground uppercase font-bold">
                <span>{nc.setor || "Sem setor"}</span>
                <span>{nc.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{formatarData(nc.criado_em)}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderAgenda = () => (
    <div className="space-y-4 pb-10">
      <div className="bg-card border border-border rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Agenda CQ</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              {meusAgendamentos.length} inspeção(ões) pendente(s)
            </p>
          </div>
          <Calendar className="h-6 w-6 text-primary" />
        </div>

        {meusAgendamentos.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground font-bold uppercase">Nada agendado</p>
        ) : (
          <div className="space-y-3">
            {meusAgendamentos.map((ag) => (
              <div
                key={ag.id}
                className="p-4 bg-background border border-border rounded-2xl flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{ag.modelo_nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{formatarData(ag.data_prevista)}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-foreground font-bold"
                  onClick={() => iniciarPorAgendamento(ag)}
                >
                  Executar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col items-center py-8">
        <div className="h-24 w-24 rounded-full border-4 border-border p-1 mb-4 relative">
          <div className="h-full w-full rounded-full bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground">{usuario.nome}</h3>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mt-1">
          {usuario.cargo || usuario.perfil || user?.email}
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Últimas coletas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {minhasExecucoes.slice(0, 5).map((e) => (
            <div key={e.id} className="flex justify-between items-center text-xs border-b border-border pb-2">
              <span className="text-foreground font-bold">{e.modelo_nome}</span>
              <Badge
                className={
                  e.resultado === "conforme"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {e.resultado}
              </Badge>
            </div>
          ))}
          {minhasExecucoes.length === 0 && (
            <p className="text-muted-foreground text-xs uppercase font-bold py-6 text-center">Sem coletas registradas</p>
          )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full h-14 rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold text-lg border border-destructive/20"
        onClick={() => logout()}
      >
        <LogOut className="mr-2 h-5 w-5" /> DESCONECTAR
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {!isOnline && (
        <div className="bg-warning/20 border-b border-warning/30 py-1.5 flex items-center justify-center gap-2">
          <CloudOff className="h-3 w-3 text-warning" />
          <span className="text-xs font-semibold text-warning uppercase tracking-wide">
            Você está no modo offline
          </span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded-2xl p-1.5 flex items-center justify-center border border-border">
            <img src={logoPath} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              {activeTab === "dashboard"
                ? "PAINEL CQ"
                : activeTab === "inspecoes"
                  ? "INSPEÇÕES"
                  : activeTab === "nc"
                    ? "DESVIOS"
                    : activeTab === "agenda"
                      ? "MINHA AGENDA"
                      : "PERFIL"}
            </h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {usuario.nome}
            </p>
          </div>
        </div>
        <button className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center border border-border relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {ncsAbertas.length > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
          )}
        </button>
      </header>

      <main className="container mx-auto px-6 py-6 pb-28 min-h-[calc(100vh-140px)] max-w-xl md:max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "inspecoes" && renderInspecoes()}
            {activeTab === "nc" && renderNC()}
            {activeTab === "agenda" && renderAgenda()}
            {activeTab === "perfil" && renderPerfil()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* COLETA DINÂMICA */}
      <AnimatePresence>
        {modeloAtivo && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="bg-muted p-6 flex justify-between items-center border-b border-border">
              <div>
                <h3 className="text-foreground font-semibold uppercase text-lg">{modeloAtivo.nome}</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                  Iniciado às {inicio?.toLocaleTimeString("pt-BR")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setModeloAtivo(null)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(modeloAtivo.campos || [])
                .slice()
                .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                .map((campo) => (
                  <div key={campo.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {campo.label} {campo.obrigatorio && <span className="text-destructive">*</span>}
                      </label>
                      <span className="text-xs text-primary font-bold">
                        {campo.unidade}
                        {campo.tipo === "numerico" && (campo.limite_min != null || campo.limite_max != null)
                          ? ` (${campo.limite_min ?? "-∞"} a ${campo.limite_max ?? "+∞"})`
                          : ""}
                      </span>
                    </div>

                    {campo.tipo === "sim_nao" ? (
                      <div className="grid grid-cols-2 gap-3">
                        {["sim", "nao"].map((op) => (
                          <Button
                            key={op}
                            variant="outline"
                            className={cn(
                              "h-14 border-border uppercase font-semibold",
                              valores[campo.id] === op
                                ? "bg-primary/20 border-primary text-primary"
                                : "text-muted-foreground",
                            )}
                            onClick={() => setValores({ ...valores, [campo.id]: op })}
                          >
                            {op === "sim" ? "Sim" : "Não"}
                          </Button>
                        ))}
                      </div>
                    ) : campo.tipo === "selecao" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(campo.opcoes || []).map((op) => (
                          <Button
                            key={op}
                            variant="outline"
                            className={cn(
                              "h-12 border-border text-xs",
                              valores[campo.id] === op
                                ? "bg-primary/20 border-primary text-primary"
                                : "text-muted-foreground",
                            )}
                            onClick={() => setValores({ ...valores, [campo.id]: op })}
                          >
                            {op}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={campo.tipo === "numerico" ? "number" : campo.tipo === "data" ? "date" : "text"}
                        className="h-14 bg-muted border-2 border-border rounded-2xl text-lg font-bold text-foreground focus:border-primary text-center"
                        value={(valores[campo.id] as string) ?? ""}
                        onChange={(e) =>
                          setValores({
                            ...valores,
                            [campo.id]:
                              campo.tipo === "numerico"
                                ? e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                                : e.target.value,
                          })
                        }
                      />
                    )}

                    <Input
                      placeholder="Observação (opcional)"
                      className="bg-card border-border text-xs h-10"
                      value={observacoes[campo.id] || ""}
                      onChange={(e) => setObservacoes({ ...observacoes, [campo.id]: e.target.value })}
                    />
                  </div>
                ))}

              <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-2xl">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground font-bold uppercase">
                  Ao finalizar, a coleta é assinada digitalmente por {usuario.nome}
                </span>
              </div>
            </div>

            <div className="p-6 bg-background border-t border-border">
              <Button
                className="w-full h-16 bg-success hover:bg-success/90 text-foreground font-semibold text-xl"
                onClick={finalizarColeta}
                disabled={salvando}
              >
                {salvando ? "ENVIANDO..." : "FINALIZAR E ASSINAR"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NC MANUAL */}
      <AnimatePresence>
        {isNCOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <Card className="w-full max-w-md bg-muted border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 font-semibold uppercase">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Reportar desvio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Descrição *</label>
                  <Textarea
                    className="bg-background border-border"
                    value={ncForm.descricao}
                    onChange={(e) => setNcForm({ ...ncForm, descricao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Setor</label>
                  <Input
                    className="bg-background border-border h-11"
                    value={ncForm.setor}
                    onChange={(e) => setNcForm({ ...ncForm, setor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Gravidade</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["baixa", "media", "alta", "critica"] as GravidadeNC[]).map((g) => (
                      <Button
                        key={g}
                        variant="outline"
                        className={cn(
                          "h-11 border-border uppercase text-xs font-semibold",
                          ncForm.gravidade === g ? "bg-destructive/20 border-destructive text-destructive" : "text-muted-foreground",
                        )}
                        onClick={() => setNcForm({ ...ncForm, gravidade: g })}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="p-6 flex gap-3">
                <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => setIsNCOpen(false)}>
                  CANCELAR
                </Button>
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-foreground font-semibold"
                  onClick={registrarNCManual}
                  disabled={salvando}
                >
                  {salvando ? "SALVANDO..." : "REGISTRAR"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigationCQ
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badgeCounts={{
          inspecoes: meusAgendamentos.length,
          nc: ncsAbertas.length,
          agenda: meusAgendamentos.length,
        }}
      />
    </div>
  );
};

export default ExecucaoCQ;
