import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Manutentor } from "@/types/typesManutencaoPreventiva";
import { Loader2 } from "lucide-react";

interface Tarefa {
  id: string;
  tipo: string;
  maquinaId: string;
  maquinaNome: string;
  setor?: string;
  periodoLabel: string;
  sistema?: string;
  subconjunto?: string;
  componente?: string;
  descricaoTarefa: string;
  manutentorId?: string;
  manutentorNome?: string;
  proximaExecucao: string;
  dataHoraAgendada?: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  ativo?: boolean;
}

interface EditarTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa: Tarefa | null;
  onSuccess: () => void;
}

const TIPOS_MANUTENCAO = [
  "Elétrica",
  "Mecânica",
  "Hidráulica",
  "Pneumática",
  "Lubrificação",
  "Calibração",
  "Inspeção"
];

const PERIODOS = [
  "Diário",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual"
];

export function EditarTarefaModal({ open, onOpenChange, tarefa, onSuccess }: EditarTarefaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [manutentores, setManutentores] = useState<Manutentor[]>([]);

  const [tipo, setTipo] = useState("");
  const [maquinaId, setMaquinaId] = useState("");
  const [maquinaNome, setMaquinaNome] = useState("");
  const [setor, setSetor] = useState("");
  const [periodoLabel, setPeriodoLabel] = useState("");
  const [sistema, setSistema] = useState("");
  const [subconjunto, setSubconjunto] = useState("");
  const [componente, setComponente] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [manutentorId, setManutentorId] = useState("");
  const [manutentorNome, setManutentorNome] = useState("");
  const [proximaExecucao, setProximaExecucao] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("08:00");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta" | "critica">("media");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    loadMaquinas();
    loadManutentores();
  }, []);

  useEffect(() => {
    if (tarefa && open) {
      setTipo(tarefa.tipo || "");
      setMaquinaId(tarefa.maquinaId || "");
      setMaquinaNome(tarefa.maquinaNome || "");
      setSetor(tarefa.setor || "");
      setPeriodoLabel(tarefa.periodoLabel || "");
      setSistema(tarefa.sistema || "");
      setSubconjunto(tarefa.subconjunto || "");
      setComponente(tarefa.componente || "");
      setDescricaoTarefa(tarefa.descricaoTarefa || "");
      setManutentorId(tarefa.manutentorId || "");
      setManutentorNome(tarefa.manutentorNome || "");
      setProximaExecucao(tarefa.proximaExecucao || "");
      setPrioridade(tarefa.prioridade || "media");
      setAtivo(tarefa.ativo !== false);
      
      // Extrair hora do dataHoraAgendada se existir
      if (tarefa.dataHoraAgendada) {
        const hora = tarefa.dataHoraAgendada.split("T")[1]?.substring(0, 5) || "08:00";
        setHoraAgendada(hora);
      }
    }
  }, [tarefa, open]);

  const loadMaquinas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "equipamentos"));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaquinas(docs);
    } catch (error) {
      console.error("Erro ao carregar máquinas:", error);
    }
  };

  const loadManutentores = async () => {
    try {
      const q = query(
        collection(db, "manutentores"),
        where("ativo", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Manutentor[];
      setManutentores(docs);
    } catch (error) {
      console.error("Erro ao carregar manutentores:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tarefa) return;

    if (!maquinaId || !descricaoTarefa.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const dataHoraAgendada = `${proximaExecucao}T${horaAgendada}:00`;
      
      await updateDoc(doc(db, "tarefas_manutencao", tarefa.id), {
        tipo,
        maquinaId,
        maquinaNome,
        setor: setor.trim() || null,
        periodoLabel,
        sistema: sistema.trim() || null,
        subconjunto: subconjunto.trim() || null,
        componente: componente.trim() || null,
        descricaoTarefa: descricaoTarefa.trim(),
        manutentorId: manutentorId || null,
        manutentorNome: manutentorNome || null,
        proximaExecucao,
        dataHoraAgendada,
        prioridade,
        ativo,
        atualizadoEm: new Date()
      });

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManutentorChange = (id: string) => {
    setManutentorId(id);
    const manutentor = manutentores.find(m => m.id === id);
    setManutentorNome(manutentor?.nome || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa de Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
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
              <Select value={periodoLabel} onValueChange={setPeriodoLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
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

          <div className="space-y-2">
            <Label htmlFor="manutentor">Manutentor</Label>
            <Select value={manutentorId || "none"} onValueChange={(v) => handleManutentorChange(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o manutentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem manutentor</SelectItem>
                {manutentores.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} - {m.funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="proximaExecucao">Data Agendada *</Label>
              <Input
                id="proximaExecucao"
                type="date"
                value={proximaExecucao}
                onChange={(e) => setProximaExecucao(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaAgendada">Hora Agendada *</Label>
              <Input
                id="horaAgendada"
                type="time"
                value={horaAgendada}
                onChange={(e) => setHoraAgendada(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as typeof prioridade)}>
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

            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
              <Label htmlFor="ativo" className={ativo ? "text-green-600" : "text-muted-foreground"}>
                {ativo ? "Ativo" : "Inativo"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
