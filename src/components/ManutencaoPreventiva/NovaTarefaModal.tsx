import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addTarefaManutencao } from "@/firebase/manutencaoPreventiva";
import { TipoManutencao, PeriodoManutencao, PERIODOS_DIAS } from "@/types/typesManutencaoPreventiva";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useManutentores } from "@/hooks/useManutentores";

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TIPOS_MANUTENCAO: TipoManutencao[] = [
  "Elétrica",
  "Mecânica",
  "Hidráulica",
  "Pneumática",
  "Lubrificação",
  "Calibração",
  "Inspeção"
];

const PERIODOS: PeriodoManutencao[] = [
  "Diário",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual"
];

export function NovaTarefaModal({ open, onOpenChange, onSuccess }: NovaTarefaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const { data: manutentores = [], isLoading: loadingManutentores } = useManutentores();

  const [tipo, setTipo] = useState<TipoManutencao>("Mecânica");
  const [maquinaId, setMaquinaId] = useState("");
  const [maquinaNome, setMaquinaNome] = useState("");
  const [setor, setSetor] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoManutencao>("Mensal");
  const [sistema, setSistema] = useState("");
  const [subconjunto, setSubconjunto] = useState("");
  const [componente, setComponente] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [manutentorId, setManutentorId] = useState("");
  const [manutentorNome, setManutentorNome] = useState("");
  const [manutentorEmail, setManutentorEmail] = useState("");
  const [tempoEstimado, setTempoEstimado] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("08:00");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta" | "critica">("media");

  useEffect(() => {
    loadMaquinas();
  }, []);

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

    if (!maquinaId || !manutentorId || !descricaoTarefa.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const hoje = new Date();
      const proximaData = new Date(hoje);
      proximaData.setDate(proximaData.getDate() + PERIODOS_DIAS[periodo]);

      // Construir data/hora agendada se fornecida
      let dataHoraAgendada: string | undefined;
      if (dataAgendada && horaAgendada) {
        dataHoraAgendada = `${dataAgendada}T${horaAgendada}:00`;
      }

      await addTarefaManutencao({
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
        manutentorId,
        manutentorNome,
        manutentorEmail,
        tempoEstimado: Number(tempoEstimado) || 0,
        proximaExecucao: dataAgendada || proximaData.toISOString().split('T')[0],
        dataHoraAgendada,
        prioridade,
        status: "pendente"
      });

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso"
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipo("Mecânica");
    setMaquinaId("");
    setMaquinaNome("");
    setSetor("");
    setPeriodo("Mensal");
    setSistema("");
    setSubconjunto("");
    setComponente("");
    setDescricaoTarefa("");
    setManutentorId("");
    setManutentorNome("");
    setManutentorEmail("");
    setTempoEstimado("");
    setDataAgendada("");
    setHoraAgendada("08:00");
    setPrioridade("media");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa de Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="manutentor">Manutentor *</Label>
              <Select 
                value={manutentorId} 
                onValueChange={(v) => {
                  setManutentorId(v);
                  const man = manutentores.find(m => m.id === v);
                  setManutentorNome(man?.nome || "");
                  setManutentorEmail(man?.email || "");
                }}
                disabled={loadingManutentores}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingManutentores ? "Carregando..." : "Selecione o manutentor"} />
                </SelectTrigger>
                <SelectContent>
                  {manutentores
                    .filter(m => m.ativo)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome} ({m.funcao})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataAgendada">Data Agendada</Label>
              <Input
                id="dataAgendada"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaAgendada">Hora Agendada</Label>
              <Input
                id="horaAgendada"
                type="time"
                value={horaAgendada}
                onChange={(e) => setHoraAgendada(e.target.value)}
              />
            </div>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
