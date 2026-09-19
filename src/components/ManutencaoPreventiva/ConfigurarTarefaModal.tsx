import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addTarefaManutencao } from "@/firebase/manutencaoPreventiva";
import { TemplateTarefa } from "@/types/typesTemplatesTarefas";
import { Manutentor } from "@/types/typesManutencaoPreventiva";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { selecionarManutentorPorRodizio } from "@/services/rodizioManutentores";
import { Badge } from "@/components/ui/badge";
import { Users, Shuffle, Calendar, Clock } from "lucide-react";

interface ConfigurarTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateTarefa | null;
  onSuccess: () => void;
}

export function ConfigurarTarefaModal({ open, onOpenChange, template, onSuccess }: ConfigurarTarefaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [manutentores, setManutentores] = useState<Manutentor[]>([]);
  const [manutentoresFiltrados, setManutentoresFiltrados] = useState<Manutentor[]>([]);

  const [dataAgendada, setDataAgendada] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("08:00");
  const [selecaoAutomatica, setSelecaoAutomatica] = useState(true);
  const [manutentorId, setManutentorId] = useState("");
  const [manutentorSelecionado, setManutentorSelecionado] = useState<Manutentor | null>(null);

  useEffect(() => {
    loadManutentores();
  }, []);

  useEffect(() => {
    if (template) {
      const filtrados = manutentores.filter(m => m.funcao === template.tipo && m.ativo);
      setManutentoresFiltrados(filtrados);
    }
  }, [template, manutentores]);

  useEffect(() => {
    // Reset form when modal opens
    if (open) {
      setDataAgendada("");
      setHoraAgendada("08:00");
      setSelecaoAutomatica(true);
      setManutentorId("");
      setManutentorSelecionado(null);
    }
  }, [open]);

  const loadManutentores = async () => {
    try {
      const q = query(
        collection(db, "manutentores"),
        where("ativo", "==", true),
        orderBy("ordemPrioridade", "asc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Manutentor[];
      setManutentores(docs);
    } catch (error) {
      const querySnapshot = await getDocs(
        query(collection(db, "manutentores"), where("ativo", "==", true))
      );
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Manutentor[];
      setManutentores(docs);
    }
  };

  const handleManutentorChange = (id: string) => {
    setManutentorId(id);
    const manutentor = manutentores.find(m => m.id === id);
    setManutentorSelecionado(manutentor || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    if (!dataAgendada) {
      toast({
        title: "Erro",
        description: "Data agendada é obrigatória",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let manutentor: Manutentor | null = null;

      if (selecaoAutomatica) {
        manutentor = await selecionarManutentorPorRodizio(template.tipo);
        if (!manutentor) {
          toast({
            title: "Atenção",
            description: `Nenhum manutentor ativo encontrado para ${template.tipo}. Tarefa criada sem manutentor atribuído.`,
            variant: "destructive"
          });
        }
      } else {
        if (!manutentorId) {
          toast({
            title: "Erro",
            description: "Selecione um manutentor ou ative a seleção automática",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        manutentor = manutentorSelecionado;
      }

      const dataHoraAgendada = `${dataAgendada}T${horaAgendada}:00`;

      await addTarefaManutencao({
        tipo: template.tipo,
        maquinaId: template.maquinaId,
        maquinaNome: template.maquinaNome,
        setor: template.setor,
        periodo: template.periodo,
        periodoLabel: template.periodoLabel,
        sistema: template.sistema || "",
        subconjunto: template.subconjunto || "",
        componente: template.componente || "",
        descricaoTarefa: template.descricaoTarefa,
        manutentorId: manutentor?.id || "",
        manutentorNome: manutentor?.nome || "",
        manutentorEmail: manutentor?.email || "",
        tempoEstimado: template.tempoEstimado,
        proximaExecucao: dataAgendada,
        dataHoraAgendada,
        prioridade: template.prioridade,
        selecaoAutomatica,
        status: "pendente"
      });

      toast({
        title: "Sucesso",
        description: manutentor 
          ? `Tarefa agendada e atribuída a ${manutentor.nome}`
          : "Tarefa agendada com sucesso"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao agendar tarefa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Tarefa
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="font-medium">{template.titulo}</p>
          <p className="text-sm text-muted-foreground">{template.maquinaNome} • {template.tipo}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataAgendada" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data *
              </Label>
              <Input
                id="dataAgendada"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaAgendada" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora *
              </Label>
              <Input
                id="horaAgendada"
                type="time"
                value={horaAgendada}
                onChange={(e) => setHoraAgendada(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="font-medium">Manutentor</Label>
              </div>
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="selecaoAutomatica" className="text-sm">Rodízio Automático</Label>
                <Switch
                  id="selecaoAutomatica"
                  checked={selecaoAutomatica}
                  onCheckedChange={setSelecaoAutomatica}
                />
              </div>
            </div>

            {selecaoAutomatica ? (
              <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded">
                <p className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  O sistema selecionará automaticamente o manutentor com menor carga de trabalho
                </p>
                {manutentoresFiltrados.length > 0 && (
                  <p className="mt-2">
                    <span className="font-medium">{manutentoresFiltrados.length}</span> manutentor(es) disponível(is) para {template.tipo}
                  </p>
                )}
                {manutentoresFiltrados.length === 0 && (
                  <p className="mt-2 text-destructive">
                    Nenhum manutentor ativo para {template.tipo}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={manutentorId} onValueChange={handleManutentorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o manutentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {manutentoresFiltrados.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.nome}</span>
                          {m.ordemPrioridade && (
                            <Badge variant="outline" className="text-xs">
                              #{m.ordemPrioridade}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manutentoresFiltrados.length === 0 && (
                  <p className="text-sm text-destructive">
                    Nenhum manutentor com função "{template.tipo}" cadastrado
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Agendando..." : "Concluído"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
