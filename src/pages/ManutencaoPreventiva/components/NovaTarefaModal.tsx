import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addTarefaManutencao } from "@/firebase/manutencaoPreventiva";
import { TipoManutencao, PeriodoManutencao, PERIODOS_DIAS, Manutentor } from "@/types/typesManutencaoPreventiva";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { selecionarManutentorPorMenorCarga, ResultadoSelecao } from "@/services/rodizioManutentores";
import { Badge } from "@/components/ui/badge";
import { Users, Shuffle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [manutentores, setManutentores] = useState<Manutentor[]>([]);
  const [manutentoresFiltrados, setManutentoresFiltrados] = useState<Manutentor[]>([]);

  const [tipo, setTipo] = useState<TipoManutencao>("Mecânica");
  const [maquinaId, setMaquinaId] = useState("");
  const [maquinaNome, setMaquinaNome] = useState("");
  const [setor, setSetor] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoManutencao>("Mensal");
  const [sistema, setSistema] = useState("");
  const [subconjunto, setSubconjunto] = useState("");
  const [componente, setComponente] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  
  const [dataAgendada, setDataAgendada] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("08:00");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta" | "critica">("media");
  
  // Campos de seleção de manutentor
  const [selecaoAutomatica, setSelecaoAutomatica] = useState(true);
  const [manutentorId, setManutentorId] = useState("");
  const [manutentorSelecionado, setManutentorSelecionado] = useState<Manutentor | null>(null);
  const [previewSelecao, setPreviewSelecao] = useState<ResultadoSelecao | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadMaquinas();
    loadManutentores();
  }, []);

  // Filtrar manutentores por tipo de manutenção selecionado
  useEffect(() => {
    const filtrados = manutentores.filter(m => m.funcao === tipo && m.ativo);
    setManutentoresFiltrados(filtrados);
    
    // Resetar seleção manual quando mudar tipo
    if (!selecaoAutomatica && !filtrados.find(m => m.id === manutentorId)) {
      setManutentorId("");
      setManutentorSelecionado(null);
    }
    
    // Preview da seleção automática
    if (selecaoAutomatica && filtrados.length > 0) {
      loadPreviewSelecao();
    }
  }, [tipo, manutentores, selecaoAutomatica]);

  const loadPreviewSelecao = async () => {
    setLoadingPreview(true);
    try {
      const resultado = await selecionarManutentorPorMenorCarga(tipo);
      setPreviewSelecao(resultado);
    } catch (error) {
      console.error("Erro ao carregar preview:", error);
    } finally {
      setLoadingPreview(false);
    }
  };

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
        where("ativo", "==", true),
        orderBy("ordemPrioridade", "asc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Manutentor[];
      setManutentores(docs);
    } catch (error) {
      // Fallback sem orderBy se o índice não existir
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

    if (!maquinaId || !descricaoTarefa.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

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
      let motivoSelecao = "";

      if (selecaoAutomatica) {
        // Usar algoritmo de menor carga
        const resultado = await selecionarManutentorPorMenorCarga(tipo);
        manutentor = resultado.manutentor;
        motivoSelecao = resultado.motivo;
        
        if (!manutentor) {
          toast({
            title: "Atenção",
            description: `Nenhum manutentor ativo encontrado para ${tipo}. Tarefa criada sem manutentor atribuído.`,
            variant: "destructive"
          });
        }
      } else {
        // Usar manutentor selecionado manualmente
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

      // Construir data/hora agendada
      const dataHoraAgendada = `${dataAgendada}T${horaAgendada}:00`;

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
        manutentorId: manutentor?.id || "",
        manutentorNome: manutentor?.nome || "",
        manutentorEmail: manutentor?.email || "",
        tempoEstimado: 0,
        proximaExecucao: dataAgendada,
        dataHoraAgendada,
        prioridade,
        selecaoAutomatica,
        status: "pendente"
      });

      toast({
        title: "Sucesso",
        description: manutentor 
          ? `✅ Tarefa criada e atribuída a ${manutentor.nome}. ${motivoSelecao}`
          : "Tarefa criada com sucesso"
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
    
    setDataAgendada("");
    setHoraAgendada("08:00");
    setPrioridade("media");
    setSelecaoAutomatica(true);
    setManutentorId("");
    setManutentorSelecionado(null);
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

          {/* Seleção de Manutentor */}
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
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded">
                  <p className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    Seleção automática por menor carga de trabalho
                  </p>
                  {manutentoresFiltrados.length > 0 && (
                    <p className="mt-2">
                      <span className="font-medium">{manutentoresFiltrados.length}</span> manutentor(es) disponível(is) para {tipo}
                    </p>
                  )}
                  {manutentoresFiltrados.length === 0 && (
                    <p className="mt-2 text-destructive">
                      Nenhum manutentor ativo para {tipo}
                    </p>
                  )}
                </div>
                
                {/* Preview da seleção automática */}
                {loadingPreview ? (
                  <div className="text-sm text-muted-foreground">Calculando...</div>
                ) : previewSelecao?.manutentor ? (
                  <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{previewSelecao.manutentor.nome}</span> será selecionado
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {previewSelecao.motivo}
                      </span>
                    </AlertDescription>
                  </Alert>
                ) : previewSelecao ? (
                  <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {previewSelecao.motivo}
                    </AlertDescription>
                  </Alert>
                ) : null}
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
                    Nenhum manutentor com função "{tipo}" cadastrado
                  </p>
                )}
              </div>
            )}
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
              <Label htmlFor="dataAgendada">Data Agendada *</Label>
              <Input
                id="dataAgendada"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
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
