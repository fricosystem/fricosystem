import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadgeParada } from "@/components/ParadaMaquina/StatusBadgeParada";
import { HistoricoAcoesTimeline } from "@/components/ParadaMaquina/HistoricoAcoesTimeline";
import { useParadaMaquina } from "@/hooks/useParadaMaquina";
import { ParadaMaquina } from "@/types/typesParadaMaquina";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const VerificacaoParadas = () => {
  const { 
    paradasParaEncarregado, 
    loading, 
    verificarConcluido, 
    verificarNaoConcluido 
  } = useParadaMaquina();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReprovando, setIsReprovando] = useState(false);
  const [observacaoReprovacao, setObservacaoReprovacao] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredParadas = paradasParaEncarregado.filter((parada) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.manutentorNome?.toLowerCase().includes(searchValue)
    );
  });

  const handleAprovar = async () => {
    if (!selectedParada) return;
    
    setProcessingId(selectedParada.id);
    const success = await verificarConcluido(selectedParada.id);
    setProcessingId(null);
    
    if (success) {
      setIsDetailOpen(false);
    }
  };

  const handleReprovar = async () => {
    if (!selectedParada) return;
    
    if (!observacaoReprovacao.trim()) {
      return;
    }

    setProcessingId(selectedParada.id);
    const success = await verificarNaoConcluido(selectedParada.id, observacaoReprovacao);
    setProcessingId(null);
    
    if (success) {
      setIsReprovando(false);
      setObservacaoReprovacao("");
      setIsDetailOpen(false);
    }
  };

  const openDetail = (parada: ParadaMaquina) => {
    setSelectedParada(parada);
    setIsDetailOpen(true);
  };

  const calcularTempoExecucao = (parada: ParadaMaquina) => {
    if (!parada.horarioExecucaoInicio || !parada.horarioExecucaoFim) return null;
    
    const inicio = parada.horarioExecucaoInicio.toDate();
    const fim = parada.horarioExecucaoFim.toDate();
    const diffMs = fim.getTime() - inicio.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    
    return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-none flex flex-col h-full">
        <CardHeader className="px-0 py-3 sticky top-0 bg-background z-10">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar para verificar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full text-base h-14 rounded-xl"
            />
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-32 flex-1 overflow-y-auto">
          {filteredParadas.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma parada para verificar</p>
              <p className="text-muted-foreground text-sm mt-1">
                Paradas finalizadas pelos manutentores aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParadas.map(parada => {
                const tempoExecucao = calcularTempoExecucao(parada);
                return (
                  <button
                    key={parada.id}
                    onClick={() => openDetail(parada)}
                    className="w-full text-left bg-card border rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform border-orange-500/50"
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
                      <StatusBadgeParada status={parada.status} />
                    </div>

                    {parada.manutentorNome && (
                      <div className="text-sm text-muted-foreground">
                        Executado por: <span className="font-medium">{parada.manutentorNome}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {tempoExecucao && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>Duração: {tempoExecucao}</span>
                        </div>
                      )}
                      {parada.atrasado && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Atrasado
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-muted-foreground">
                        {parada.tentativaAtual > 1 && `${parada.tentativaAtual}ª tentativa`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {parada.horarioExecucaoFim && format(parada.horarioExecucaoFim.toDate(), "dd/MM HH:mm")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes para Verificação */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Verificar Manutenção</DialogTitle>
          </DialogHeader>
          
          {selectedParada && (
            <Tabs defaultValue="info" className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="overflow-y-auto max-h-[50vh] mt-4">
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
                    <h4 className="font-semibold text-xs text-muted-foreground">Manutentor</h4>
                    <p>{selectedParada.manutentorNome || "Não informado"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Tentativa</h4>
                    <p>{selectedParada.tentativaAtual || 1}ª tentativa</p>
                  </div>
                  
                  {selectedParada.horarioProgramado && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Horário Programado</h4>
                      <p className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        {format(selectedParada.horarioProgramado.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}

                  {selectedParada.horarioExecucaoInicio && (
                    <div>
                      <h4 className="font-semibold text-xs text-muted-foreground">Início Execução</h4>
                      <p>{format(selectedParada.horarioExecucaoInicio.toDate(), "dd/MM/yy HH:mm")}</p>
                    </div>
                  )}
                  {selectedParada.horarioExecucaoFim && (
                    <div>
                      <h4 className="font-semibold text-xs text-muted-foreground">Fim Execução</h4>
                      <p>{format(selectedParada.horarioExecucaoFim.toDate(), "dd/MM/yy HH:mm")}</p>
                    </div>
                  )}

                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Descrição do Problema</h4>
                    <p className="p-2 bg-muted/50 rounded-lg">{selectedParada.descricaoMotivo}</p>
                  </div>

                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Solução Aplicada</h4>
                    <p className="p-2 bg-green-500/10 rounded-lg text-green-700">
                      {selectedParada.solucaoAplicada || "Não informada"}
                    </p>
                  </div>

                  {selectedParada.atrasado && (
                    <div className="col-span-2">
                      <Badge variant="destructive" className="text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Execução iniciada com atraso
                      </Badge>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="historico" className="overflow-y-auto max-h-[50vh] mt-4">
                <HistoricoAcoesTimeline historico={selectedParada.historicoAcoes || []} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={() => setIsReprovando(true)}
              disabled={processingId !== null}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Não Concluído
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAprovar}
              disabled={processingId !== null}
            >
              {processingId === selectedParada?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reprovação */}
      <Dialog open={isReprovando} onOpenChange={setIsReprovando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informar Motivo da Reprovação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo pelo qual a manutenção não foi concluída corretamente. 
              Essa informação será exibida para o manutentor.
            </p>
            <Textarea
              placeholder="Descreva o problema encontrado..."
              value={observacaoReprovacao}
              onChange={(e) => setObservacaoReprovacao(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReprovando(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReprovar}
              disabled={processingId !== null || !observacaoReprovacao.trim()}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificacaoParadas;
