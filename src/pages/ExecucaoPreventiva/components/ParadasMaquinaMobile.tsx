import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Play, CheckCircle, Clock, AlertTriangle, Timer, Calendar, Wrench, User, FileText, ChevronRight, CheckCircle2, Ban } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadgeParada } from "@/pages/ParadaMaquina/components/StatusBadgeParada";
import { HistoricoAcoesTimeline } from "@/pages/ParadaMaquina/components/HistoricoAcoesTimeline";
import { useParadaMaquina } from "@/hooks/useParadaMaquina";
import { ParadaMaquina, podeIniciarExecucao, getOrigensParadaArray } from "@/types/typesParadaMaquina";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TempoInicioIndicator } from "@/pages/ParadaMaquina/components/TempoInicioIndicator";

// Helper para formatar horário (pode ser string ou Timestamp)
function formatHorario(horario: any): string {
  if (!horario) return "-";
  if (typeof horario === "string") return horario;
  if (horario.toDate) {
    return format(horario.toDate(), "HH:mm", { locale: ptBR });
  }
  return "-";
}

// Helper para calcular tempo de parada
function calcularTempoParada(hrInicial?: string, hrFinal?: string): string | null {
  if (!hrInicial || !hrFinal) return null;
  const [hI, mI] = hrInicial.split(":").map(Number);
  const [hF, mF] = hrFinal.split(":").map(Number);
  const inicioMin = hI * 60 + mI;
  const fimMin = hF * 60 + mF;
  const diffMin = fimMin - inicioMin;
  if (diffMin <= 0) return null;
  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
}

// Componente InfoRow para informações
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

// Componente de contagem regressiva
function CountdownTimer({ horarioInicio }: { horarioInicio: any }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!horarioInicio) return;

    const updateCountdown = () => {
      const now = new Date();
      let inicio: Date;
      
      if (typeof horarioInicio === "string") {
        const today = format(now, "yyyy-MM-dd");
        inicio = new Date(`${today}T${horarioInicio}:00`);
      } else if (horarioInicio.toDate) {
        inicio = horarioInicio.toDate();
      } else {
        return;
      }
      
      const diffSeconds = differenceInSeconds(inicio, now);
      
      // Só exibe se estiver entre 0 e 15 minutos (900 segundos)
      if (diffSeconds > 0 && diffSeconds <= 900) {
        setTimeLeft(diffSeconds);
      } else {
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [horarioInicio]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 text-base font-bold text-orange-600 dark:text-orange-400 px-2 py-1 animate-pulse">
      <Timer className="h-4 w-4" />
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}

// Componente de tempo decorrido (para status em_andamento)
function TempoDecorridoTimer({ horarioExecucaoInicio, paused = false }: { horarioExecucaoInicio: any; paused?: boolean }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!horarioExecucaoInicio) return;

    const updateElapsed = () => {
      let inicio: Date;
      
      if (horarioExecucaoInicio.toDate) {
        inicio = horarioExecucaoInicio.toDate();
      } else if (horarioExecucaoInicio instanceof Date) {
        inicio = horarioExecucaoInicio;
      } else {
        return;
      }
      
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - inicio.getTime()) / 1000);
      setElapsed(Math.max(0, diffSeconds));
    };

    updateElapsed();
    
    // Se pausado, não atualiza mais
    if (paused) return;
    
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [horarioExecucaoInicio, paused]);

  if (!horarioExecucaoInicio) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xs text-muted-foreground">
        {paused ? "Tempo de execução (pausado)" : "Tempo em execução"}
      </span>
      <span className={`text-xl font-bold font-mono ${paused ? "text-muted-foreground" : "text-primary"}`}>{formatTime()}</span>
    </div>
  );
}

// Helper para formatar tempo decorrido salvo
function formatTempoDecorrido(segundos?: number): string {
  if (!segundos) return "-";
  
  const hours = Math.floor(segundos / 3600);
  const minutes = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Helper para verificar se pode iniciar (5 minutos antes do horarioInicio)
function podeIniciarPorHorario(horarioInicio: any): { pode: boolean; mensagem: string } {
  if (!horarioInicio) return { pode: true, mensagem: "" };
  
  const now = new Date();
  let inicio: Date;
  
  if (typeof horarioInicio === "string") {
    const today = format(now, "yyyy-MM-dd");
    inicio = new Date(`${today}T${horarioInicio}:00`);
  } else if (horarioInicio.toDate) {
    inicio = horarioInicio.toDate();
  } else {
    return { pode: true, mensagem: "" };
  }
  
  const diffMs = inicio.getTime() - now.getTime();
  const diffMinutos = diffMs / (1000 * 60);
  
  if (diffMinutos > 5) {
    const minutos = Math.ceil(diffMinutos);
    return { 
      pode: false, 
      mensagem: `Aguarde ${minutos} min para iniciar (liberado 5 min antes)` 
    };
  }
  
  return { pode: true, mensagem: "" };
}

export function ParadasMaquinaMobile() {
  const { 
    paradasParaManutentor, 
    loading, 
    iniciarExecucao, 
    finalizarExecucao,
    cancelarParada
  } = useParadaMaquina();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [solucaoAplicada, setSolucaoAplicada] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredParadas = paradasParaManutentor.filter((parada) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.descricaoMotivo?.toLowerCase().includes(searchValue)
    );
  });

  const handleIniciar = async (parada: ParadaMaquina) => {
    // Verificar regra dos 5 minutos
    const { pode, mensagem } = podeIniciarExecucao(parada.horarioProgramado);
    if (!pode) {
      toast.error(mensagem);
      return;
    }

    setProcessingId(parada.id);
    const success = await iniciarExecucao(parada.id);
    setProcessingId(null);
    
    if (success) {
      setIsDetailOpen(false);
    }
  };

  const handleFinalizar = async () => {
    if (!selectedParada) return;
    
    if (!solucaoAplicada.trim()) {
      toast.error("Informe a solução aplicada");
      return;
    }

    setProcessingId(selectedParada.id);
    const success = await finalizarExecucao(selectedParada.id, solucaoAplicada);
    setProcessingId(null);
    
    if (success) {
      setIsFinalizando(false);
      setSolucaoAplicada("");
      // Não fecha o modal - vai para status aguardando_verificacao
    }
  };

  const handleCancelar = async () => {
    if (!selectedParada) return;
    
    if (!motivoCancelamento.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    setProcessingId(selectedParada.id);
    const success = await cancelarParada(selectedParada.id, motivoCancelamento, "manutentor");
    setProcessingId(null);
    
    if (success) {
      setIsCancelando(false);
      setMotivoCancelamento("");
      setIsDetailOpen(false);
    }
  };

  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    return getOrigensParadaArray(origens);
  };

  const formatHorarioProgramado = (parada: ParadaMaquina) => {
    if (!parada.horarioProgramado) return "Não definido";
    return format(parada.horarioProgramado.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
  };

  const openDetail = (parada: ParadaMaquina) => {
    setSelectedParada(parada);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Barra de Busca Aprimorada */}
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 py-3">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar parada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full text-base h-14 rounded-xl"
            />
          </div>
        </CardHeader>
      </Card>

      {filteredParadas.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma parada para executar</p>
          <p className="text-muted-foreground text-sm mt-1">Você não tem paradas atribuídas no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParadas.map((parada) => {
            const tempoParada = calcularTempoParada(parada.hrInicial, parada.hrFinal);
            return (
              <button
                key={parada.id}
                onClick={() => openDetail(parada)}
                className={`w-full text-left bg-card border rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform ${
                  parada.status === "nao_concluido" ? "border-red-500/50 bg-red-500/5" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {parada.equipamento}
                    </h3>
                    <p className="text-base text-muted-foreground mt-1">
                      {parada.setor}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                {parada.status === "nao_concluido" && parada.observacaoVerificacao && (
                  <div className="p-2 bg-red-500/10 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {parada.observacaoVerificacao}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {(parada.hrInicial || parada.hrFinal) && (
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg">
                      <Timer className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">
                        {parada.hrInicial || "--:--"} - {parada.hrFinal || "--:--"}
                      </span>
                    </div>
                  )}
                  {parada.tipoManutencao && (
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-4 w-4" />
                      <span>{parada.tipoManutencao}</span>
                    </div>
                  )}
                  {tempoParada && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{tempoParada}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadgeParada status={parada.status} />
                    <CountdownTimer horarioInicio={parada.hrInicial} />
                    <TempoInicioIndicator hrInicial={parada.hrInicial} hrFinal={parada.hrFinal} status={parada.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Tentativa {parada.tentativaAtual || 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes - Sheet Bottom */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Detalhes da Parada</SheetTitle>
          </SheetHeader>
          
          {selectedParada && (
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-5 pb-4">
                  {/* Header com Status */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <StatusBadgeParada status={selectedParada.status} />
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{selectedParada.equipamento}</h2>
                    <p className="text-base text-muted-foreground">{selectedParada.setor}</p>
                  </div>

                  <Separator />

                  {/* Informações Gerais */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Informações Gerais
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <InfoRow 
                        icon={<Calendar className="h-5 w-5" />}
                        label="Data/Hora do Registro"
                        value={selectedParada.criadoEm ? format(selectedParada.criadoEm.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
                      />
                      <InfoRow 
                        icon={<Clock className="h-5 w-5" />}
                        label="Horário Programado"
                        value={selectedParada.hrInicial || "--:--"}
                      />
                      <InfoRow 
                        icon={<Wrench className="h-5 w-5" />}
                        label="Tipo de Manutenção"
                        value={selectedParada.tipoManutencao || "Não informado"}
                      />
                      <InfoRow 
                        icon={<AlertTriangle className="h-5 w-5" />}
                        label="Tipo de Falha"
                        value={(selectedParada as any).tipoFalha || "-"}
                      />
                      <InfoRow 
                        icon={<User className="h-5 w-5" />}
                        label="Responsável (Criador)"
                        value={selectedParada.encarregadoNome || selectedParada.responsavelManutencao || "Não informado"}
                      />
                      {selectedParada.horarioExecucaoInicio && (
                        <InfoRow 
                          icon={<Play className="h-5 w-5" />}
                          label="Iniciou às"
                          value={format(selectedParada.horarioExecucaoInicio.toDate(), "HH:mm:ss 'no dia' dd/MM/yyyy", { locale: ptBR })}
                        />
                      )}
                      {selectedParada.tempoTotalDecorrido && (
                        <InfoRow 
                          icon={<Timer className="h-5 w-5" />}
                          label="Tempo Total de Execução"
                          value={formatTempoDecorrido(selectedParada.tempoTotalDecorrido)}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Origens da Parada */}
                  {selectedParada.origemParada && getOrigensParada(selectedParada.origemParada).length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-primary" />
                          Origem da Parada
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {getOrigensParada(selectedParada.origemParada).map((origem, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-sm px-3 py-1.5"
                            >
                              {origem}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Descrição do Motivo */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Descrição do Motivo</h3>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-base leading-relaxed">
                        {selectedParada.descricaoMotivo || "Nenhuma descrição fornecida"}
                      </p>
                    </div>
                  </div>

                  {/* Solução Aplicada */}
                  {selectedParada.solucaoAplicada && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          Solução Aplicada
                        </h3>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                          <p className="text-base leading-relaxed">
                            {selectedParada.solucaoAplicada}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Motivo da Reprovação */}
                  {selectedParada.status === "nao_concluido" && selectedParada.observacaoVerificacao && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Motivo da Reprovação
                        </h3>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                          <p className="text-base leading-relaxed text-red-700">
                            {selectedParada.observacaoVerificacao}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Informações de Auditoria */}
                  <Separator />
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Informações de Auditoria
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID do Registro:</span>
                        <p className="font-mono text-xs mt-0.5 break-all">{selectedParada.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tentativa:</span>
                        <p className="mt-0.5">{selectedParada.tentativaAtual || 1}ª tentativa</p>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <Separator />
                  <div className="space-y-3 pb-6">
                    {selectedParada?.status === "aguardando" || selectedParada?.status === "nao_concluido" ? (
                      <>
                        {!podeIniciarPorHorario((selectedParada as any).horarioInicio).pode && (
                          <p className="text-xs text-muted-foreground text-center">
                            {podeIniciarPorHorario((selectedParada as any).horarioInicio).mensagem}
                          </p>
                        )}
                        <Button 
                          className="w-full h-14 text-base font-semibold"
                          onClick={() => handleIniciar(selectedParada)}
                          disabled={processingId === selectedParada?.id || !podeIniciarPorHorario((selectedParada as any).horarioInicio).pode}
                        >
                          {processingId === selectedParada?.id ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-5 w-5 mr-2" />
                          )}
                          {selectedParada?.status === "nao_concluido" ? "Reiniciar Execução" : "Iniciar Execução"}
                        </Button>
                      </>
                    ) : selectedParada?.status === "em_andamento" ? (
                      <>
                        {selectedParada.horarioExecucaoInicio && (
                          <div className="bg-primary/10 rounded-xl p-4">
                            <TempoDecorridoTimer horarioExecucaoInicio={selectedParada.horarioExecucaoInicio} />
                          </div>
                        )}
                        <Button 
                          className="w-full h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700"
                          onClick={() => setIsFinalizando(true)}
                          disabled={processingId === selectedParada?.id}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Finalizar Execução
                        </Button>
                        <Button 
                          className="w-full h-14 text-base font-semibold"
                          variant="destructive"
                          onClick={() => setIsCancelando(true)}
                          disabled={processingId === selectedParada?.id}
                        >
                          <Ban className="h-5 w-5 mr-2" />
                          Cancelar Parada
                        </Button>
                      </>
                    ) : selectedParada?.status === "aguardando_verificacao" || 
                         selectedParada?.status?.match(/^aguardando_verificacao_\d+$/) ? (
                      <>
                        {selectedParada.horarioExecucaoInicio && (
                          <div className="bg-muted/50 rounded-xl p-4">
                            <TempoDecorridoTimer horarioExecucaoInicio={selectedParada.horarioExecucaoInicio} paused={true} />
                          </div>
                        )}
                        <Button 
                          className="w-full h-14 text-base font-semibold"
                          disabled={true}
                          variant="secondary"
                        >
                          <Clock className="h-5 w-5 mr-2" />
                          Aguardando Verificação {selectedParada.tentativaAtual && selectedParada.tentativaAtual > 1 ? `(Tentativa ${selectedParada.tentativaAtual})` : ""}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TabsContent>
                
                <TabsContent value="historico" className="pb-4">
                  <HistoricoAcoesTimeline historico={selectedParada.historicoAcoes || []} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Finalização */}
      <Dialog open={isFinalizando} onOpenChange={setIsFinalizando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Execução</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Solução Aplicada *</label>
              <Textarea
                placeholder="Descreva a solução aplicada..."
                value={solucaoAplicada}
                onChange={(e) => setSolucaoAplicada(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFinalizando(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFinalizar}
              disabled={processingId !== null || !solucaoAplicada.trim()}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={isCancelando} onOpenChange={setIsCancelando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Parada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar esta parada em andamento? Esta ação não pode ser desfeita.
            </p>
            <div>
              <label className="text-sm font-medium">Motivo do Cancelamento *</label>
              <Textarea
                placeholder="Informe o motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCancelando(false)}>
              Voltar
            </Button>
            <Button 
              onClick={handleCancelar}
              disabled={processingId !== null || !motivoCancelamento.trim()}
              variant="destructive"
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
