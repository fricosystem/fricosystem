import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  Play, 
  StopCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  PlusCircle
} from "lucide-react";
import { HistoricoAcao, TipoAcaoHistorico } from "@/types/typesParadaMaquina";

interface HistoricoAcoesTimelineProps {
  historico: HistoricoAcao[];
}

export const HistoricoAcoesTimeline = ({ historico }: HistoricoAcoesTimelineProps) => {
  const getAcaoIcon = (acao: TipoAcaoHistorico) => {
    switch (acao) {
      case "criado":
        return <PlusCircle className="h-5 w-5 text-blue-500" />;
      case "iniciado":
        return <Play className="h-5 w-5 text-green-500" />;
      case "finalizado":
        return <StopCircle className="h-5 w-5 text-orange-500" />;
      case "verificado_ok":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "verificado_nok":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "cancelado":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "reaberto":
        return <RefreshCw className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAcaoLabel = (acao: TipoAcaoHistorico) => {
    const labels: Record<TipoAcaoHistorico, string> = {
      criado: "Parada criada",
      iniciado: "Execução iniciada",
      finalizado: "Execução finalizada",
      verificado_ok: "Verificado e aprovado",
      verificado_nok: "Verificado e não aprovado",
      cancelado: "Parada cancelada",
      reaberto: "Parada reaberta"
    };
    return labels[acao] || acao;
  };

  const getAcaoBgColor = (acao: TipoAcaoHistorico) => {
    switch (acao) {
      case "criado":
        return "bg-blue-500/10";
      case "iniciado":
        return "bg-green-500/10";
      case "finalizado":
        return "bg-orange-500/10";
      case "verificado_ok":
        return "bg-emerald-500/10";
      case "verificado_nok":
        return "bg-red-500/10";
      case "cancelado":
        return "bg-gray-500/10";
      case "reaberto":
        return "bg-purple-500/10";
      default:
        return "bg-muted";
    }
  };

  if (!historico || historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum histórico disponível
      </div>
    );
  }

  // Ordenar por timestamp (mais antigo primeiro)
  const historicoOrdenado = [...historico].sort((a, b) => {
    const timeA = a.timestamp?.toMillis?.() || 0;
    const timeB = b.timestamp?.toMillis?.() || 0;
    return timeA - timeB;
  });

  return (
    <div className="space-y-4">
      {historicoOrdenado.map((item, index) => (
        <div key={item.id || index} className="flex gap-4">
          {/* Linha vertical */}
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full ${getAcaoBgColor(item.acao)}`}>
              {getAcaoIcon(item.acao)}
            </div>
            {index < historicoOrdenado.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-2" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{getAcaoLabel(item.acao)}</span>
              {item.tentativa && item.tentativa > 1 && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {item.tentativa}ª tentativa
                </span>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-1">
              {item.userName} • {item.timestamp && format(
                item.timestamp.toDate(),
                "dd/MM/yyyy 'às' HH:mm",
                { locale: ptBR }
              )}
            </div>

            {item.observacao && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                {item.observacao}
              </div>
            )}

            {item.statusAnterior && item.statusNovo && (
              <div className="mt-2 text-xs text-muted-foreground">
                Status: {item.statusAnterior} → {item.statusNovo}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
