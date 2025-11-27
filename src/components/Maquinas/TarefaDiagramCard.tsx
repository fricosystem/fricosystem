import { Wrench, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { TarefaManutencaoMaquina } from "@/types/typesManutencaoPreventiva";
import { Badge } from "@/components/ui/badge";

interface TarefaDiagramCardProps {
  tarefa: TarefaManutencaoMaquina;
  x: number;
  y: number;
  onClick?: () => void;
}

export const TarefaDiagramCard = ({ tarefa, x, y, onClick }: TarefaDiagramCardProps) => {
  const getStatusColor = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataExecucao = new Date(tarefa.proximaExecucao);

    switch (tarefa.status) {
      case "concluida":
        return { bg: "fill-green-50", border: "stroke-green-500", icon: CheckCircle, iconColor: "text-green-600" };
      case "em_andamento":
        return { bg: "fill-blue-50", border: "stroke-blue-500", icon: Clock, iconColor: "text-blue-600" };
      case "cancelado":
        return { bg: "fill-gray-50", border: "stroke-gray-400", icon: XCircle, iconColor: "text-gray-500" };
      case "pendente":
        if (dataExecucao < hoje) {
          return { bg: "fill-red-50", border: "stroke-red-500", icon: AlertCircle, iconColor: "text-red-600" };
        }
        return { bg: "fill-yellow-50", border: "stroke-yellow-500", icon: Clock, iconColor: "text-yellow-600" };
      default:
        return { bg: "fill-gray-50", border: "stroke-gray-400", icon: Wrench, iconColor: "text-gray-500" };
    }
  };

  const statusInfo = getStatusColor();
  const Icon = statusInfo.icon;

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} className="cursor-pointer hover:opacity-80 transition-opacity">
      {/* Card principal */}
      <rect
        x="0"
        y="0"
        width="180"
        height="80"
        rx="8"
        strokeWidth="2"
        className={`${statusInfo.bg} ${statusInfo.border}`}
      />

      {/* Ícone do tipo */}
      <foreignObject x="8" y="8" width="24" height="24">
        <Icon className={`w-5 h-5 ${statusInfo.iconColor}`} />
      </foreignObject>

      {/* Período badge */}
      <foreignObject x="130" y="8" width="45" height="20">
        <div className="bg-background/80 text-xs px-1.5 py-0.5 rounded text-center font-medium">
          {tarefa.periodoLabel.substring(0, 3)}
        </div>
      </foreignObject>

      {/* Descrição */}
      <foreignObject x="8" y="35" width="164" height="35">
        <div className="text-xs font-medium text-foreground leading-tight line-clamp-2">
          {tarefa.descricaoTarefa}
        </div>
      </foreignObject>

      {/* Data */}
      <foreignObject x="8" y="60" width="164" height="16">
        <div className="text-xs text-muted-foreground">
          {new Date(tarefa.proximaExecucao).toLocaleDateString('pt-BR')}
        </div>
      </foreignObject>
    </g>
  );
};
