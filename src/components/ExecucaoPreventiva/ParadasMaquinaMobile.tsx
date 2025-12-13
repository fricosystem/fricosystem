import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Play, CheckCircle, Clock, AlertTriangle, Timer, Calendar } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadgeParada } from "@/components/ParadaMaquina/StatusBadgeParada";
import { HistoricoAcoesTimeline } from "@/components/ParadaMaquina/HistoricoAcoesTimeline";
import { useParadaMaquina } from "@/hooks/useParadaMaquina";
import { ParadaMaquina, podeIniciarExecucao } from "@/types/typesParadaMaquina";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TempoInicioIndicator } from "@/components/ParadaMaquina/TempoInicioIndicator";

// Helper para formatar horário (pode ser string ou Timestamp)
function formatHorario(horario: any): string {
  if (!horario) return "-";
  if (typeof horario === "string") return horario;
  if (horario.toDate) {
    return format(horario.toDate(), "HH:mm", { locale: ptBR });
  }
  return "-";
}

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
    finalizarExecucao
  } = useParadaMaquina();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [solucaoAplicada, setSolucaoAplicada] = useState("");
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

  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    if (!origens) return [];
    const tipos = [];
    if (origens.automatizacao) tipos.push("Automatização");
    if (origens.terceiros) tipos.push("Terceiros");
    if (origens.eletrica) tipos.push("Elétrica");
    if (origens.mecanica) tipos.push("Mecânica");
    if (origens.outro) tipos.push("Outro");
    return tipos;
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
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paradas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredParadas.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma parada para executar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParadas.map((parada) => (
            <Card 
              key={parada.id} 
              className={`overflow-hidden cursor-pointer transition-all ${
                parada.status === "nao_concluido" ? "border-red-500/50 bg-red-500/5" : ""
              }`}
              onClick={() => openDetail(parada)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{parada.equipamento}</div>
                    <div className="text-sm text-muted-foreground">{parada.setor}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadgeParada status={parada.status} />
                    <CountdownTimer horarioInicio={(parada as any).horarioInicio} />
                  </div>
                </div>

                {parada.status === "nao_concluido" && parada.observacaoVerificacao && (
                  <div className="p-2 bg-red-500/10 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {parada.observacaoVerificacao}
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {parada.descricaoMotivo}
                </div>

                {/* Horários de Início e Fim */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-muted-foreground">Início:</span>
                    <span className="font-medium">
                      {formatHorario((parada as any).horarioInicio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-muted-foreground">Fim:</span>
                    <span className="font-medium">
                      {formatHorario((parada as any).horarioFinal)}
                    </span>
                  </div>
                </div>

                {/* Horário programado */}
                {parada.horarioProgramado && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Programado:</span>
                    <span className="font-medium">{formatHorarioProgramado(parada)}</span>
                    {parada.atrasado && (
                      <Badge variant="destructive" className="text-xs">Atrasado</Badge>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{parada.tipoManutencao || "Não informado"}</span>
                    <TempoInicioIndicator hrInicial={parada.hrInicial} hrFinal={parada.hrFinal} status={parada.status} />
                  </div>
                  <span>Tentativa {parada.tentativaAtual || 1}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes da Parada</DialogTitle>
          </DialogHeader>
          
          {selectedParada && (
            <Tabs defaultValue="info" className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="overflow-y-auto max-h-[60vh] mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                    <p>{selectedParada.setor}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                    <p>{selectedParada.equipamento}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                    <p>{selectedParada.tipoManutencao || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Status</h4>
                    <StatusBadgeParada status={selectedParada.status} />
                  </div>
                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Horário Programado</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground text-xs">Início:</span>
                        <span className="font-medium">{formatHorario((selectedParada as any).horarioInicio)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground text-xs">Fim:</span>
                        <span className="font-medium">{formatHorario((selectedParada as any).horarioFinal)}</span>
                      </div>
                      {selectedParada.atrasado && (
                        <Badge variant="destructive" className="text-xs">Atrasado</Badge>
                      )}
                    </div>
                  </div>
                  {selectedParada.horarioExecucaoInicio && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Iniciou às</h4>
                      <p>{format(selectedParada.horarioExecucaoInicio.toDate(), "HH:mm:ss 'no dia' dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  )}
                  {/* Tempo total decorrido (após finalização) */}
                  {selectedParada.tempoTotalDecorrido && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Tempo Total de Execução</h4>
                      <p className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatTempoDecorrido(selectedParada.tempoTotalDecorrido)}</span>
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Descrição</h4>
                    <p>{selectedParada.descricaoMotivo}</p>
                  </div>
                  {selectedParada.origemParada && getOrigensParada(selectedParada.origemParada).length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Origem</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getOrigensParada(selectedParada.origemParada).map((origem, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{origem}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedParada.status === "nao_concluido" && selectedParada.observacaoVerificacao && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-red-600">Motivo da Reprovação</h4>
                      <p className="p-2 bg-red-500/10 rounded-lg text-red-700">
                        {selectedParada.observacaoVerificacao}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Tentativa</h4>
                    <p>{selectedParada.tentativaAtual || 1}ª tentativa</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="historico" className="overflow-y-auto max-h-[60vh] mt-4">
                <HistoricoAcoesTimeline historico={selectedParada.historicoAcoes || []} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4 gap-2 flex-col">
            {selectedParada?.status === "aguardando" || selectedParada?.status === "nao_concluido" ? (
              <>
                {!podeIniciarPorHorario((selectedParada as any).horarioInicio).pode && (
                  <p className="text-xs text-muted-foreground text-center">
                    {podeIniciarPorHorario((selectedParada as any).horarioInicio).mensagem}
                  </p>
                )}
                <Button 
                  className="flex-1 w-full"
                  onClick={() => handleIniciar(selectedParada)}
                  disabled={processingId === selectedParada?.id || !podeIniciarPorHorario((selectedParada as any).horarioInicio).pode}
                >
                  {processingId === selectedParada?.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {selectedParada?.status === "nao_concluido" ? "Reiniciar Execução" : "Iniciar Execução"}
                </Button>
              </>
            ) : selectedParada?.status === "em_andamento" ? (
              <>
                {selectedParada.horarioExecucaoInicio && (
                  <TempoDecorridoTimer horarioExecucaoInicio={selectedParada.horarioExecucaoInicio} />
                )}
                <Button 
                  className="flex-1 w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setIsFinalizando(true)}
                  disabled={processingId === selectedParada?.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Execução
                </Button>
              </>
            ) : selectedParada?.status === "aguardando_verificacao" || 
                 selectedParada?.status?.match(/^aguardando_verificacao_\d+$/) ? (
              <>
                {selectedParada.horarioExecucaoInicio && (
                  <TempoDecorridoTimer horarioExecucaoInicio={selectedParada.horarioExecucaoInicio} paused={true} />
                )}
                <Button 
                  className="flex-1 w-full"
                  disabled={true}
                  variant="secondary"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Aguardando Verificação {selectedParada.tentativaAtual && selectedParada.tentativaAtual > 1 ? `(Tentativa ${selectedParada.tentativaAtual})` : ""}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
