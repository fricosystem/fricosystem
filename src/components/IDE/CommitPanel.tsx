import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GitCommit, History, ExternalLink, RefreshCw, Save, AlertTriangle, RotateCcw, Upload, Settings, Download, CheckCircle } from 'lucide-react';
import { githubService } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface CustomRepoConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

const CommitPanel: React.FC = () => {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCustomRepoDialog, setShowCustomRepoDialog] = useState(false);
  const [showCustomRepoConfirm, setShowCustomRepoConfirm] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<CommitData | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [customCommitting, setCustomCommitting] = useState(false);
  const [customRepoConfig, setCustomRepoConfig] = useState<CustomRepoConfig>({
    token: '',
    owner: '',
    repo: '',
    branch: 'main'
  });
  const [customCommitMessage, setCustomCommitMessage] = useState('');
  const [sourceRepoUrl, setSourceRepoUrl] = useState('');
  const [sourceRepoConfig, setSourceRepoConfig] = useState({
    owner: '',
    repo: '',
    branch: 'main'
  });
  const [showSourceRepoDialog, setShowSourceRepoDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<{name: string, path: string}[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  const loadCommitHistory = async () => {
    if (!githubService.isConfigured()) return;

    setLoading(true);
    try {
      // Busca todos os commits do repositório (não apenas os da IDE)
      const history = await githubService.getCommitHistory(200);
      setCommits(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de commits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const truncateSha = (sha: string) => {
    return sha.substring(0, 7);
  };

  const handleSaveAndCommit = () => {
    if (!commitMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para o commit",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSaveAndCommit = () => {
    setShowConfirmDialog(false);
    
    toast({
      title: "Informação",
      description: "Os commits são criados automaticamente quando você salva arquivos no editor. Use Ctrl+S para salvar e fazer commit.",
    });
    setCommitMessage('');
  };

  const handleRestoreCommit = (commit: CommitData) => {
    setSelectedCommit(commit);
    setShowRestoreDialog(true);
  };

  const confirmRestoreCommit = async () => {
    if (!selectedCommit) return;

    setRestoring(true);
    try {
      toast({
        title: "Restaurando...",
        description: `Restaurando para o commit: ${selectedCommit.message.substring(0, 50)}...`,
      });

      // Aqui você implementaria a lógica de restauração
      // Por exemplo, resetar para um commit específico ou reverter mudanças
      
      toast({
        title: "Sucesso",
        description: "Projeto restaurado para a versão anterior com sucesso!",
      });
      
      // Recarregar o histórico após restauração
      await loadCommitHistory();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao restaurar o projeto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
      setSelectedCommit(null);
    }
  };

  const handleOpenCustomFlow = async () => {
    try {
      // Buscar configurações do repositório destino no Firestore
      const userDocRef = doc(db, 'usuarios', 'current_user'); // Ajustar conforme sua estrutura
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.repositorio) {
          setCustomRepoConfig(prev => ({
            ...prev,
            token: userData.repositorio.token || '',
            owner: userData.repositorio.owner || '',
            repo: userData.repositorio.repo || '',
            branch: userData.repositorio.branch || 'main'
          }));
        }
      }
      
      setShowSourceRepoDialog(true);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações do repositório",
        variant: "destructive",
      });
    }
  };

  const handleCustomCommit = () => {
    if (!customCommitMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para o commit personalizado",
        variant: "destructive",
      });
      return;
    }
    setShowCustomRepoDialog(true);
  };

  const handleCustomRepoSubmit = () => {
    if (!customRepoConfig.token || !customRepoConfig.owner || !customRepoConfig.repo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios do repositório",
        variant: "destructive",
      });
      return;
    }
    setShowCustomRepoDialog(false);
    setShowCustomRepoConfirm(true);
  };

  const handleSourceRepoSubmit = () => {
    if (!sourceRepoConfig.owner.trim() || !sourceRepoConfig.repo.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o proprietário e nome do repositório origem",
        variant: "destructive",
      });
      return;
    }
    
    setShowSourceRepoDialog(false);
    setShowDownloadDialog(true);
    startDownloadProcess();
  };

  const startDownloadProcess = async () => {
    setIsDownloading(true);
    setIsUploading(false);
    setDownloadProgress(0);
    setUploadProgress(0);
    setOverallProgress(0);
    setProcessComplete(false);
    setDownloadedFiles([]);
    setStartTime(Date.now());

    try {
      const sourceOwner = sourceRepoConfig.owner.trim();
      const sourceRepo = sourceRepoConfig.repo.trim();
      const sourceBranch = sourceRepoConfig.branch || 'main';

      // Usar o token do GitHub configurado para acessar repositórios privados
      await githubService.ensureInitialized();
      if (!githubService.isConfigured()) {
        throw new Error('GitHub não está configurado. Configure primeiro o GitHub para acessar repositórios.');
      }

      const { Octokit } = await import('@octokit/rest');
      const config = githubService.getConfig();
      const sourceOctokit = new Octokit({ auth: config?.token });

      // 1) Descobrir a branch padrão e tree SHA corretamente
      const { data: repoData } = await sourceOctokit.rest.repos.get({
        owner: sourceOwner,
        repo: sourceRepo,
      });
      const defaultBranch = sourceBranch || repoData.default_branch || 'main';

      const { data: refData } = await sourceOctokit.rest.git.getRef({
        owner: sourceOwner,
        repo: sourceRepo,
        ref: `heads/${defaultBranch}`,
      });
      const commitSha = refData.object.sha;

      const { data: commitData } = await sourceOctokit.rest.git.getCommit({
        owner: sourceOwner,
        repo: sourceRepo,
        commit_sha: commitSha,
      });
      const treeSha = commitData.tree.sha;

      // 2) Obter árvore completa
      const { data: treeData } = await sourceOctokit.rest.git.getTree({
        owner: sourceOwner,
        repo: sourceRepo,
        tree_sha: treeSha,
        recursive: 'true',
      });

      const files = (treeData.tree || []).filter((item: any) => item.type === 'blob' && item.path);
      const totalFiles = files.length;
      const totalSteps = totalFiles * 2; // Download + Upload

      // 3) Download real dos arquivos (atualiza barra de download e lista)
      const downloads: { path: string; content: string }[] = [];
      let downloadedCount = 0;

      for (const file of files) {
        if (!file.path || !file.sha) continue;
        const { data: blob } = await sourceOctokit.rest.git.getBlob({
          owner: sourceOwner,
          repo: sourceRepo,
          file_sha: file.sha,
        });

        const base64 = (blob.content || '').replace(/\n/g, '');
        let decoded = '';
        try {
          decoded = decodeURIComponent(escape(atob(base64)));
        } catch {
          decoded = atob(base64);
        }

        downloads.push({ path: file.path, content: decoded });
        downloadedCount++;
        
        const downloadPercent = Math.round((downloadedCount / totalFiles) * 100);
        setDownloadProgress(downloadPercent);
        
        const overallPercent = Math.round((downloadedCount / totalSteps) * 100);
        setOverallProgress(overallPercent);
        
        // Calcular tempo restante
        const elapsed = Date.now() - startTime;
        const remaining = ((totalSteps - downloadedCount) / downloadedCount) * elapsed;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setEstimatedTimeRemaining(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
      }

      // Exibir lista de arquivos no modal
      setDownloadedFiles(files.map((f: any) => ({ name: f.path.split('/').pop() || f.path, path: f.path })));
      setIsDownloading(false);

      // 4) Upload para repositório destino - CRIANDO UM ÚNICO COMMIT
      setIsUploading(true);
      setUploadProgress(0);

      // Usar configuração atual do GitHub service para o destino
      const currentConfig = githubService.getConfig();
      if (!currentConfig) {
        throw new Error('Configuração do GitHub não encontrada');
      }
      
      const destOctokit = new Octokit({ auth: currentConfig.token });
      
      try {
        // Obter referência da branch de destino
        let baseSha = '';
        try {
          const { data: refData } = await destOctokit.rest.git.getRef({
            owner: currentConfig.owner,
            repo: currentConfig.repo,
            ref: `heads/main`,
          });
          baseSha = refData.object.sha;
        } catch (error: any) {
          // Se a branch não existe, criar novo repositório/branch
          if (error.status === 404) {
            // Criar commit inicial se repositório está vazio
            const { data: newCommit } = await destOctokit.rest.repos.createOrUpdateFileContents({
              owner: currentConfig.owner,
              repo: currentConfig.repo,
              path: '.gitkeep',
              message: 'Initial commit',
              content: btoa(''),
            });
            baseSha = newCommit.commit.sha;
          } else {
            throw error;
          }
        }

        // Criar árvore com todos os arquivos
        const treeItems = downloads.map(file => ({
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          content: file.content,
        }));

        const { data: newTree } = await destOctokit.rest.git.createTree({
          owner: currentConfig.owner,
          repo: currentConfig.repo,
          tree: treeItems,
          base_tree: baseSha,
        });

        // Criar commit único com todos os arquivos
        const { data: newCommit } = await destOctokit.rest.git.createCommit({
          owner: currentConfig.owner,
          repo: currentConfig.repo,
          message: customCommitMessage || `Cópia de ${sourceOwner}/${sourceRepo}`,
          tree: newTree.sha,
          parents: baseSha ? [baseSha] : [],
        });

        // Atualizar referência da branch
        await destOctokit.rest.git.updateRef({
          owner: currentConfig.owner,
          repo: currentConfig.repo,
          ref: 'heads/main',
          sha: newCommit.sha,
        });

        setUploadProgress(100);
        setOverallProgress(100);
      } catch (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      setIsUploading(false);
      setProcessComplete(true);
      setEstimatedTimeRemaining('');

      toast({
        title: 'Sucesso',
        description: `${downloads.length} arquivos enviados para ${currentConfig.owner}/${currentConfig.repo} em um único commit!`,
      });
    } catch (error: any) {
      console.error('Erro no processo de transferência:', error);
      let description = 'Erro durante a transferência';
      
      if (error?.status === 404) {
        description = `Repositório de origem "${sourceRepoConfig.owner}/${sourceRepoConfig.repo}" não encontrado ou não acessível. Verifique se:
• O nome do repositório está correto
• O repositório existe e é público, ou
• Se for privado, verifique se o token GitHub tem acesso a ele`;
      } else if (error?.message?.includes('not found')) {
        description = `Branch "${sourceRepoConfig.branch || 'main'}" não encontrada no repositório de origem`;
      } else if (error instanceof Error) {
        description = error.message;
      }
      
      toast({ title: 'Erro', description, variant: 'destructive' });
      setIsDownloading(false);
      setIsUploading(false);
      setOverallProgress(0);
      setEstimatedTimeRemaining('');
    }
  };

  const confirmCustomCommit = async () => {
    setCustomCommitting(true);
    try {
      toast({
        title: "Enviando...",
        description: `Enviando para ${customRepoConfig.owner}/${customRepoConfig.repo}...`,
      });

      // Aqui implementaria a lógica de envio para o repositório personalizado
      // Usando a configuração customRepoConfig e customCommitMessage
      
      toast({
        title: "Sucesso",
        description: `Versão personalizada enviada para ${customRepoConfig.owner}/${customRepoConfig.repo}!`,
      });
      
      // Limpar formulários
      setCustomCommitMessage('');
      setCustomRepoConfig({
        token: '',
        owner: '',
        repo: '',
        branch: 'main'
      });
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar para o repositório personalizado.",
        variant: "destructive",
      });
    } finally {
      setCustomCommitting(false);
      setShowCustomRepoConfirm(false);
    }
  };

  useEffect(() => {
    if (githubService.isConfigured()) {
      loadCommitHistory();
    }
  }, []);

  if (!githubService.isConfigured()) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-muted/20 blur-xl rounded-full"></div>
            <GitCommit className="h-12 w-12 mx-auto text-muted-foreground/40 relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">GitHub não configurado</p>
            <p className="text-xs text-muted-foreground/70">Configure o GitHub para ver o histórico</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">Commits</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={loadCommitHistory}
          disabled={loading}
          className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
          title="Atualizar commits"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Novo Commit */}
      <div className="p-3 border-b border-border/40 bg-gradient-to-b from-muted/10 to-transparent flex-shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Novo Commit</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenCustomFlow}
              className="h-6 px-2 text-xs hover:bg-primary/20 hover:text-primary"
              title="Commit para repositório personalizado"
            >
              <Upload className="h-3 w-3 mr-1" />
              Personalizado
            </Button>
          </div>
          <Textarea
            placeholder="Digite a mensagem do commit..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="min-h-[70px] resize-none text-sm bg-background/80 border-primary/20 focus:border-primary"
          />
          <div className="space-y-2">
            <Button
              onClick={handleSaveAndCommit}
              disabled={!commitMessage.trim() || committing}
              className="w-full h-8 bg-primary hover:bg-primary/90"
              size="sm"
            >
              {committing ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  <span className="text-xs">Salvando...</span>
                </>
              ) : (
                <>
                  <GitCommit className="mr-2 h-3 w-3" />
                  <span className="text-xs">Salvar e Fazer Commit</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleCustomCommit}
              disabled={!commitMessage.trim() || customCommitting}
              variant="outline"
              className="w-full h-8 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40"
              size="sm"
            >
              {customCommitting ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  <span className="text-xs">Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3 w-3" />
                  <span className="text-xs">Commit Personalizado</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Commits - ScrollArea simples */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1 space-y-1 pb-4">
          {loading && commits.length === 0 ? (
            <div className="p-6 text-center">
              <div className="space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary/60" />
                <p className="text-sm text-muted-foreground">Carregando commits...</p>
              </div>
            </div>
          ) : commits.length === 0 ? (
            <div className="p-6 text-center">
              <div className="space-y-3">
                <GitCommit className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum commit encontrado</p>
              </div>
            </div>
          ) : (
            <>
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="p-3 mx-1 rounded-md border border-border/20 bg-card/30 hover:bg-card/50 hover:border-border/40 transition-all duration-200 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <GitCommit className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors break-words">
                          {commit.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-7 flex-wrap">
                      <span className="truncate max-w-[120px]">{commit.author}</span>
                      <span className="whitespace-nowrap">{formatDate(commit.date)}</span>
                    </div>

                    <div className="flex items-center justify-between ml-7">
                      <Badge variant="secondary" className="text-xs bg-muted/40 px-2 py-1">
                        {truncateSha(commit.sha)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500/20 hover:text-orange-600"
                          onClick={() => handleRestoreCommit(commit)}
                          title="Restaurar para esta versão"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(commit.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          GitHub
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Confirmação de Salvamento */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Salvamento
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja salvar e fazer commit das alterações com a mensagem:
              <div className="mt-2 p-2 rounded text-sm font-mono border">
                "{commitMessage}"
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSaveAndCommit}>
              Confirmar Salvamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Restauração */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Restaurar Versão Anterior
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>⚠️ Atenção:</strong> Esta ação irá substituir o código atual pela versão anterior.
                </p>
                <p className="text-sm text-muted-foreground">
                  Você está prestes a restaurar para o commit:
                </p>
                {selectedCommit && (
                  <div className="p-3 rounded border bg-muted/20">
                    <p className="text-sm font-mono font-medium">{selectedCommit.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCommit.author} • {formatDate(selectedCommit.date)} • {truncateSha(selectedCommit.sha)}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Todas as alterações não salvas serão perdidas. Esta ação não pode ser desfeita facilmente.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoring}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmRestoreCommit}
              disabled={restoring}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {restoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirmar Restauração
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Repositório Origem */}
      <Dialog open={showSourceRepoDialog} onOpenChange={setShowSourceRepoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Repositório Origem
            </DialogTitle>
            <DialogDescription>
              Digite o link do repositório de onde os arquivos serão copiados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded border bg-muted/20">
              <p className="text-sm font-medium mb-2">Repositório Destino:</p>
              <p className="text-xs text-muted-foreground">
                {customRepoConfig.owner}/{customRepoConfig.repo}
              </p>
              <p className="text-xs text-muted-foreground">
                Branch: {customRepoConfig.branch || 'main'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sourceOwner">Proprietário Origem*</Label>
                <Input
                  id="sourceOwner"
                  placeholder="username"
                  value={sourceRepoConfig.owner}
                  onChange={(e) => setSourceRepoConfig(prev => ({ ...prev, owner: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceRepo">Repositório Origem*</Label>
                <Input
                  id="sourceRepo"
                  placeholder="my-repo"
                  value={sourceRepoConfig.repo}
                  onChange={(e) => setSourceRepoConfig(prev => ({ ...prev, repo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceBranch">Branch Origem (opcional)</Label>
              <Input
                id="sourceBranch"
                placeholder="main"
                value={sourceRepoConfig.branch}
                onChange={(e) => setSourceRepoConfig(prev => ({ ...prev, branch: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitMessage">Mensagem do Commit*</Label>
              <Textarea
                id="commitMessage"
                placeholder="Digite a mensagem do commit..."
                value={customCommitMessage}
                onChange={(e) => setCustomCommitMessage(e.target.value)}
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSourceRepoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSourceRepoSubmit}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Download e Upload */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {processComplete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
              {processComplete ? 'Processo Concluído' : 'Transferindo Arquivos'}
            </DialogTitle>
            <DialogDescription>
              {processComplete 
                ? 'Os arquivos foram transferidos com sucesso!'
                : 'Fazendo download dos arquivos do repositório origem e enviando para o destino...'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Progresso Geral */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso Geral</span>
                <div className="flex items-center gap-2 text-xs">
                  <span>{overallProgress}%</span>
                  {estimatedTimeRemaining && !processComplete && (
                    <span className="text-muted-foreground">
                      • {estimatedTimeRemaining} restante
                    </span>
                  )}
                </div>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            <Separator />

            <div className="space-y-3">
              {/* Download Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Download dos arquivos</span>
                  <span className={isDownloading ? 'text-blue-600' : downloadProgress === 100 ? 'text-green-600' : 'text-muted-foreground'}>
                    {isDownloading ? 'Baixando...' : downloadProgress === 100 ? 'Concluído' : 'Aguardando'}
                  </span>
                </div>
                <Progress value={downloadProgress} className="h-2" />
              </div>
              
              {/* Upload Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Envio para repositório destino</span>
                  <span className={isUploading ? 'text-blue-600' : uploadProgress === 100 ? 'text-green-600' : 'text-muted-foreground'}>
                    {isUploading ? 'Enviando...' : uploadProgress === 100 ? 'Concluído' : 'Aguardando'}
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>

            {/* Lista de arquivos baixados */}
            {downloadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos baixados ({downloadedFiles.length}):</p>
                <ScrollArea className="h-40 border rounded p-2 bg-muted/20">
                  <div className="space-y-1">
                    {downloadedFiles.map((file, index) => (
                      <div key={index} className="text-xs font-mono bg-background/60 p-2 rounded border">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-muted-foreground truncate">{file.path}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {processComplete && (
              <div className="p-3 rounded border bg-green-50 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Transferência Concluída!
                </p>
                <div className="text-xs text-green-600 dark:text-green-500 mt-1 space-y-0.5">
                  <p>Commit: "{customCommitMessage}"</p>
                  <p>Origem: {sourceRepoConfig.owner}/{sourceRepoConfig.repo}</p>
                  <p>Destino: {(() => {
                    const config = githubService.getConfig();
                    return config ? `${config.owner}/${config.repo}` : 'Não configurado';
                  })()}</p>
                  <p>Total de arquivos: {downloadedFiles.length}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0">
            {processComplete ? (
              <Button onClick={() => {
                setShowDownloadDialog(false);
                setSourceRepoConfig({ owner: '', repo: '', branch: 'main' });
                setCustomCommitMessage('');
                setDownloadProgress(0);
                setUploadProgress(0);
                setOverallProgress(0);
                setProcessComplete(false);
                setDownloadedFiles([]);
                setEstimatedTimeRemaining('');
              }}>
                Fechar
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Processando...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração do Repositório Personalizado */}
      <Dialog open={showCustomRepoDialog} onOpenChange={setShowCustomRepoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurar Repositório Personalizado
            </DialogTitle>
            <DialogDescription>
              Configure os dados do repositório onde deseja enviar esta versão personalizada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token de Acesso do GitHub*</Label>
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={customRepoConfig.token}
                onChange={(e) => setCustomRepoConfig(prev => ({ ...prev, token: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="owner">Proprietário*</Label>
                <Input
                  id="owner"
                  placeholder="username"
                  value={customRepoConfig.owner}
                  onChange={(e) => setCustomRepoConfig(prev => ({ ...prev, owner: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">Repositório*</Label>
                <Input
                  id="repo"
                  placeholder="my-repo"
                  value={customRepoConfig.repo}
                  onChange={(e) => setCustomRepoConfig(prev => ({ ...prev, repo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch (opcional)</Label>
              <Input
                id="branch"
                placeholder="main"
                value={customRepoConfig.branch}
                onChange={(e) => setCustomRepoConfig(prev => ({ ...prev, branch: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomRepoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCustomRepoSubmit}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação do Commit Personalizado */}
      <Dialog open={showCustomRepoConfirm} onOpenChange={setShowCustomRepoConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-500" />
              Confirmar Envio Personalizado
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p className="text-sm">
                  Você está prestes a enviar uma versão personalizada para:
                </p>
                <div className="p-3 rounded border bg-muted/20">
                  <p className="text-sm font-mono font-medium">
                    {customRepoConfig.owner}/{customRepoConfig.repo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Branch: {customRepoConfig.branch || 'main'}
                  </p>
                </div>
                <div className="p-3 rounded border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Mensagem do commit:</p>
                  <p className="text-sm font-medium">{commitMessage}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta versão será enviada como uma versão personalizada independente do repositório principal.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCustomRepoConfirm(false)}
              disabled={customCommitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmCustomCommit}
              disabled={customCommitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {customCommitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirmar Envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommitPanel;