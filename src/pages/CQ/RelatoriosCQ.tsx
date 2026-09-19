import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  Printer,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCQKPIs, useCQLotes } from "@/hooks/useCQ";
import { toDate } from "@/services/cq/CQService";
import type { CQFiltroPeriodo, GravidadeNC } from "@/types/typesCQ";

const GRAVIDADES: GravidadeNC[] = ["baixa", "media", "alta", "critica"];

const inicioDoMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const RelatoriosCQ = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);

  const [inicio, setInicio] = useState<string>(
    inicioDoMes().toISOString().substring(0, 10),
  );
  const [fim, setFim] = useState<string>(new Date().toISOString().substring(0, 10));
  const [setor, setSetor] = useState<string>("todos");
  const [turno, setTurno] = useState<string>("todos");
  const [loteCodigo, setLoteCodigo] = useState<string>("");

  const filtro: CQFiltroPeriodo = useMemo(
    () => ({
      inicio: inicio ? new Date(`${inicio}T00:00:00`) : undefined,
      fim: fim ? new Date(`${fim}T23:59:59`) : undefined,
      setor: setor !== "todos" ? setor : undefined,
      turno: turno !== "todos" ? turno : undefined,
    }),
    [inicio, fim, setor, turno],
  );

  const { kpis, execucoes, ncs, acoes, loading } = useCQKPIs(filtro);
  const { data: lotes } = useCQLotes();

  const execucoesFiltradas = useMemo(
    () =>
      loteCodigo.trim()
        ? execucoes.filter((e) =>
            (e.lote_codigo || "").toLowerCase().includes(loteCodigo.trim().toLowerCase()),
          )
        : execucoes,
    [execucoes, loteCodigo],
  );

  const setores = useMemo(
    () => Array.from(new Set(execucoes.map((e) => e.setor).filter(Boolean))) as string[],
    [execucoes],
  );
  const turnos = useMemo(
    () => Array.from(new Set(execucoes.map((e) => e.turno).filter(Boolean))) as string[],
    [execucoes],
  );

  const dataNC = useMemo(
    () =>
      GRAVIDADES.map((g) => ({
        name: g.toUpperCase(),
        count: kpis.ncsPorGravidade[g] || 0,
      })),
    [kpis],
  );

  const dataTendencia = useMemo(
    () =>
      kpis.tendencia.map((t) => ({
        name: t.periodo,
        conformidade: Number(t.conformidade.toFixed(1)),
      })),
    [kpis],
  );

  const ncsFechadas = useMemo(() => ncs.filter((n) => n.status === "fechada").length, [ncs]);
  const acoesVerificadas = useMemo(
    () => acoes.filter((a) => a.status === "verificada").length,
    [acoes],
  );

  return (
    <AppLayout title="Central de Inteligência e Relatórios CQ">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 bg-card p-4 border border-border rounded-xl">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-border text-muted-foreground"
              onClick={() => setIsFiltersOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {new Date(`${inicio}T00:00:00`).toLocaleDateString("pt-BR")} —{" "}
              {new Date(`${fim}T00:00:00`).toLocaleDateString("pt-BR")}
            </Badge>
            {setor !== "todos" && (
              <Badge variant="outline" className="border-border text-foreground">
                Setor: {setor}
              </Badge>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-border text-primary font-bold"
              onClick={() => setIsExportPreviewOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-foreground font-bold"
              onClick={() => {
                if (!execucoesFiltradas.length) {
                  toast.error("Nenhum dado no período selecionado");
                  return;
                }
                const linhas = [
                  [
                    "data",
                    "modelo",
                    "setor",
                    "turno",
                    "responsavel",
                    "lote",
                    "resultado",
                    "conformes",
                    "total_campos",
                  ].join(";"),
                  ...execucoesFiltradas.map((e) =>
                    [
                      toDate(e.criado_em)?.toLocaleString("pt-BR") || "",
                      e.modelo_nome,
                      e.setor || "",
                      e.turno || "",
                      e.responsavel_nome,
                      e.lote_codigo || "",
                      e.resultado,
                      e.total_conformes,
                      e.total_campos,
                    ].join(";"),
                  ),
                ].join("\n");
                const url = URL.createObjectURL(
                  new Blob([`\uFEFF${linhas}`], { type: "text/csv;charset=utf-8" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = `relatorio-cq-${inicio}-a-${fim}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Relatório exportado");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Inspeções</p>
              <p className="text-3xl font-semibold text-foreground">{execucoesFiltradas.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-success">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                Taxa de Conformidade
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {kpis.taxaConformidade.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">NCs Abertas</p>
              <p className="text-3xl font-semibold text-foreground">{kpis.ncsAbertas}</p>
              <p className="text-xs text-muted-foreground mt-1">{ncsFechadas} fechadas no período</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-primary/60">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                MTTR Ações (h)
              </p>
              <p className="text-3xl font-semibold text-foreground">{kpis.mttrAcoesHoras.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">{acoesVerificadas} ações verificadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Não Conformidades por Gravidade
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {ncs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground uppercase text-xs font-semibold tracking-wide">
                  Sem não conformidades no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataNC}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }}
                      itemStyle={{ color: "#22d3ee" }}
                    />
                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} name="NCs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Tendência de Conformidade (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {dataTendencia.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground uppercase text-xs font-semibold tracking-wide">
                  Sem execuções no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataTendencia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="conformidade"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Conformidade"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pareto */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Pareto de Causas / Pontos de Controle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpis.paretoCausas.length === 0 ? (
              <p className="text-muted-foreground uppercase text-xs font-semibold tracking-wide py-8 text-center">
                Nenhuma causa registrada
              </p>
            ) : (
              kpis.paretoCausas.map((c) => (
                <div key={c.causa} className="flex items-center gap-4">
                  <span className="text-xs text-foreground w-56 truncate">{c.causa}</span>
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(c.total / kpis.paretoCausas[0].total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{c.total}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Lotes com NC */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Lotes bloqueados / em recall
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lotes.filter((l) => l.status === "bloqueado" || l.status === "em_recall").length ===
            0 ? (
              <p className="text-muted-foreground uppercase text-xs font-semibold tracking-wide py-6 text-center">
                Nenhum lote com restrição
              </p>
            ) : (
              lotes
                .filter((l) => l.status === "bloqueado" || l.status === "em_recall")
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between text-xs bg-background border border-border rounded-lg px-4 py-3"
                  >
                    <span className="text-foreground font-bold">
                      {l.codigo} · {l.produto_nome}
                    </span>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 uppercase text-xs">
                      {l.status}
                    </Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL: Filtros */}
      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="bg-background border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-semibold">
              <Filter className="h-5 w-5 text-primary" />
              FILTROS DE ANÁLISE
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Início</label>
              <Input
                type="date"
                className="bg-muted border-border text-foreground"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Fim</label>
              <Input
                type="date"
                className="bg-muted border-border text-foreground"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Setor</label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground">
                  <SelectItem value="todos">Todos</SelectItem>
                  {setores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Turno</label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground">
                  <SelectItem value="todos">Todos</SelectItem>
                  {turnos.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Lote</label>
              <Input
                className="bg-muted border-border text-foreground"
                placeholder="Código do lote"
                value={loteCodigo}
                onChange={(e) => setLoteCodigo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-foreground font-bold"
              onClick={() => setIsFiltersOpen(false)}
            >
              APLICAR FILTROS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Preview */}
      <Dialog open={isExportPreviewOpen} onOpenChange={setIsExportPreviewOpen}>
        <DialogContent className="bg-background border-border max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              PRÉ-VISUALIZAÇÃO DO RELATÓRIO
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-card rounded-xl border border-border p-8 overflow-y-auto mb-4">
            <div id="cq-relatorio-print" className="max-w-2xl mx-auto bg-white p-12 shadow-2xl text-slate-950">
              <div className="border-b-4 border-border pb-6 mb-8">
                <h1 className="text-2xl font-bold uppercase tracking-tight">
                  Relatório de Controle de Qualidade
                </h1>
                <p className="text-xs font-bold text-muted-foreground">
                  Período: {new Date(`${inicio}T00:00:00`).toLocaleDateString("pt-BR")} a{" "}
                  {new Date(`${fim}T00:00:00`).toLocaleDateString("pt-BR")} · Emitido em{" "}
                  {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <p>
                    <strong>Inspeções:</strong> {execucoesFiltradas.length}
                  </p>
                  <p>
                    <strong>Conformidade:</strong> {kpis.taxaConformidade.toFixed(1)}%
                  </p>
                  <p>
                    <strong>NCs abertas:</strong> {kpis.ncsAbertas}
                  </p>
                  <p>
                    <strong>Aderência ao cronograma:</strong>{" "}
                    {kpis.aderenciaCronograma.toFixed(1)}%
                  </p>
                </div>
                <h2 className="text-lg font-bold border-l-4 border-border pl-4">
                  Execuções do período
                </h2>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-left">
                      <th className="py-1">Data</th>
                      <th>Modelo</th>
                      <th>Setor</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execucoesFiltradas.slice(0, 40).map((e) => (
                      <tr key={e.id} className="border-b border-slate-200">
                        <td className="py-1">
                          {toDate(e.criado_em)?.toLocaleDateString("pt-BR") || "—"}
                        </td>
                        <td>{e.modelo_nome}</td>
                        <td>{e.setor || "—"}</td>
                        <td>{e.resultado}</td>
                      </tr>
                    ))}
                    {execucoesFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 text-muted-foreground">
                          Nenhuma execução registrada no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setIsExportPreviewOpen(false)}
            >
              Fechar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-foreground font-bold px-8"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" /> IMPRIMIR / PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RelatoriosCQ;
