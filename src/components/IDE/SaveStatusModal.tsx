import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Upload, 
  Cloud, 
  Rocket,
  ExternalLink,
  RotateCcw,
  X
} from 'lucide-react';

export interface SaveStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number;
  message?: string;
  url?: string;
}

export interface SaveStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: SaveStep[];
  fileName?: string;
  onRetry?: () => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

const SaveStatusModal: React.FC<SaveStatusModalProps> = ({
  isOpen,
  onClose,
  steps,
  fileName,
  onRetry,
  canCancel,
  onCancel
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const getStepIcon = (step: SaveStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepBadgeVariant = (status: SaveStep['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      case 'in-progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isAllCompleted = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error');
  const isInProgress = steps.some(step => step.status === 'in-progress');

  const overallProgress = Math.round(
    (steps.filter(step => step.status === 'completed').length / steps.length) * 100
  );


  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideSaveStatusModal', 'true');
    }
    onClose();
  };

  const deploymentUrl = steps.find(step => step.url)?.url;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {isAllCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : hasError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            )}
            
            {isAllCompleted ? 'Deploy Concluído!' : 
             hasError ? 'Erro no Deploy' : 
             'Salvando e Fazendo Deploy'}
          </DialogTitle>
          
          <DialogDescription>
            {fileName && `Processando: ${fileName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progresso Geral */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Etapas Detalhadas */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className="text-sm font-medium">{step.name}</span>
                    <Badge variant={getStepBadgeVariant(step.status)} className="text-xs">
                      {step.status === 'in-progress' ? 'Em Progresso' :
                       step.status === 'completed' ? 'Concluído' :
                       step.status === 'error' ? 'Erro' : 'Aguardando'}
                    </Badge>
                  </div>
                  
                  {step.progress !== undefined && step.status === 'in-progress' && (
                    <span className="text-xs text-muted-foreground">{step.progress}%</span>
                  )}
                </div>

                {step.status === 'in-progress' && step.progress !== undefined && (
                  <Progress value={step.progress} className="h-1" />
                )}

                {step.message && (
                  <p className={`text-xs ${
                    step.status === 'error' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {step.message}
                  </p>
                )}

                {step.url && step.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => window.open(step.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir Deploy
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="space-y-4">
            {deploymentUrl && isAllCompleted && (
              <Button
                onClick={() => window.open(deploymentUrl, '_blank')}
                className="w-full"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Ver Deploy no Vercel
              </Button>
            )}

            <div className="flex gap-2">
              {hasError && onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Tentar Novamente
                </Button>
              )}

              {canCancel && isInProgress && onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}

              <Button
                onClick={handleClose}
                variant={isAllCompleted ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                {isAllCompleted ? 'Concluído' : 'Fechar'}
              </Button>
            </div>

            {/* Opção para não mostrar novamente */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label
                htmlFor="dontShowAgain"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Não mostrar este modal novamente
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveStatusModal;