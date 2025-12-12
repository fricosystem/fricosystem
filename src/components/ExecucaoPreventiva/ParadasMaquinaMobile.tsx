import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Play, CheckCircle, Clock, AlertTriangle, Timer, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadgeParada } from "@/components/ParadaMaquina/StatusBadgeParada";
import { HistoricoAcoesTimeline } from "@/components/ParadaMaquina/HistoricoAcoesTimeline";
import { useParadaMaquina } from "@/hooks/useParadaMaquina";
import { ParadaMaquina, podeIniciarExecucao } from "@/types/typesParadaMaquina";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TempoInicioIndicator } from "@/components/ParadaMaquina/TempoInicioIndicator";
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
      setIsDetailOpen(false);
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
                  <StatusBadgeParada status={parada.status} />
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
                    <p className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      {formatHorarioProgramado(selectedParada)}
                      {selectedParada.atrasado && (
                        <Badge variant="destructive" className="text-xs">Atrasado</Badge>
                      )}
                    </p>
                  </div>
                  {selectedParada.horarioExecucaoInicio && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Início da Execução</h4>
                      <p>{format(selectedParada.horarioExecucaoInicio.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</p>
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

          <DialogFooter className="mt-4 gap-2">
            {selectedParada?.status === "aguardando" || selectedParada?.status === "nao_concluido" ? (
              <Button 
                className="flex-1"
                onClick={() => handleIniciar(selectedParada)}
                disabled={processingId === selectedParada?.id}
              >
                {processingId === selectedParada?.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {selectedParada?.status === "nao_concluido" ? "Reiniciar Execução" : "Iniciar Execução"}
              </Button>
            ) : selectedParada?.status === "em_andamento" ? (
              <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={() => setIsFinalizando(true)}
                disabled={processingId === selectedParada?.id}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Execução
              </Button>
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
