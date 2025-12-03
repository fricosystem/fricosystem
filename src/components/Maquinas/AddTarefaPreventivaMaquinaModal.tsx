import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { addTarefaManutencao } from "@/firebase/manutencaoPreventiva";
import { PeriodoManutencao, TipoManutencao, StatusTarefa, PERIODOS_DIAS } from "@/types/typesManutencaoPreventiva";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Sistema {
  id: string;
  nome: string;
  pecas?: Peca[];
}

interface Peca {
  id: string;
  nome: string;
  subPecas?: SubPeca[];
}

interface SubPeca {
  id: string;
  nome: string;
}

interface Manutentor {
  id: string;
  nome: string;
  email: string;
  funcao: TipoManutencao;
  ativo: boolean;
}

interface AddTarefaPreventivaMaquinaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  equipamentoNome: string;
  sistemas: Sistema[];
  onSuccess: () => void;
}

export const AddTarefaPreventivaMaquinaModal = ({
  open,
  onOpenChange,
  equipamentoId,
  equipamentoNome,
  sistemas,
  onSuccess
}: AddTarefaPreventivaMaquinaModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [manutentores, setManutentores] = useState<Manutentor[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState({
    tipo: "Mecânica" as TipoManutencao,
    periodo: "Mensal" as PeriodoManutencao,
    sistema: "",
    subconjunto: "",
    componente: "",
    subcomponente: "",
    descricaoTarefa: "",
    manutentorId: "",
    dataHora: "",
    hora: "08:00",
    status: "pendente" as StatusTarefa
  });

  // Buscar manutentores
  useEffect(() => {
    const fetchManutentores = async () => {
      try {
        const q = query(collection(db, "manutentores"), where("ativo", "==", true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Manutentor[];
        setManutentores(data);
      } catch (error) {
        console.error("Erro ao buscar manutentores:", error);
      }
    };
    if (open) {
      fetchManutentores();
    }
  }, [open]);

  // Manutentores filtrados por tipo
  const manutentoresFiltrados = useMemo(() => {
    return manutentores.filter(m => m.funcao === formData.tipo);
  }, [manutentores, formData.tipo]);

  // Sistema selecionado
  const sistemaSelecionado = useMemo(() => {
    return sistemas.find(s => s.id === formData.sistema);
  }, [sistemas, formData.sistema]);

  // Componente selecionado (peça)
  const componenteSelecionado = useMemo(() => {
    return sistemaSelecionado?.pecas?.find(p => p.id === formData.componente);
  }, [sistemaSelecionado, formData.componente]);

  // Reset campos dependentes quando muda seleção superior
  useEffect(() => {
    if (formData.sistema) {
      setFormData(prev => ({ ...prev, componente: "", subcomponente: "" }));
    }
  }, [formData.sistema]);

  useEffect(() => {
    if (formData.componente) {
      setFormData(prev => ({ ...prev, subcomponente: "" }));
    }
  }, [formData.componente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sistema || !formData.descricaoTarefa || !formData.manutentorId) {
      toast({
        title: "Erro",
        description: "Sistema, descrição da tarefa e manutentor são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const manutentor = manutentores.find(m => m.id === formData.manutentorId);
    if (!manutentor) {
      toast({
        title: "Erro",
        description: "Manutentor não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const hoje = new Date();
      const dataInicio = date || hoje;
      const proximaExecucao = new Date(dataInicio);
      const [hora, minuto] = formData.hora.split(':');
      proximaExecucao.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      const sistemaObj = sistemas.find(s => s.id === formData.sistema);
      const componenteObj = sistemaObj?.pecas?.find(p => p.id === formData.componente);
      const subcomponenteObj = componenteObj?.subPecas?.find(sp => sp.id === formData.subcomponente);

      await addTarefaManutencao({
        tipo: formData.tipo,
        maquinaId: equipamentoId,
        maquinaNome: equipamentoNome,
        periodo: PERIODOS_DIAS[formData.periodo],
        periodoLabel: formData.periodo,
        sistema: sistemaObj?.nome || formData.sistema,
        subconjunto: formData.subconjunto,
        componente: componenteObj?.nome || formData.componente,
        descricaoTarefa: formData.descricaoTarefa,
        manutentorId: formData.manutentorId,
        manutentorNome: manutentor.nome,
        manutentorEmail: manutentor.email || "",
        tempoEstimado: 0,
        proximaExecucao: proximaExecucao.toISOString().split('T')[0],
        status: formData.status,
        ...(formData.subcomponente && { subcomponente: subcomponenteObj?.nome || formData.subcomponente }),
        ...(formData.dataHora && { dataHora: proximaExecucao.toISOString() })
      });

      toast({
        title: "Sucesso",
        description: "Tarefa de manutenção criada com sucesso!"
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        tipo: "Mecânica",
        periodo: "Mensal",
        sistema: "",
        subconjunto: "",
        componente: "",
        subcomponente: "",
        descricaoTarefa: "",
        manutentorId: "",
        dataHora: "",
        hora: "08:00",
        status: "pendente"
      });
      setDate(new Date());
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa de manutenção.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa de Manutenção Preventiva</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Manutenção *</Label>
              <Select value={formData.tipo} onValueChange={(value: TipoManutencao) => setFormData({ ...formData, tipo: value, manutentorId: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elétrica">Elétrica</SelectItem>
                  <SelectItem value="Mecânica">Mecânica</SelectItem>
                  <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                  <SelectItem value="Pneumática">Pneumática</SelectItem>
                  <SelectItem value="Lubrificação">Lubrificação</SelectItem>
                  <SelectItem value="Calibração">Calibração</SelectItem>
                  <SelectItem value="Inspeção">Inspeção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Período *</Label>
              <Select value={formData.periodo} onValueChange={(value: PeriodoManutencao) => setFormData({ ...formData, periodo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diário">Diário</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Bimestral">Bimestral</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sistema *</Label>
            <Select value={formData.sistema} onValueChange={(value) => setFormData({ ...formData, sistema: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um sistema" />
              </SelectTrigger>
              <SelectContent>
                {sistemas.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subconjunto</Label>
            <Input
              value={formData.subconjunto}
              onChange={(e) => setFormData({ ...formData, subconjunto: e.target.value })}
              placeholder="Ex: Conjunto de transmissão"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Componente (Peça)</Label>
              <Select 
                value={formData.componente} 
                onValueChange={(value) => setFormData({ ...formData, componente: value })}
                disabled={!formData.sistema}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um componente" />
                </SelectTrigger>
                <SelectContent>
                  {sistemaSelecionado?.pecas?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcomponente</Label>
              <Select 
                value={formData.subcomponente} 
                onValueChange={(value) => setFormData({ ...formData, subcomponente: value })}
                disabled={!formData.componente}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um subcomponente" />
                </SelectTrigger>
                <SelectContent>
                  {componenteSelecionado?.subPecas?.map(sp => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Tarefa *</Label>
            <Textarea
              value={formData.descricaoTarefa}
              onChange={(e) => setFormData({ ...formData, descricaoTarefa: e.target.value })}
              placeholder="Descreva a tarefa de manutenção..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Manutentor Responsável *</Label>
            <Select value={formData.manutentorId} onValueChange={(value) => setFormData({ ...formData, manutentorId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um manutentor" />
              </SelectTrigger>
              <SelectContent>
                {manutentoresFiltrados.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} - {m.funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Primeira Execução *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={formData.status} onValueChange={(value: StatusTarefa) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Realizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
