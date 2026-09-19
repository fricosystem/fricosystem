import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, Wrench, User, Calendar, MapPin, AlertTriangle, Package, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ParadaMaquina } from "@/types/typesParadaMaquina";
import { Timestamp } from "firebase/firestore";

interface RelatorioParadaDetalhadoProps {
  parada: ParadaMaquina;
  responsavelNome?: string;
  onMarcarCorrigido?: (paradaId: string) => Promise<void>;
  onMarcarNaoCorrigido?: (paradaId: string) => Promise<void>;
  showVerificacaoButtons?: boolean;
}

const RelatorioParadaDetalhado: React.FC<RelatorioParadaDetalhadoProps> = ({
  parada,
  responsavelNome,
  onMarcarCorrigido,
  onMarcarNaoCorrigido,
  showVerificacaoButtons = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'corrigido' | 'nao_corrigido' | null>(null);

  // Verifica se o status é aguardando verificação (incluindo variações)
  const isAguardandoVerificacao = parada.status?.startsWith('aguardando_verificacao');

  const handleCorrigido = async () => {
    if (!onMarcarCorrigido) return;
    setIsProcessing(true);
    setProcessingAction('corrigido');
    try {
      await onMarcarCorrigido(parada.id);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleNaoCorrigido = async () => {
    if (!onMarcarNaoCorrigido) return;
    setIsProcessing(true);
    setProcessingAction('nao_corrigido');
    try {
      await onMarcarNaoCorrigido(parada.id);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };
  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    if (!origens) return [];
    
    // Formato string (legado/novo)
    if (typeof origens === "string") {
      return origens ? [origens] : [];
    }
    
    // Formato objeto com booleans
    const tipos: string[] = [];
    if (origens.automatizacao) tipos.push("Automatização");
    if (origens.terceiros) tipos.push("Terceiros");
    if (origens.eletrica) tipos.push("Elétrica");
    if (origens.mecanica) tipos.push("Mecânica");
    if (origens.outro) tipos.push("Outro");
    return tipos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const attemptMatch = status?.match(/_(\d+)$/);
    const tentativa = attemptMatch ? Number(attemptMatch[1]) + 1 : 1;
    const baseStatus = status?.replace(/_\d+$/, "");

    switch (baseStatus) {
      case "aguardando":
        return { label: "Aguardando", className: "bg-amber-500/20 text-amber-700 border-amber-500/30" };
      case "pendente":
        return { label: "Pendente", className: "bg-amber-500/20 text-amber-700 border-amber-500/30" };
      case "em_andamento":
        return { label: "Em Andamento", className: "bg-blue-500/20 text-blue-700 border-blue-500/30" };
      case "concluido":
        return {
          label: `Concluído na ${tentativa}ª tentativa`,
          className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
        };
      case "aguardando_verificacao":
        return {
          label: `Aguardando Verificação na ${tentativa}ª tentativa`,
          className: "bg-purple-500/20 text-purple-700 border-purple-500/30",
        };
      case "nao_concluido":
        return { label: "Não Concluído", className: "bg-red-500/20 text-red-700 border-red-500/30" };
      default:
        return { label: status, className: "" };
    }
  };

  // Formatar horário do Timestamp
  const formatarHorario = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "--:--";
    try {
      return format(timestamp.toDate(), "HH:mm");
    } catch {
      return "--:--";
    }
  };

  // Formatar data do Timestamp
  const formatarData = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "-";
    try {
      return format(timestamp.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  // Período da parada - usa horarioInicio e horarioFinal (Timestamps) ou hrInicial/hrFinal (strings)
  const getPeriodoParada = (): string => {
    // Primeiro tenta usar os campos Timestamp
    const horarioInicioField = (parada as any).horarioInicio;
    const horarioFinalField = (parada as any).horarioFinal;
    
    if (horarioInicioField && horarioFinalField) {
      return `${formatarHorario(horarioInicioField)} até ${formatarHorario(horarioFinalField)}`;
    }
    
    // Fallback para campos string
    return `${parada.hrInicial || "--:--"} até ${parada.hrFinal || "--:--"}`;
  };

  // Nome do responsável (quem criou a parada)
  const getNomeResponsavel = (): string => {
    // Prioridade: encarregadoNome > responsavelNome (prop) > responsavelManutencao
    if (parada.encarregadoNome) return parada.encarregadoNome;
    if (responsavelNome) return responsavelNome;
    if (parada.responsavelManutencao) return parada.responsavelManutencao;
    return "Não informado";
  };

  // Tipo de falha
  const getTipoFalha = (): string => {
    const tipoFalha = (parada as any).tipoFalha;
    return tipoFalha || "-";
  };

  const statusConfig = getStatusConfig(parada.status);
  const origensParada = getOrigensParada(parada.origemParada);

  return (
    <div className="space-y-5 pb-4">
      {/* Header com Status */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Badge className={`text-sm px-4 py-1.5 font-semibold ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
        </div>
        <h2 className="text-xl font-bold leading-tight">{parada.equipamento}</h2>
        <p className="text-base text-muted-foreground">{parada.setor}</p>
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
            value={formatarData(parada.criadoEm)}
          />
          <InfoRow 
            icon={<Clock className="h-5 w-5" />}
            label="Período Programado"
            value={getPeriodoParada()}
          />
          <InfoRow 
            icon={<Wrench className="h-5 w-5" />}
            label="Tipo de Manutenção"
            value={parada.tipoManutencao || "Não informado"}
          />
          <InfoRow 
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Tipo de Falha"
            value={getTipoFalha()}
          />
          <InfoRow 
            icon={<User className="h-5 w-5" />}
            label="Responsável (Criador)"
            value={getNomeResponsavel()}
          />
        </div>
      </div>

      <Separator />

      {/* Origens da Parada */}
      {origensParada.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Origem da Parada
            </h3>
            <div className="flex flex-wrap gap-2">
              {origensParada.map((origem, index) => (
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
            {parada.descricaoMotivo || "Nenhuma descrição fornecida"}
          </p>
        </div>
      </div>

      {/* Solução Aplicada */}
      {parada.solucaoAplicada && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Solução Aplicada
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-base leading-relaxed">
                {parada.solucaoAplicada}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Observações */}
      {parada.observacao && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Observações</h3>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-base leading-relaxed italic">
                {parada.observacao}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Produtos Utilizados */}
      {parada.produtosUtilizados && parada.produtosUtilizados.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Utilizados
            </h3>
            <div className="bg-muted/30 rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {parada.produtosUtilizados.map((produto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-base">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {produto.quantidade}x {formatCurrency(produto.valorUnitario)}
                      </p>
                    </div>
                    <span className="text-base font-semibold">
                      {formatCurrency(produto.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/10 p-4 flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(parada.valorTotalProdutos || 0)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Rodapé de Auditoria */}
      <Separator />
      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Informações de Auditoria
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">ID do Registro:</span>
            <p className="font-mono text-xs mt-0.5 break-all">{parada.id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Criado por:</span>
            <p className="mt-0.5">{getNomeResponsavel()}</p>
          </div>
        </div>
      </div>

      {/* Botões de Verificação - apenas para status aguardando_verificacao */}
      {showVerificacaoButtons && isAguardandoVerificacao && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
              Verificação do Reparo
            </h3>
            {parada.tentativaAtual && (
              <div>
                <span className="text-muted-foreground">Tentativa:</span>
                <p className="mt-0.5">{parada.tentativaAtual}ª tentativa</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              O manutentor indicou que o reparo foi concluído. Verifique se o problema foi resolvido.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCorrigido}
                disabled={isProcessing}
                className="flex-1 h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {processingAction === 'corrigido' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                Corrigido
              </Button>
              <Button
                onClick={handleNaoCorrigido}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1 h-14 text-base font-semibold"
              >
                {processingAction === 'nao_corrigido' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                Não Corrigido
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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

export default RelatorioParadaDetalhado;
