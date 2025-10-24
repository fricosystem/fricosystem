import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreVertical,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Timer,
} from 'lucide-react';
import { Etapa } from '@/hooks/usePlanejamentoDesenvolvimento';
import { cn } from '@/lib/utils';

interface EtapaItemProps {
  etapa: Etapa;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Etapa['status']) => void;
}

const statusConfig = {
  pendente: { 
    label: 'Pendente', 
    icon: Circle, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  },
  em_andamento: { 
    label: 'Em Andamento', 
    icon: Clock, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  concluido: { 
    label: 'Concluído', 
    icon: CheckCircle2, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  bloqueado: { 
    label: 'Bloqueado', 
    icon: AlertCircle, 
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-500' },
  media: { label: 'Média', color: 'bg-blue-500' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

export const EtapaItem: React.FC<EtapaItemProps> = ({
  etapa,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const StatusIcon = statusConfig[etapa.status].icon;
  
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-300",
        "hover:shadow-md hover:border-primary/50",
        statusConfig[etapa.status].bgColor,
        etapa.status === 'concluido' && "opacity-75"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={cn(
          "flex-shrink-0 mt-1 transition-transform group-hover:scale-110",
          statusConfig[etapa.status].color
        )}>
          <StatusIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h5 className={cn(
              "font-medium text-sm sm:text-base",
              etapa.status === 'concluido' && "line-through text-muted-foreground"
            )}>
              {etapa.titulo}
            </h5>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover-scale"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {etapa.descricao && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
              {etapa.descricao}
            </p>
          )}

          {/* Badges e Info */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge 
              variant="secondary"
              className={cn("text-xs", prioridadeConfig[etapa.prioridade].color, "text-white")}
            >
              {prioridadeConfig[etapa.prioridade].label}
            </Badge>
            
            {etapa.tags && etapa.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Metadados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
            {etapa.responsavel && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{etapa.responsavel}</span>
              </div>
            )}
            
            {(etapa.dataInicio || etapa.dataFim) && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(etapa.dataInicio)} - {formatDate(etapa.dataFim)}</span>
              </div>
            )}
            
            {(etapa.tempoEstimado || etapa.tempoGasto) && (
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>
                  {etapa.tempoGasto || 0}h / {etapa.tempoEstimado || 0}h
                </span>
              </div>
            )}
          </div>

          {/* Status Change Buttons */}
          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {etapa.status !== 'concluido' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('concluido')}
                className="text-xs h-7 hover-scale"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluir
              </Button>
            )}
            {etapa.status === 'pendente' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('em_andamento')}
                className="text-xs h-7 hover-scale"
              >
                <Clock className="h-3 w-3 mr-1" />
                Iniciar
              </Button>
            )}
            {etapa.status !== 'bloqueado' && etapa.status !== 'concluido' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('bloqueado')}
                className="text-xs h-7 hover-scale"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Bloquear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
