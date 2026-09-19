import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updateTemplateTarefa } from "@/firebase/templatesTarefas";
import { TemplateTarefa } from "@/types/typesTemplatesTarefas";
import { TipoManutencao, PeriodoManutencao, PERIODOS_DIAS } from "@/types/typesManutencaoPreventiva";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface EditarTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateTarefa;
  onSuccess: () => void;
}

const TIPOS_MANUTENCAO: TipoManutencao[] = [
  "Elétrica", "Mecânica", "Hidráulica", "Pneumática", "Lubrificação", "Calibração", "Inspeção"
];

const PERIODOS: PeriodoManutencao[] = [
  "Diário", "Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"
];

export function EditarTemplateModal({ open, onOpenChange, template, onSuccess }: EditarTemplateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maquinas, setMaquinas] = useState<any[]>([]);

  const [titulo, setTitulo] = useState(template.titulo);
  const [tipo, setTipo] = useState<TipoManutencao>(template.tipo);
  const [maquinaId, setMaquinaId] = useState(template.maquinaId);
  const [maquinaNome, setMaquinaNome] = useState(template.maquinaNome);
  const [setor, setSetor] = useState(template.setor || "");
  const [periodo, setPeriodo] = useState<PeriodoManutencao>(template.periodoLabel);
  const [sistema, setSistema] = useState(template.sistema || "");
  const [subconjunto, setSubconjunto] = useState(template.subconjunto || "");
  const [componente, setComponente] = useState(template.componente || "");
  const [descricaoTarefa, setDescricaoTarefa] = useState(template.descricaoTarefa);
  const [tempoEstimado, setTempoEstimado] = useState(template.tempoEstimado.toString());
  const [prioridade, setPrioridade] = useState(template.prioridade);
  const [ativo, setAtivo] = useState(template.ativo);

  useEffect(() => {
    loadMaquinas();
  }, []);

  useEffect(() => {
    setTitulo(template.titulo);
    setTipo(template.tipo);
    setMaquinaId(template.maquinaId);
    setMaquinaNome(template.maquinaNome);
    setSetor(template.setor || "");
    setPeriodo(template.periodoLabel);
    setSistema(template.sistema || "");
    setSubconjunto(template.subconjunto || "");
    setComponente(template.componente || "");
    setDescricaoTarefa(template.descricaoTarefa);
    setTempoEstimado(template.tempoEstimado.toString());
    setPrioridade(template.prioridade);
    setAtivo(template.ativo);
  }, [template]);

  const loadMaquinas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "equipamentos"));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaquinas(docs);
    } catch (error) {
      console.error("Erro ao carregar máquinas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !maquinaId || !descricaoTarefa.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateTemplateTarefa(template.id, {
        titulo: titulo.trim(),
        tipo,
        maquinaId,
        maquinaNome,
        setor: setor.trim() || undefined,
        periodo: PERIODOS_DIAS[periodo],
        periodoLabel: periodo,
        sistema: sistema.trim(),
        subconjunto: subconjunto.trim(),
        componente: componente.trim(),
        descricaoTarefa: descricaoTarefa.trim(),
        tempoEstimado: Number(tempoEstimado) || 0,
        prioridade,
        ativo
      });

      toast({ title: "Sucesso", description: "Template atualizado com sucesso" });
      onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar template", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template de Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do template de tarefa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoManutencao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_MANUTENCAO.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">Período *</Label>
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoManutencao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maquina">Máquina *</Label>
              <Select 
                value={maquinaId} 
                onValueChange={(v) => {
                  setMaquinaId(v);
                  const maq = maquinas.find(m => m.id === v);
                  setMaquinaNome(maq?.equipamento || "");
                  setSetor(maq?.setor || "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a máquina" />
                </SelectTrigger>
                <SelectContent>
                  {maquinas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.equipamento} - {m.setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Input
                id="setor"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Produção"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sistema">Sistema</Label>
              <Input
                id="sistema"
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                placeholder="Ex: Hidráulico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subconjunto">Subconjunto</Label>
              <Input
                id="subconjunto"
                value={subconjunto}
                onChange={(e) => setSubconjunto(e.target.value)}
                placeholder="Ex: Bomba"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="componente">Componente</Label>
              <Input
                id="componente"
                value={componente}
                onChange={(e) => setComponente(e.target.value)}
                placeholder="Ex: Vedação"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Tarefa *</Label>
            <Textarea
              id="descricao"
              value={descricaoTarefa}
              onChange={(e) => setDescricaoTarefa(e.target.value)}
              placeholder="Descreva a tarefa de manutenção..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo Estimado (min)</Label>
              <Input
                id="tempo"
                type="number"
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value)}
                placeholder="60"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            <Label htmlFor="ativo">Template ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
