import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Tarefa, Etapa } from '@/hooks/usePlanejamentoDesenvolvimento';
import { EtapaItem } from './EtapaItem';
import { cn } from '@/lib/utils';

interface TarefaCardProps {
  tarefa: Tarefa;
  onEdit: () => void;
  onDelete: () => void;
  onAddEtapa: () => void;
  onEditEtapa: (etapa: Etapa) => void;
  onDeleteEtapa: (etapaId: string) => void;
  onUpdateEtapaStatus: (etapaId: string, status: Etapa['status']) => void;
}

const categoriaConfig = {
  frontend: { label: 'Frontend', color: 'bg-blue-500' },
  backend: { label: 'Backend', color: 'bg-green-500' },
  design: { label: 'Design', color: 'bg-purple-500' },
  teste: { label: 'Teste', color: 'bg-orange-500' },
  documentacao: { label: 'Documentação', color: 'bg-yellow-500' },
  outro: { label: 'Outro', color: 'bg-gray-500' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-500' },
  media: { label: 'Média', color: 'bg-blue-500' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

const statusConfig = {
  planejamento: { label: 'Planejamento', icon: Target },
  em_andamento: { label: 'Em Andamento', icon: Play },
  revisao: { label: 'Revisão', icon: AlertCircle },
  concluido: { label: 'Concluído', icon: CheckCircle2 },
  pausado: { label: 'Pausado', icon: Pause },
};

export const TarefaCard: React.FC<TarefaCardProps> = ({
  tarefa,
  onEdit,
  onDelete,
  onAddEtapa,
  onEditEtapa,
  onDeleteEtapa,
  onUpdateEtapaStatus,
}) => {
  const [expanded, setExpanded] = useState(false);

  const StatusIcon = statusConfig[tarefa.status].icon;
  
  // Calcular métricas
  const totalEtapas = tarefa.etapas.length;
  const etapasConcluidas = tarefa.etapas.filter(e => e.status === 'concluido').length;
  const etapasEmAndamento = tarefa.etapas.filter(e => e.status === 'em_andamento').length;
  const etapasBloqueadas = tarefa.etapas.filter(e => e.status === 'bloqueado').length;
  
  const tempoTotal = tarefa.etapas.reduce((acc, e) => acc + (e.tempoEstimado || 0), 0);
  const tempoGasto = tarefa.etapas.reduce((acc, e) => acc + (e.tempoGasto || 0), 0);
  const progresso = totalEtapas > 0 ? (etapasConcluidas / totalEtapas) * 100 : 0;

  return (
    <Card 
      className={cn(
        "transition-all duration-300 hover:shadow-lg border-l-4",
        tarefa.concluido ? "border-l-green-500 opacity-75" : "border-l-primary",
        "animate-fade-in"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusIcon className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle className={cn(
                "text-lg sm:text-xl truncate",
                tarefa.concluido && "line-through text-muted-foreground"
              )}>
                {tarefa.nome}
              </CardTitle>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", categoriaConfig[tarefa.categoria].color, "text-white")}
              >
                {categoriaConfig[tarefa.categoria].label}
              </Badge>
              <Badge 
                variant="secondary"
                className={cn("text-xs", prioridadeConfig[tarefa.prioridade].color, "text-white")}
              >
                {prioridadeConfig[tarefa.prioridade].label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {statusConfig[tarefa.status].label}
              </Badge>
            </div>

            <CardDescription className="line-clamp-2">
              {tarefa.detalhes}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onEdit}
              className="hover-scale"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="hover-scale text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="hover-scale"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium">{Math.round(progresso)}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-muted/50 p-2 rounded-lg transition-all hover:bg-muted">
            <div className="text-xs text-muted-foreground">Etapas</div>
            <div className="text-lg font-bold">{totalEtapas}</div>
          </div>
          <div className="bg-green-500/10 p-2 rounded-lg transition-all hover:bg-green-500/20">
            <div className="text-xs text-green-700 dark:text-green-400">Concluídas</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {etapasConcluidas}
            </div>
          </div>
          <div className="bg-blue-500/10 p-2 rounded-lg transition-all hover:bg-blue-500/20">
            <div className="text-xs text-blue-700 dark:text-blue-400">Em Andamento</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {etapasEmAndamento}
            </div>
          </div>
          <div className="bg-orange-500/10 p-2 rounded-lg transition-all hover:bg-orange-500/20">
            <div className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Tempo
            </div>
            <div className="text-sm font-bold text-orange-700 dark:text-orange-400">
              {tempoGasto}h / {tempoTotal}h
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 animate-accordion-down">
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-4 border-t">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Etapas do Desenvolvimento
              </h4>
              <Button
                size="sm"
                onClick={onAddEtapa}
                className="hover-scale"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Etapa
              </Button>
            </div>

            {tarefa.etapas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma etapa adicionada ainda.</p>
                <p className="text-sm">Clique em "Nova Etapa" para começar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tarefa.etapas
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((etapa) => (
                    <EtapaItem
                      key={etapa.id}
                      etapa={etapa}
                      onEdit={() => onEditEtapa(etapa)}
                      onDelete={() => onDeleteEtapa(etapa.id)}
                      onStatusChange={(status) => onUpdateEtapaStatus(etapa.id, status)}
                    />
                  ))}
              </div>
            )}

            {etapasBloqueadas > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-600">
                    {etapasBloqueadas} {etapasBloqueadas === 1 ? 'etapa bloqueada' : 'etapas bloqueadas'}
                  </p>
                  <p className="text-xs text-red-600/80">
                    Revise as etapas bloqueadas para manter o progresso do projeto.
                  </p>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Criado em: {tarefa.criadoEm.toLocaleString('pt-BR')} • 
              Atualizado em: {tarefa.atualizadoEm.toLocaleString('pt-BR')}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
