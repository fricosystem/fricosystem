import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  TrendingUp,
  Target,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCQKPIs } from "@/hooks/useCQ";
import { toDate } from "@/services/cq/CQService";
import type { CQNaoConformidade } from "@/types/typesCQ";

type PeriodoFiltro = "today" | "7d" | "30d" | "90d";

const PERIODOS: Record<PeriodoFiltro, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

const formatarData = (valor: unknown) => {
  const d = toDate(valor);
  return d ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
};

const DashboardCQ = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30d");
  const [setor, setSetor] = useState<string>("todos");
  const [ncSelecionada, setNcSelecionada] = useState<(CQNaoConformidade & { id: string }) | null>(null);

  const filtro = useMemo(() => {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - PERIODOS[periodo]);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, setor: setor === "todos" ? undefined : setor };
  }, [periodo, setor]);

  const { kpis, ncs, execucoes, loading, error } = useCQKPIs(filtro);

  const setores = useMemo(() => {
    const set = new Set<string>();
    execucoes.forEach((e) => e.setor && set.add(e.setor));
    ncs.forEach((n) => n.setor && set.add(n.setor));
    return Array.from(set).sort();
  }, [execucoes, ncs]);

  const tendencia = useMemo(
    () =>
      kpis.tendencia.map((t) => ({
        day: t.periodo.slice(5).split("-").reverse().join("/"),
        val: Number(t.conformidade.toFixed(1)),
      })),
    [kpis.tendencia],
  );

  const pareto = useMemo(
    () => kpis.paretoCausas.map((p) => ({ cause: p.causa, count: p.total })),
    [kpis.paretoCausas],
  );

  const ncCritica = useMemo(
    () =>
      ncs
        .filter((n) => n.status !== "fechada" && (n.gravidade === "critica" || n.gravidade === "alta"))
        .sort((a, b) => (toDate(b.criado_em)?.getTime() || 0) - (toDate(a.criado_em)?.getTime() || 0))[0] ||
      null,
    [ncs],
  );

  const riscoPorSetor = useMemo(() => {
    const mapa = new Map<string, { campos: number; naoConformes: number }>();
    execucoes.forEach((e) => {
      const chave = e.setor || "Sem setor";
      const atual = mapa.get(chave) || { campos: 0, naoConformes: 0 };
      atual.campos += e.total_campos || 0;
      atual.naoConformes += (e.total_campos || 0) - (e.total_conformes || 0);
      mapa.set(chave, atual);
    });
    return Array.from(mapa.entries())
      .map(([area, v]) => ({
        area,
        taxa: v.campos > 0 ? (v.naoConformes / v.campos) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 8);
  }, [execucoes]);

  const corRisco = (taxa: number) => {
    if (taxa >= 8) return "bg-destructive/60 border-destructive";
    if (taxa >= 3) return "bg-warning/40 border-warning";
    if (taxa > 0) return "bg-success/20 border-success/50";
    return "bg-muted/50 border-border";
  };

  const semDados = !loading && execucoes.length === 0 && ncs.length === 0;

  const indicadores = [
    {
      label: "Conformidade",
      valor: `${kpis.taxaConformidade.toFixed(1)}%`,
      icone: ShieldCheck,
      cor: "text-success",
    },
    { label: "Execuções", valor: String(kpis.totalExecucoes), icone: CheckCircle2, cor: "text-primary" },
    { label: "NCs abertas", valor: String(kpis.ncsAbertas), icone: AlertTriangle, cor: "text-destructive" },
    {
      label: "Tempo médio",
      valor: `${kpis.tempoMedioInspecaoMin.toFixed(1)} min`,
      icone: Clock,
      cor: "text-warning",
    },
  ];

  return (
    <AppLayout title="Inteligência de Qualidade (BI)">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-muted/80 border border-border p-3 rounded-2xl backdrop-blur-xl flex flex-wrap items-center gap-4 sticky top-0 z-20 shadow-2xl">
          <div className="flex items-center gap-2 px-3 border-r border-border mr-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Filtros BI
            </span>
          </div>

          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
            <SelectTrigger className="w-[150px] bg-background border-border text-xs h-9">
              <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger className="w-[180px] bg-background border-border text-xs h-9">
              <Layers className="h-3 w-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
              <SelectItem value="todos">Todos os setores</SelectItem>
              {setores.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {loading ? (
            <Badge className="bg-muted text-muted-foreground border-border px-3 py-1 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando dados
            </Badge>
          ) : error ? (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1">
              Erro ao sincronizar
            </Badge>
          ) : (
            <Badge className="bg-success/10 text-success border-success/20 px-3 py-1">
              Dados em tempo real
            </Badge>
          )}
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {indicadores.map((ind) => (
            <Card key={ind.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wide text-muted-foreground">
                    {ind.label}
                  </p>
                  <p className={`text-2xl font-semibold ${ind.cor}`}>{loading ? "—" : ind.valor}</p>
                </div>
                <ind.icone className={`h-6 w-6 ${ind.cor} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {semDados && (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-10 text-center space-y-2">
              <Layers className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground uppercase">
                Nenhum dado de qualidade no período
              </p>
              <p className="text-xs text-muted-foreground">
                Cadastre modelos, agende inspeções e registre execuções para alimentar os indicadores.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alerta crítico real */}
        {ncCritica && (
          <div
            className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between cursor-pointer group"
            onClick={() => setNcSelecionada(ncCritica)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-destructive p-2 rounded-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-destructive font-semibold text-sm uppercase">
                  NC {ncCritica.gravidade}: {ncCritica.descricao}
                </h3>
                <p className="text-xs text-destructive/70">
                  Setor: {ncCritica.setor || "—"} | Lote: {ncCritica.lote_codigo || "—"} |{" "}
                  {formatarData(ncCritica.criado_em)}
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-destructive group-hover:translate-x-2 transition-transform" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tendência */}
          <Card className="lg:col-span-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tendência de conformidade (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {tendencia.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase font-bold">
                  Sem execuções registradas no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendencia}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }} />
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#colorVal)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* NCs por gravidade */}
          <Card className="lg:col-span-4 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                NCs por gravidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["critica", "alta", "media", "baixa"] as const).map((g) => {
                const total = kpis.ncsPorGravidade[g];
                const max = Math.max(1, ...Object.values(kpis.ncsPorGravidade));
                const cores: Record<string, string> = {
                  critica: "bg-destructive",
                  alta: "bg-orange-500",
                  media: "bg-warning",
                  baixa: "bg-success",
                };
                return (
                  <div key={g} className="space-y-1">
                    <div className="flex justify-between text-xs uppercase font-semibold text-muted-foreground">
                      <span>{g}</span>
                      <span className="text-foreground">{total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${cores[g]} rounded-full transition-all`}
                        style={{ width: `${(total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 mt-2 border-t border-border grid grid-cols-2 gap-2 text-xs uppercase font-bold text-muted-foreground">
                <div>
                  Aderência
                  <p className="text-sm text-primary font-semibold">
                    {kpis.aderenciaCronograma.toFixed(0)}%
                  </p>
                </div>
                <div>
                  MTTR ações
                  <p className="text-sm text-primary font-semibold">{kpis.mttrAcoesHoras.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pareto real */}
          <Card className="lg:col-span-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Pareto: causas raiz registradas
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {pareto.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase font-bold">
                  Nenhuma não conformidade registrada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pareto} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <YAxis dataKey="cause" type="category" stroke="#64748b" fontSize={10} width={110} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Risco por setor real */}
          <Card className="lg:col-span-6 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Risco por setor (taxa de desvio)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {riscoPorSetor.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground uppercase font-bold">
                  Sem execuções por setor
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 h-[180px]">
                  {riscoPorSetor.map((a) => (
                    <div
                      key={a.area}
                      className={`rounded-xl border flex flex-col items-center justify-center ${corRisco(
                        a.taxa,
                      )} transition-all hover:brightness-125`}
                    >
                      <span className="text-xs font-semibold uppercase text-foreground/60 px-1 text-center">
                        {a.area}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{a.taxa.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              {riscoPorSetor[0] && riscoPorSetor[0].taxa > 0 && (
                <div className="mt-4 flex justify-between items-center bg-background p-2 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter flex items-center gap-2">
                    <Target className="h-3 w-3 text-destructive" />
                    Maior risco: {riscoPorSetor[0].area}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detalhe da NC (dado real) */}
      <Dialog open={!!ncSelecionada} onOpenChange={(open) => !open && setNcSelecionada(null)}>
        <DialogContent className="bg-background border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              NÃO CONFORMIDADE {ncSelecionada?.codigo || ncSelecionada?.id?.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <p className="text-sm text-foreground">{ncSelecionada?.descricao}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Status</dt>
                <dd className="text-foreground">{ncSelecionada?.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Gravidade</dt>
                <dd className="text-foreground">{ncSelecionada?.gravidade}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Setor</dt>
                <dd className="text-foreground">{ncSelecionada?.setor || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Lote</dt>
                <dd className="text-foreground">{ncSelecionada?.lote_codigo || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Responsável</dt>
                <dd className="text-foreground">{ncSelecionada?.responsavel_nome || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase font-bold text-xs">Aberta em</dt>
                <dd className="text-foreground">{formatarData(ncSelecionada?.criado_em)}</dd>
              </div>
            </dl>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-destructive hover:bg-destructive/90 text-foreground font-semibold"
              onClick={() => setNcSelecionada(null)}
            >
              FECHAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DashboardCQ;
