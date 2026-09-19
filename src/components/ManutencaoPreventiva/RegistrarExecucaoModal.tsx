import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { registrarExecucaoTarefa, iniciarTarefa } from "@/firebase/manutencaoPreventiva";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Play } from "lucide-react";
import { Timestamp } from "firebase/firestore";

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
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [observacoes, setObservacoes] = useState("");

  // Calcular tempo decorrido desde o início da tarefa
  useEffect(() => {
    if (!tarefa?.dataInicio || tarefa.status !== "em_andamento") {
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
    const interval = setInterval(calcularTempo, 60000);
    
    return () => clearInterval(interval);
  }, [tarefa?.dataInicio, tarefa?.status, open]);

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

  const handleIniciar = async () => {
    if (!tarefa || !userData?.email) return;

    setLoading(true);
    try {
      await iniciarTarefa(tarefa.id, userData.email);
      toast({
        title: "Manutenção Iniciada",
        description: "O cronômetro está rodando. Clique em 'Concluir' quando terminar."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao iniciar manutenção",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConcluir = async () => {
    if (!tarefa) return;

    if (tempoDecorrido <= 0) {
      toast({
        title: "Erro",
        description: "A manutenção precisa ser iniciada primeiro",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await registrarExecucaoTarefa(
        tarefa.id,
        tempoDecorrido,
        observacoes.trim() || undefined
      );

      toast({
        title: "Sucesso",
        description: `Execução registrada com ${formatarTempo(tempoDecorrido)}`
      });

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

  const isEmAndamento = tarefa.status === "em_andamento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Execução</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            </div>
          </div>

          {/* Tempo Decorrido ou Botão Iniciar */}
          {isEmAndamento ? (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">Tempo Decorrido</Label>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatarTempo(tempoDecorrido)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automaticamente desde o início
              </p>
            </div>
          ) : (
            <div className="p-4 bg-orange-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-5 w-5 text-orange-500" />
                <Label className="text-base font-medium">Manutenção não iniciada</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Clique em "Iniciar" para começar a contagem do tempo
              </p>
              <Button onClick={handleIniciar} disabled={loading} variant="outline" className="w-full">
                {loading ? "Iniciando..." : "Iniciar Manutenção"}
              </Button>
            </div>
          )}

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
            <Button 
              onClick={handleConcluir} 
              disabled={loading || !isEmAndamento}
            >
              {loading ? "Registrando..." : "Concluir"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
