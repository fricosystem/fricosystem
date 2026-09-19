import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Upload, Clock, HardDrive, Zap } from 'lucide-react';
import { BatchUploadStats } from '@/hooks/useBatchUpload';

interface BatchUploadModalProps {
  isOpen: boolean;
  stats: BatchUploadStats | null;
  onCancel: () => void;
  onClose: () => void;
  isUploading: boolean;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  stats,
  onCancel,
  onClose,
  isUploading
}) => {
  if (!stats) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStrategyInfo = (strategy?: string) => {
    switch (strategy) {
      case 'sequencial':
        return { label: 'Sequencial', color: 'bg-blue-500', icon: Clock, description: 'Um arquivo por vez (mais seguro)' };
      case 'pequenos-lotes':
        return { label: 'Pequenos Lotes', color: 'bg-yellow-500', icon: Upload, description: '2-3 arquivos por vez' };
      case 'otimizado':
        return { label: 'Otimizado', color: 'bg-green-500', icon: Zap, description: 'Paralelo com limite' };
      default:
        return { label: 'Padrão', color: 'bg-gray-500', icon: HardDrive, description: 'Estratégia automática' };
    }
  };

  const strategyInfo = getStrategyInfo(stats.strategy);
  const StrategyIcon = strategyInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload em Lote para GitHub
          </DialogTitle>
          <DialogDescription>
            Enviando múltiplos arquivos para o repositório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progresso Principal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Arquivos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {stats.processedFiles}/{stats.totalFiles}
                </div>
                <CardDescription className="text-xs">
                  Processados
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tamanho</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">
                  {formatFileSize(stats.totalSize)}
                </div>
                <CardDescription className="text-xs">
                  Total
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          {(stats.successFiles > 0 || stats.failedFiles > 0) && (
            <div className="flex gap-4 justify-center">
              {stats.successFiles > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{stats.successFiles} sucessos</span>
                </div>
              )}
              {stats.failedFiles > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{stats.failedFiles} falhas</span>
                </div>
              )}
            </div>
          )}

          {/* Estratégia */}
          {stats.strategy && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${strategyInfo.color} text-white`}>
                  <StrategyIcon className="h-3 w-3 mr-1" />
                  {strategyInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {strategyInfo.description}
                </span>
              </div>
            </div>
          )}

          {/* Arquivo Atual */}
          {stats.currentFile && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Status:</div>
              <div className="text-sm text-muted-foreground break-all">
                {stats.currentFile}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            {isUploading ? (
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar Upload
              </Button>
            ) : (
              <Button 
                onClick={onClose}
                className="flex-1"
              >
                {stats.progress === 100 ? 'Fechar' : 'OK'}
              </Button>
            )}
          </div>

          {/* Dicas */}
          {isUploading && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <strong>Dica:</strong> O sistema escolhe automaticamente a melhor estratégia baseada no tamanho e quantidade de arquivos.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};