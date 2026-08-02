import { useState, useCallback } from 'react';
import { githubService } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';

export interface BatchUploadStats {
  totalFiles: number;
  processedFiles: number;
  successFiles: number;
  failedFiles: number;
  totalSize: number;
  progress: number;
  currentFile?: string;
  strategy?: string;
}

export interface BatchUploadResult {
  success: boolean;
  results: Array<{ path: string; success: boolean; error?: string }>;
  stats: BatchUploadStats;
}

export interface BatchUploadHookReturn {
  isUploading: boolean;
  stats: BatchUploadStats | null;
  uploadMultipleFiles: (files: Array<{ path: string; content: string }>, message?: string) => Promise<BatchUploadResult>;
  cancelUpload: () => void;
}

const initialStats: BatchUploadStats = {
  totalFiles: 0,
  processedFiles: 0,
  successFiles: 0,
  failedFiles: 0,
  totalSize: 0,
  progress: 0
};

export const useBatchUpload = (): BatchUploadHookReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState<BatchUploadStats | null>(null);
  const [cancelController, setCancelController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const updateStats = useCallback((updates: Partial<BatchUploadStats>) => {
    setStats(prev => prev ? { ...prev, ...updates } : { ...initialStats, ...updates });
  }, []);

  const uploadMultipleFiles = useCallback(async (
    files: Array<{ path: string; content: string }>,
    message: string = 'Upload em lote via IDE'
  ): Promise<BatchUploadResult> => {
    if (isUploading) {
      throw new Error('Upload já está em andamento');
    }

    // Cria controller para cancelamento
    const controller = new AbortController();
    setCancelController(controller);
    setIsUploading(true);

    // Calcula estatísticas iniciais
    const totalSize = files.reduce((sum, file) => sum + new Blob([file.content]).size, 0);
    
    setStats({
      ...initialStats,
      totalFiles: files.length,
      totalSize
    });

    try {
      // Verifica configuração do GitHub
      await githubService.ensureInitialized();
      if (!githubService.isConfigured()) {
        throw new Error('GitHub não está configurado');
      }

      // Verifica permissões
      const permissionCheck = await githubService.validatePermissions();
      if (!permissionCheck.valid) {
        throw new Error(`Token não tem permissões: ${permissionCheck.missing.join(', ')}`);
      }

      // Callback para atualizar progresso
      const progressCallback = (progress: number, currentMessage: string, additionalStats?: any) => {
        if (controller.signal.aborted) {
          throw new Error('Upload cancelado pelo usuário');
        }

        updateStats({
          progress,
          currentFile: currentMessage,
          strategy: additionalStats?.strategy,
          ...additionalStats
        });
      };

      // Executa upload em lote
      const result = await githubService.uploadMultipleFiles(files, message, progressCallback);

      // Atualiza estatísticas finais
      const successCount = result.results.filter(r => r.success).length;
      const failedCount = result.results.length - successCount;

      updateStats({
        processedFiles: result.results.length,
        successFiles: successCount,
        failedFiles: failedCount,
        progress: 100,
        currentFile: 'Upload concluído'
      });

      // Exibe toast de resultado
      if (result.success) {
        toast({
          title: "✅ Upload em lote concluído",
          description: `${successCount} arquivos enviados com sucesso`,
        });
      } else {
        toast({
          title: "⚠️ Upload concluído com erros",
          description: `${successCount} sucessos, ${failedCount} falhas`,
          variant: "destructive"
        });
      }

      return {
        ...result,
        stats: stats!
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      updateStats({
        currentFile: `Erro: ${errorMessage}`,
        progress: 0
      });

      toast({
        title: "❌ Erro no upload em lote",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        results: files.map(file => ({ path: file.path, success: false, error: errorMessage })),
        stats: stats!
      };

    } finally {
      setIsUploading(false);
      setCancelController(null);
    }
  }, [isUploading, stats, updateStats, toast]);

  const cancelUpload = useCallback(() => {
    if (cancelController) {
      cancelController.abort();
      setIsUploading(false);
      setCancelController(null);
      
      toast({
        title: "🚫 Upload cancelado",
        description: "O processo de upload foi interrompido",
      });
    }
  }, [cancelController, toast]);

  return {
    isUploading,
    stats,
    uploadMultipleFiles,
    cancelUpload
  };
};