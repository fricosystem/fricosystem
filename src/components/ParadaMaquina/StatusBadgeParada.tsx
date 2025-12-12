import { Badge } from "@/components/ui/badge";
import { StatusParada, getStatusLabel } from "@/types/typesParadaMaquina";

interface StatusBadgeParadaProps {
  status: StatusParada | string;
  className?: string;
}

export const StatusBadgeParada = ({ status, className = "" }: StatusBadgeParadaProps) => {
  const getStatusStyles = (status: StatusParada | string) => {
    switch (status) {
      case "aguardando":
        return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case "em_andamento":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "aguardando_verificacao":
      case "aguardando_verificacao_1":
      case "aguardando_verificacao_2":
        return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "concluido":
      case "concluido_1":
      case "concluido_2":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "nao_concluido":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "cancelado":
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
      // Status legado
      case "pendente":
        return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  // Mapear status legado para novo
  const getLabel = (status: StatusParada | string) => {
    if (status === "pendente") return "Aguardando";
    return getStatusLabel(status as StatusParada);
  };

  return (
    <Badge 
      className={`${getStatusStyles(status)} text-sm px-3 py-1.5 ${className}`}
    >
      {getLabel(status)}
    </Badge>
  );
};
