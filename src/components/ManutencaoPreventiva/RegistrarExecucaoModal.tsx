import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { registrarExecucaoTarefa } from "@/firebase/manutencaoPreventiva";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";

interface RegistrarExecucaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa: TarefaManutencao | null;
  onSuccess: () => void;
}

export function RegistrarExecucaoModal({ 
  open, 
  onOpenChange, 
  tarefa,
  onSuccess 
}: RegistrarExecucaoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tempoRealizado, setTempoRealizado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tarefa || !tempoRealizado) {
      toast({
        title: "Erro",
        description: "Tempo realizado é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await registrarExecucaoTarefa(
        tarefa.id,
        Number(tempoRealizado),
        observacoes.trim()
      );

      toast({
        title: "Sucesso",
        description: "Execução registrada com sucesso"
      });

      setTempoRealizado("");
      setObservacoes("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar execução",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tarefa) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Execução</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Máquina:</span> {tarefa.maquinaNome}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {tarefa.tipo}
              </div>
              <div>
                <span className="font-medium">Sistema:</span> {tarefa.sistema || "-"}
              </div>
              <div>
                <span className="font-medium">Componente:</span> {tarefa.componente || "-"}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Descrição:</span> {tarefa.descricaoTarefa}
              </div>
              <div>
                <span className="font-medium">Manutentor:</span> {tarefa.manutentorNome}
              </div>
              <div>
                <span className="font-medium">Tempo Estimado:</span> {tarefa.tempoEstimado} min
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempoRealizado">Tempo Realizado (minutos) *</Label>
            <Input
              id="tempoRealizado"
              type="number"
              value={tempoRealizado}
              onChange={(e) => setTempoRealizado(e.target.value)}
              placeholder="60"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a manutenção..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
