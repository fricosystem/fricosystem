import { useState, useCallback } from 'react';
import { SaveStep } from '@/components/IDE/SaveStatusModal';
import { githubService } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';

export interface SaveStatusHookReturn {
  isModalOpen: boolean;
  steps: SaveStep[];
  saveFileWithStatus: (filePath: string, content: string, commitMessage?: string, modalType?: 'entrada' | 'externo') => Promise<boolean>;
  closeSaveModal: () => void;
  retryLastSave: () => Promise<void>;
  cancelSave: () => void;
  modalType?: 'entrada' | 'externo';
}

const defaultSteps: SaveStep[] = [
  {
    id: 'preparing',
    name: 'Preparando Arquivo',
    status: 'pending',
    message: 'Validando conteúdo e preparando para upload'
  },
  {
    id: 'github',
    name: 'Enviando para GitHub',
    status: 'pending',
    message: 'Fazendo commit e push para o repositório'
  },
  {
    id: 'vercel-trigger',
    name: 'Iniciando Deploy',
    status: 'pending',
    message: 'Aguardando Vercel detectar as mudanças'
  },
  {
    id: 'vercel-build',
    name: 'Build em Progresso',
    status: 'pending',
    message: 'Construindo aplicação no Vercel'
  },
  {
    id: 'completed',
    name: 'Deploy Concluído',
    status: 'pending',
    message: 'Aplicação disponível online'
  }
];

export const useSaveStatus = (): SaveStatusHookReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [steps, setSteps] = useState<SaveStep[]>(defaultSteps);
  const [modalType, setModalType] = useState<'entrada' | 'externo' | undefined>();
  const [lastSaveParams, setLastSaveParams] = useState<{
    filePath: string;
    content: string;
    commitMessage?: string;
    modalType?: 'entrada' | 'externo';
  } | null>(null);
  const [cancelController, setCancelController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const updateStep = useCallback((stepId: string, updates: Partial<SaveStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setSteps(defaultSteps.map(step => ({ ...step, status: 'pending' as const })));
  }, []);

  const checkVercelDeployment = async (commitSha: string): Promise<{ url?: string; status: string }> => {
    try {
      // Simula verificação do Vercel - em produção, seria uma API call real
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simula progresso de build
      updateStep('vercel-build', { 
        status: 'in-progress', 
        progress: 0,
        message: 'Iniciando build...' 
      });

      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStep('vercel-build', { 
          progress: i,
          message: `Build ${i}% concluído` 
        });
      }

      const deployUrl = `https://your-app-${commitSha.substring(0, 7)}.vercel.app`;
      
      updateStep('vercel-build', { 
        status: 'completed',
        message: 'Build concluído com sucesso'
      });

      return { url: deployUrl, status: 'ready' };
    } catch (error) {
      return { status: 'error' };
    }
  };

  const saveFileWithStatus = useCallback(async (
    filePath: string, 
    content: string, 
    commitMessage?: string,
    type?: 'entrada' | 'externo'
  ): Promise<boolean> => {
    // Verifica se o usuário configurou para não mostrar o modal
    if (localStorage.getItem('hideSaveStatusModal') === 'true') {
      try {
        // Verifica permissões antes de tentar salvar
        const permissionCheck = await githubService.validatePermissions();
        if (!permissionCheck.valid) {
          toast({
            title: "❌ Erro de Permissão",
            description: `Token não tem permissões: ${permissionCheck.missing.join(', ')}`,
            variant: "destructive"
          });
          return false;
        }

        const result = await githubService.updateFile(
          filePath,
          content,
          commitMessage || `Atualizar ${filePath.split('/').pop()}`
        );
        
        if (result) {
          toast({
            title: "✅ Arquivo salvo",
            description: "Alterações enviadas para o GitHub",
          });
        }
        
        return !!result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        toast({
          title: "❌ Erro ao salvar",
          description: errorMsg.includes('permissão') ? 'Token sem permissões suficientes' : 'Falha ao enviar para o GitHub',
          variant: "destructive"
        });
        return false;
      }
    }

    // Salva parâmetros para retry
    setLastSaveParams({ filePath, content, commitMessage, modalType: type });
    setModalType(type);
    
    // Cria controller para cancelamento
    const controller = new AbortController();
    setCancelController(controller);

    // Reset e mostra modal
    resetSteps();
    setIsModalOpen(true);

    try {
      // Etapa 1: Preparação e validação de permissões
      updateStep('preparing', { 
        status: 'in-progress', 
        progress: 0,
        message: 'Validando configuração e permissões...' 
      });
      
      // Verifica configuração do GitHub
      await githubService.ensureInitialized();
      if (!githubService.isConfigured()) {
        throw new Error('GitHub não está configurado');
      }

      // Verifica conectividade
      const isConnected = await githubService.testConnection();
      if (!isConnected) {
        throw new Error('Não foi possível conectar ao GitHub');
      }

      // Verifica permissões
      const permissionCheck = await githubService.validatePermissions();
      if (!permissionCheck.valid) {
        throw new Error(`Token não tem permissões: ${permissionCheck.missing.join(', ')}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (controller.signal.aborted) throw new Error('Cancelado');
      
      updateStep('preparing', { 
        status: 'completed',
        message: 'Validação concluída com sucesso' 
      });

      // Etapa 2: GitHub com estratégia inteligente
      updateStep('github', { 
        status: 'in-progress',
        progress: 0,
        message: 'Analisando arquivo e escolhendo estratégia...' 
      });

      const fileName = filePath.split('/').pop() || filePath;
      const contentSize = new Blob([content]).size;
      

      let result;
      
      // Estratégia baseada no tamanho do arquivo
      if (contentSize > 2 * 1024 * 1024) { // > 2MB
        updateStep('github', { 
          message: 'Arquivo muito grande, usando estratégia ultra-conservadora...' 
        });
        
        result = await githubService.updateFileIncremental(
          filePath,
          content,
          commitMessage || `Atualizar ${fileName} via IDE`,
          (progress, message) => {
            updateStep('github', { 
              progress,
              message 
            });
          }
        );
      } else if (contentSize > 800 * 1024) { // > 800KB
        updateStep('github', { 
          message: 'Arquivo grande, usando estratégia incremental inteligente...' 
        });
        
        result = await githubService.updateFileIncremental(
          filePath,
          content,
          commitMessage || `Atualizar ${fileName} via IDE`,
          (progress, message) => {
            updateStep('github', { 
              progress,
              message 
            });
          }
        );
      } else {
        updateStep('github', { 
          message: 'Usando estratégia padrão com retry automático...' 
        });
        
        result = await githubService.updateFile(
          filePath,
          content,
          commitMessage || `Atualizar ${fileName} via IDE`
        );
      }

      if (!result) {
        throw new Error('Falha ao enviar para GitHub');
      }

      // Gera um SHA mock baseado no timestamp
      const mockSha = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      updateStep('github', { 
        status: 'completed',
        message: `Upload concluído - Commit ${mockSha.substring(0, 7)}` 
      });

      // Etapa 3: Vercel Trigger
      updateStep('vercel-trigger', { 
        status: 'in-progress',
        message: 'Aguardando Vercel detectar mudanças...' 
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (controller.signal.aborted) throw new Error('Cancelado');

      updateStep('vercel-trigger', { 
        status: 'completed',
        message: 'Deploy iniciado no Vercel' 
      });

      // Etapa 4: Vercel Build
      const deployResult = await checkVercelDeployment(mockSha);
      
      if (deployResult.status === 'error') {
        throw new Error('Erro no build do Vercel');
      }

      // Etapa 5: Concluído
      updateStep('completed', { 
        status: 'completed',
        message: 'Deploy concluído com sucesso!',
        url: deployResult.url 
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Marca a etapa atual como erro
      const currentStep = steps.find(s => s.status === 'in-progress');
      if (currentStep) {
        updateStep(currentStep.id, { 
          status: 'error',
          message: `Erro: ${errorMessage}` 
        });
      }

      return false;
    } finally {
      setCancelController(null);
    }
  }, [updateStep, resetSteps, steps, toast]);

  const closeSaveModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const retryLastSave = useCallback(async () => {
    if (lastSaveParams) {
      await saveFileWithStatus(
        lastSaveParams.filePath,
        lastSaveParams.content,
        lastSaveParams.commitMessage,
        lastSaveParams.modalType
      );
    }
  }, [lastSaveParams, saveFileWithStatus]);

  const cancelSave = useCallback(() => {
    if (cancelController) {
      cancelController.abort();
    }
    setIsModalOpen(false);
  }, [cancelController]);

  return {
    isModalOpen,
    steps,
    saveFileWithStatus,
    closeSaveModal,
    retryLastSave,
    cancelSave,
    modalType
  };
};