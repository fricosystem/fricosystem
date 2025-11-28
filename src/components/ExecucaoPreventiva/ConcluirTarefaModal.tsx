import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { registrarExecucaoTarefa } from "@/firebase/manutencaoPreventiva";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConcluirTarefaModalProps {
  tarefa: TarefaManutencao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConcluirTarefaModal({ tarefa, open, onOpenChange }: ConcluirTarefaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tempoRealizado, setTempoRealizado] = useState(tarefa.tempoEstimado.toString());
  const [observacoes, setObservacoes] = useState("");
  const [problemasEncontrados, setProblemasEncontrados] = useState("");
  const [requerAcompanhamento, setRequerAcompanhamento] = useState(false);
  const [observacoesAcompanhamento, setObservacoesAcompanhamento] = useState("");
  const [checklist, setChecklist] = useState(
    tarefa.checklist?.map((item) => ({ ...item, concluido: false })) || []
  );

  const handleConcluir = async () => {
    const tempo = parseInt(tempoRealizado);
    if (isNaN(tempo) || tempo <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe um tempo válido.",
      });
      return;
    }

    setLoading(true);
    try {
      await registrarExecucaoTarefa(
        tarefa.id,
        tempo,
        observacoes || undefined,
        checklist.length > 0 ? checklist : undefined,
        undefined, // materiais - pode ser expandido posteriormente
        problemasEncontrados || undefined,
        requerAcompanhamento,
        observacoesAcompanhamento || undefined
      );

      toast({
        title: "Tarefa Concluída",
        description: "A manutenção foi registrada com sucesso.",
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

            {/* Tempo Realizado */}
            <div>
              <Label htmlFor="tempo">Tempo Realizado (minutos) *</Label>
              <Input
                id="tempo"
                type="number"
                value={tempoRealizado}
                onChange={(e) => setTempoRealizado(e.target.value)}
                placeholder="Ex: 45"
              />
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
