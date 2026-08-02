import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Search,
  FileText,
  Trash2,
  GripVertical,
  Download,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useCQModelos } from "@/hooks/useCQ";
import type { CQCampoModelo, CQModeloPlanilha, TipoCampoCQ } from "@/types/typesCQ";

const TIPOS: { valor: TipoCampoCQ; label: string }[] = [
  { valor: "numerico", label: "Numérico" },
  { valor: "texto", label: "Texto" },
  { valor: "selecao", label: "Seleção" },
  { valor: "sim_nao", label: "Sim / Não" },
  { valor: "data", label: "Data" },
  { valor: "foto", label: "Foto" },
  { valor: "assinatura", label: "Assinatura" },
];

const novoCampo = (ordem: number): CQCampoModelo => ({
  id: `campo_${Date.now()}_${ordem}`,
  label: "Novo campo",
  tipo: "numerico",
  obrigatorio: true,
  unidade: "",
  limite_min: null,
  limite_max: null,
  tolerancia: null,
  valor_esperado: null,
  opcoes: [],
  ponto_controle_id: "",
  ordem,
});

const PlanilhasCQ = () => {
  const { data: modelos, loading, criar, novaVersao, desativar } = useCQModelos({
    incluirInativos: false,
  });

  const [busca, setBusca] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baseVersao, setBaseVersao] = useState<(CQModeloPlanilha & { id: string }) | null>(null);
  const [campos, setCampos] = useState<CQCampoModelo[]>([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    setor: "",
    categoria: "",
    publicado: true,
  });

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return modelos;
    return modelos.filter((m) =>
      [m.nome, m.setor, m.categoria].filter(Boolean).some((v) => String(v).toLowerCase().includes(termo)),
    );
  }, [modelos, busca]);

  const abrirNovo = () => {
    setBaseVersao(null);
    setForm({ nome: "", descricao: "", setor: "", categoria: "", publicado: true });
    setCampos([]);
    setIsBuilderOpen(true);
  };

  const abrirNovaVersao = (m: CQModeloPlanilha & { id: string }) => {
    setBaseVersao(m);
    setForm({
      nome: m.nome || "",
      descricao: m.descricao || "",
      setor: m.setor || "",
      categoria: m.categoria || "",
      publicado: m.publicado !== false,
    });
    setCampos((m.campos || []).map((c, i) => ({ ...c, ordem: c.ordem ?? i })));
    setIsBuilderOpen(true);
  };

  const atualizarCampo = (id: string, patch: Partial<CQCampoModelo>) =>
    setCampos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const salvar = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome do modelo");
    if (!campos.length) return toast.error("Adicione ao menos um campo de coleta");
    if (campos.some((c) => !c.label.trim())) return toast.error("Todos os campos precisam de rótulo");

    setSalvando(true);
    try {
      const payload: Partial<CQModeloPlanilha> = {
        nome: form.nome.trim(),
        descricao: form.descricao,
        setor: form.setor,
        categoria: form.categoria,
        publicado: form.publicado,
        campos: campos.map((c, i) => ({ ...c, ordem: i })),
      };

      if (baseVersao) {
        await novaVersao(baseVersao.id, payload);
        toast.success("Nova versão homologada");
      } else {
        await criar(payload);
        toast.success("Modelo homologado");
      }
      setIsBuilderOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar modelo");
    } finally {
      setSalvando(false);
    }
  };

  const exportarPDF = () => {
    if (!modelos.length) return toast.error("Nenhum modelo para exportar");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Controle de Qualidade - Modelos homologados", 14, 20);
    doc.setFontSize(10);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 27);
    (doc as unknown as { autoTable: (o: unknown) => void }).autoTable({
      head: [["Nome", "Setor", "Categoria", "Campos", "Versão", "Publicado"]],
      body: modelos.map((m) => [
        m.nome,
        m.setor || "—",
        m.categoria || "—",
        String((m.campos || []).length),
        `v${m.versao}`,
        m.publicado === false ? "Não" : "Sim",
      ]),
      startY: 34,
      theme: "striped",
      headStyles: { fillColor: [6, 182, 212] },
      styles: { fontSize: 9 },
    });
    doc.save("modelos-cq.pdf");
    toast.success("PDF exportado");
  };

  const totalCampos = modelos.reduce((acc, m) => acc + (m.campos?.length || 0), 0);

  return (
    <AppLayout title="Engenharia de Formulários CQ">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Modelos ativos</p>
                <p className="text-xl font-bold text-foreground">{modelos.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Pontos de coleta</p>
                <p className="text-xl font-bold text-foreground">{totalCampos}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-success">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-success/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Publicados</p>
                <p className="text-xl font-bold text-foreground">
                  {modelos.filter((m) => m.publicado !== false).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar modelo..."
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border text-muted-foreground" onClick={exportarPDF}>
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-foreground font-bold" onClick={abrirNovo}>
              <Plus className="mr-2 h-4 w-4" /> Novo modelo
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs uppercase">Modelo</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Setor</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Campos</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Versão</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground text-xs uppercase">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse uppercase font-bold">
                      Carregando modelos...
                    </TableCell>
                  </TableRow>
                ) : lista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground uppercase font-bold">
                      Nenhum modelo cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  lista.map((m) => (
                    <TableRow key={m.id} className="border-border hover:bg-muted/20">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{m.nome}</span>
                          <span className="text-xs text-muted-foreground">{m.descricao || "Sem descrição"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{m.setor || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{m.campos?.length || 0}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">v{m.versao}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            m.publicado === false
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-success/10 text-success border-success/20"
                          }
                        >
                          {m.publicado === false ? "Rascunho" : "Publicado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:bg-primary/10 text-xs font-bold uppercase"
                            onClick={() => abrirNovaVersao(m)}
                          >
                            Nova versão
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => desativar(m.id).then(() => toast.success("Modelo desativado"))}
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="bg-background border-border max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-bold uppercase tracking-tight">
              <FileText className="h-5 w-5 text-primary" />
              {baseVersao ? `Nova versão — ${baseVersao.nome}` : "Novo modelo de inspeção"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Defina limites de controle: valores fora da faixa geram Não Conformidade automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome *</label>
                <Input
                  className="bg-muted border-border"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Categoria / Norma</label>
                <Input
                  className="bg-muted border-border"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.publicado}
                  onCheckedChange={(v) => setForm({ ...form, publicado: v })}
                />
                <span className="text-xs font-bold text-foreground uppercase">Publicar para execução</span>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Descrição</label>
                <Textarea
                  className="bg-muted border-border"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Campos de coleta
              </h4>
              {campos.map((c) => (
                <div key={c.id} className="p-4 bg-card border border-border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={c.label}
                      onChange={(e) => atualizarCampo(c.id, { label: e.target.value })}
                      className="bg-background border-border text-sm font-bold text-foreground"
                    />
                    <Select
                      value={c.tipo}
                      onValueChange={(v) => atualizarCampo(c.id, { tipo: v as TipoCampoCQ })}
                    >
                      <SelectTrigger className="w-40 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {TIPOS.map((t) => (
                          <SelectItem key={t.valor} value={t.valor}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setCampos((prev) => prev.filter((f) => f.id !== c.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Input
                      placeholder="Unidade"
                      className="bg-background border-border text-xs"
                      value={c.unidade || ""}
                      onChange={(e) => atualizarCampo(c.id, { unidade: e.target.value })}
                    />
                    {c.tipo === "numerico" ? (
                      <>
                        <Input
                          type="number"
                          placeholder="Mínimo"
                          className="bg-background border-border text-xs"
                          value={c.limite_min ?? ""}
                          onChange={(e) =>
                            atualizarCampo(c.id, {
                              limite_min: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Máximo"
                          className="bg-background border-border text-xs"
                          value={c.limite_max ?? ""}
                          onChange={(e) =>
                            atualizarCampo(c.id, {
                              limite_max: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Tolerância"
                          className="bg-background border-border text-xs"
                          value={c.tolerancia ?? ""}
                          onChange={(e) =>
                            atualizarCampo(c.id, {
                              tolerancia: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                      </>
                    ) : (
                      <Input
                        placeholder={c.tipo === "selecao" ? "Opções (separadas por vírgula)" : "Valor esperado"}
                        className="bg-background border-border text-xs md:col-span-3"
                        value={
                          c.tipo === "selecao"
                            ? (c.opcoes || []).join(", ")
                            : c.valor_esperado === null || c.valor_esperado === undefined
                              ? ""
                              : String(c.valor_esperado)
                        }
                        onChange={(e) =>
                          c.tipo === "selecao"
                            ? atualizarCampo(c.id, {
                                opcoes: e.target.value
                                  .split(",")
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              })
                            : atualizarCampo(c.id, { valor_esperado: e.target.value || null })
                        }
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.obrigatorio}
                        onCheckedChange={(v) => atualizarCampo(c.id, { obrigatorio: v })}
                      />
                      <span className="text-xs text-muted-foreground uppercase font-bold">Obrigatório</span>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-border text-muted-foreground hover:text-primary"
                onClick={() => setCampos((prev) => [...prev, novoCampo(prev.length)])}
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar campo
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsBuilderOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-foreground font-bold"
              disabled={salvando}
              onClick={salvar}
            >
              {salvando ? "Salvando..." : baseVersao ? "Homologar nova versão" : "Homologar modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PlanilhasCQ;
