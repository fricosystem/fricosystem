import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { registrarExecucaoTarefa } from "@/firebase/manutencaoPreventiva";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface ConcluirTarefaModalProps {
  tarefa: TarefaManutencao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConcluirTarefaModal({ tarefa, open, onOpenChange }: ConcluirTarefaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [problemasEncontrados, setProblemasEncontrados] = useState("");
  const [requerAcompanhamento, setRequerAcompanhamento] = useState(false);
  const [observacoesAcompanhamento, setObservacoesAcompanhamento] = useState("");
  const [checklist, setChecklist] = useState(
    tarefa.checklist?.map((item) => ({ ...item, concluido: false })) || []
  );

  // Calcular tempo decorrido desde o início da tarefa
  useEffect(() => {
    if (!tarefa.dataInicio) {
      setTempoDecorrido(0);
      return;
    }

    const calcularTempo = () => {
      const dataInicio = tarefa.dataInicio instanceof Timestamp 
        ? tarefa.dataInicio.toDate() 
        : new Date(tarefa.dataInicio as any);
      
      const agora = new Date();
      const diffMs = agora.getTime() - dataInicio.getTime();
      const diffMinutos = Math.max(1, Math.round(diffMs / (1000 * 60)));
      setTempoDecorrido(diffMinutos);
    };

    calcularTempo();
    
    // Atualizar a cada minuto enquanto o modal estiver aberto
    const interval = setInterval(calcularTempo, 60000);
    
    return () => clearInterval(interval);
  }, [tarefa.dataInicio, open]);

  const formatarTempo = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) {
      return `${horas} hora${horas !== 1 ? 's' : ''}`;
    }
    return `${horas}h ${mins}min`;
  };

  const handleConcluir = async () => {
    if (tempoDecorrido <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A tarefa precisa ser iniciada antes de concluir.",
      });
      return;
    }

    setLoading(true);
    try {
      await registrarExecucaoTarefa(
        tarefa.id,
        tempoDecorrido,
        observacoes || undefined,
        checklist.length > 0 ? checklist : undefined,
        undefined, // materiais - pode ser expandido posteriormente
        problemasEncontrados || undefined,
        requerAcompanhamento,
        observacoesAcompanhamento || undefined
      );

      toast({
        title: "Tarefa Concluída",
        description: `Manutenção registrada com ${formatarTempo(tempoDecorrido)}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível concluir a tarefa.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Concluir Manutenção</DialogTitle>
          <DialogDescription>
            Registre os detalhes da execução da manutenção
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Ordem e Máquina */}
            <div className="p-3 bg-muted rounded-lg space-y-1">
              {tarefa.ordemId && (
                <p className="text-sm font-medium font-mono">{tarefa.ordemId}</p>
              )}
              <p className="text-sm">{tarefa.maquinaNome}</p>
              <p className="text-xs text-muted-foreground">{tarefa.descricaoTarefa}</p>
            </div>

            {/* Tempo Decorrido - Calculado automaticamente */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">Tempo Decorrido</Label>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatarTempo(tempoDecorrido)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automaticamente desde o início da manutenção
              </p>
            </div>

            {/* Checklist */}
            {checklist.length > 0 && (
              <div>
                <Label>Checklist</Label>
                <div className="space-y-2 mt-2">
                  {checklist.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <Checkbox
                        id={`check-${item.id}`}
                        checked={item.concluido}
                        onCheckedChange={(checked) => {
                          const newChecklist = [...checklist];
                          newChecklist[index].concluido = checked === true;
                          setChecklist(newChecklist);
                        }}
                      />
                      <label
                        htmlFor={`check-${item.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {item.descricao}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva como foi a execução..."
                rows={3}
              />
            </div>

            {/* Problemas Encontrados */}
            <div>
              <Label htmlFor="problemas">Problemas Encontrados</Label>
              <Textarea
                id="problemas"
                value={problemasEncontrados}
                onChange={(e) => setProblemasEncontrados(e.target.value)}
                placeholder="Descreva problemas encontrados..."
                rows={3}
              />
            </div>

            {/* Requer Acompanhamento */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="acompanhamento"
                checked={requerAcompanhamento}
                onCheckedChange={(checked) => setRequerAcompanhamento(checked === true)}
              />
              <Label htmlFor="acompanhamento" className="cursor-pointer">
                Requer acompanhamento futuro
              </Label>
            </div>

            {requerAcompanhamento && (
              <div>
                <Label htmlFor="obsAcompanhamento">Observações de Acompanhamento</Label>
                <Textarea
                  id="obsAcompanhamento"
                  value={observacoesAcompanhamento}
                  onChange={(e) => setObservacoesAcompanhamento(e.target.value)}
                  placeholder="Descreva o que deve ser acompanhado..."
                  rows={2}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConcluir} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Concluindo..." : "Concluir Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
