import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { githubService } from '@/services/githubService';
import { getCommitEntradaConfig } from '@/firebase/firestore';
import { Trash2, Download, Folder, Loader2, GitBranch, CheckCircle2, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Octokit } from '@octokit/rest';
interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
}


interface DeleteProgress {
  repoName: string;
  status: 'pending' | 'deleting' | 'completed' | 'error';
  error?: string;
}

const RepositoryManager: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const octokit = githubService.getOctokit();
      if (!octokit) {
        toast({
          title: "Erro",
          description: "GitHub não está configurado",
          variant: "destructive",
        });
        return;
      }

      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      setRepositories(data as Repository[]);
    } catch (error) {
      console.error('Erro ao carregar repositórios:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar repositórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repoId: number, checked: boolean) => {
    const newSelected = new Set(selectedRepos);
    if (checked) {
      newSelected.add(repoId);
    } else {
      newSelected.delete(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRepos(new Set(repositories.map(r => r.id)));
    } else {
      setSelectedRepos(new Set());
    }
  };

  const handleDeleteSingle = (repo: Repository) => {
    setRepoToDelete(repo);
    setShowDeleteModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRepos.size === 0) return;
    setRepoToDelete(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      const octokit = githubService.getOctokit();
      if (!octokit) throw new Error("GitHub não configurado");

      const reposToDelete = repoToDelete 
        ? [repoToDelete] 
        : repositories.filter(r => selectedRepos.has(r.id));

      // Se for exclusão em massa, mostrar modal de progresso
      if (reposToDelete.length > 1) {
        setShowDeleteModal(false);
        setShowProgressModal(true);
        
        const progress: DeleteProgress[] = reposToDelete.map(repo => ({
          repoName: repo.name,
          status: 'pending'
        }));
        setDeleteProgress(progress);

        for (let i = 0; i < reposToDelete.length; i++) {
          const repo = reposToDelete[i];
          
          // Atualizar status para "deleting"
          setDeleteProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'deleting' } : p
          ));

          try {
            const [owner, repoName] = repo.full_name.split('/');
            await octokit.rest.repos.delete({ 
              owner, 
              repo: repoName 
            });
            
            // Atualizar status para "completed"
            setDeleteProgress(prev => prev.map((p, idx) => 
              idx === i ? { ...p, status: 'completed' } : p
            ));
          } catch (error: any) {
            // Atualizar status para "error"
            setDeleteProgress(prev => prev.map((p, idx) => 
              idx === i ? { ...p, status: 'error', error: error.message } : p
            ));
          }
        }

        const completed = progress.filter(p => p.status === 'completed').length;
        toast({
          title: "Exclusão Concluída",
          description: `${completed} de ${reposToDelete.length} repositório(s) excluído(s)`,
        });

        setTimeout(() => {
          setShowProgressModal(false);
          setDeleteProgress([]);
        }, 2000);
      } else {
        // Exclusão única sem modal de progresso
        const repo = reposToDelete[0];
        const [owner, repoName] = repo.full_name.split('/');
        await octokit.rest.repos.delete({ 
          owner, 
          repo: repoName 
        });
        
        toast({
          title: "Sucesso",
          description: "Repositório excluído",
        });
        
        setShowDeleteModal(false);
      }

      setSelectedRepos(new Set());
      await loadRepositories();
      setRepoToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir repositório",
        variant: "destructive",
      });
      setShowDeleteModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommitEntrada = async (repo: Repository) => {
    try {
      setActionLoading(true);
      
      // Buscar configuração de commit entrada do Firestore
      const commitEntradaConfig = await getCommitEntradaConfig();
      if (!commitEntradaConfig) {
        toast({
          title: "Configuração não encontrada",
          description: "Configure o repositório de destino para Commit Entrada no Firestore (coleção: github_commit_entrada)",
          variant: "destructive",
        });
        return;
      }

      // Criar Octokit com token da configuração de origem (repo atual)
      const sourceOctokit = githubService.getOctokit();
      if (!sourceOctokit) throw new Error("GitHub não configurado");

      // Criar Octokit para destino (fricosystem)
      const destOctokit = new Octokit({ auth: commitEntradaConfig.token });
      
      const [sourceOwner, sourceRepoName] = repo.full_name.split('/');
      const destOwner = commitEntradaConfig.owner;
      const destRepoName = commitEntradaConfig.repo;
      const destBranch = commitEntradaConfig.branch || 'main';
      const sourceBranch = repo.default_branch;

      toast({
        title: "Iniciando Commit Entrada",
        description: `Buscando arquivos modificados de ${repo.name}...`,
      });

      // Buscar todos os arquivos do repositório de origem
      const getFilesRecursively = async (path: string = ''): Promise<Array<{path: string, sha: string, content?: string}>> => {
        const { data } = await sourceOctokit.repos.getContent({
          owner: sourceOwner,
          repo: sourceRepoName,
          path,
          ref: sourceBranch,
        });

        const files: Array<{path: string, sha: string, content?: string}> = [];
        
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.type === 'file') {
              // Ignorar arquivos desnecessários
              if (item.name.startsWith('.') || 
                  item.path.includes('node_modules') || 
                  item.path.includes('.git/')) {
                continue;
              }
              files.push({ path: item.path, sha: item.sha });
            } else if (item.type === 'dir') {
              // Ignorar diretórios desnecessários
              if (item.name === 'node_modules' || item.name === '.git') continue;
              const subFiles = await getFilesRecursively(item.path);
              files.push(...subFiles);
            }
          }
        }
        
        return files;
      };

      // Buscar arquivos de origem
      const sourceFiles = await getFilesRecursively();
      
      // Buscar arquivos de destino para comparação
      let destFiles: Map<string, string> = new Map();
      try {
        const getDestFilesRecursively = async (path: string = ''): Promise<void> => {
          try {
            const { data } = await destOctokit.repos.getContent({
              owner: destOwner,
              repo: destRepoName,
              path,
              ref: destBranch,
            });

            if (Array.isArray(data)) {
              for (const item of data) {
                if (item.type === 'file') {
                  destFiles.set(item.path, item.sha);
                } else if (item.type === 'dir') {
                  if (item.name === 'node_modules' || item.name === '.git') continue;
                  await getDestFilesRecursively(item.path);
                }
              }
            }
          } catch (e) {
            // Diretório não existe no destino
          }
        };
        await getDestFilesRecursively();
      } catch (e) {
        // Repositório destino pode estar vazio
      }

      // Identificar arquivos modificados/novos
      const modifiedFiles: Array<{path: string, sha: string}> = [];
      for (const sourceFile of sourceFiles) {
        const destSha = destFiles.get(sourceFile.path);
        if (!destSha || destSha !== sourceFile.sha) {
          modifiedFiles.push(sourceFile);
        }
      }

      if (modifiedFiles.length === 0) {
        toast({
          title: "Nenhuma alteração",
          description: "Não há arquivos modificados para enviar",
        });
        setActionLoading(false);
        return;
      }

      toast({
        title: "Processando",
        description: `Enviando ${modifiedFiles.length} arquivo(s) modificado(s)...`,
      });

      // Buscar referência do branch de destino
      let destRefSha: string;
      try {
        const { data: refData } = await destOctokit.git.getRef({
          owner: destOwner,
          repo: destRepoName,
          ref: `heads/${destBranch}`,
        });
        destRefSha = refData.object.sha;
      } catch (e) {
        toast({
          title: "Erro",
          description: `Branch ${destBranch} não encontrado no repositório de destino`,
          variant: "destructive",
        });
        return;
      }

      // Buscar árvore base
      const { data: baseCommit } = await destOctokit.git.getCommit({
        owner: destOwner,
        repo: destRepoName,
        commit_sha: destRefSha,
      });

      // Criar blobs para cada arquivo modificado
      const treeItems: Array<{path: string, mode: '100644', type: 'blob', sha: string}> = [];
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const file of modifiedFiles) {
        try {
          // Buscar conteúdo do arquivo de origem
          const { data: fileData } = await sourceOctokit.repos.getContent({
            owner: sourceOwner,
            repo: sourceRepoName,
            path: file.path,
            ref: sourceBranch,
          });

          if ('content' in fileData && fileData.content) {
            // Criar blob no destino
            const { data: blob } = await destOctokit.git.createBlob({
              owner: destOwner,
              repo: destRepoName,
              content: fileData.content,
              encoding: 'base64',
            });

            treeItems.push({
              path: file.path,
              mode: '100644',
              type: 'blob',
              sha: blob.sha,
            });
            successCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`${file.path}: ${err.message}`);
          console.error(`Erro ao processar arquivo ${file.path}:`, err);
        }
      }

      if (treeItems.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum arquivo pôde ser processado",
          variant: "destructive",
        });
        return;
      }

      // Criar nova árvore
      const { data: newTree } = await destOctokit.git.createTree({
        owner: destOwner,
        repo: destRepoName,
        base_tree: baseCommit.tree.sha,
        tree: treeItems,
      });

      // Criar commit
      const commitMessage = `📥 Commit Entrada - ${new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' -')}\n\nOrigem: ${repo.full_name}\nArquivos: ${successCount} enviado(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`;

      const { data: newCommit } = await destOctokit.git.createCommit({
        owner: destOwner,
        repo: destRepoName,
        message: commitMessage,
        tree: newTree.sha,
        parents: [destRefSha],
      });

      // Atualizar referência
      await destOctokit.git.updateRef({
        owner: destOwner,
        repo: destRepoName,
        ref: `heads/${destBranch}`,
        sha: newCommit.sha,
      });

      if (errorCount > 0) {
        toast({
          title: "Commit Entrada Parcial",
          description: `${successCount} arquivo(s) enviado(s), ${errorCount} erro(s). Verifique o console para detalhes.`,
          variant: "default",
        });
        console.warn('Erros durante commit entrada:', errors);
      } else {
        toast({
          title: "✅ Commit Entrada Realizado",
          description: `${successCount} arquivo(s) enviado(s) para ${destOwner}/${destRepoName}`,
        });
      }

      await loadRepositories();
    } catch (error: any) {
      console.error('Erro ao fazer commit entrada:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao fazer commit de entrada",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const allSelected = repositories.length > 0 && selectedRepos.size === repositories.length;
  const someSelected = selectedRepos.size > 0 && selectedRepos.size < repositories.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando repositórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header com ações em massa */}
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <span className="text-xs text-muted-foreground">
            {selectedRepos.size > 0 
              ? `${selectedRepos.size} selecionado(s)`
              : 'Selecionar todos'
            }
          </span>
        </div>
        
        {selectedRepos.size > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            className="h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Excluir ({selectedRepos.size})
          </Button>
        )}
      </div>

      {/* Lista de repositórios */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {repositories.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum repositório encontrado</p>
            </div>
          ) : (
            repositories.map((repo) => (
              <div
                key={repo.id}
                className="group relative p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedRepos.has(repo.id)}
                    onCheckedChange={(checked) => handleSelectRepo(repo.id, checked as boolean)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="h-4 w-4 text-primary flex-shrink-0" />
                      <h3 className="font-medium text-sm truncate">{repo.name}</h3>
                    </div>
                    
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {repo.default_branch}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(repo.updated_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', ' -')}
                      </span>
                    </div>
                  </div>

                  {selectedRepos.size === 0 && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCommitEntrada(repo)}
                        className="h-8 w-8 p-0 hover:text-primary"
                        title="Commit Entrada - Enviar para fricosystem"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSingle(repo)}
                        className="h-8 w-8 p-0 hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {repoToDelete 
                ? `Tem certeza que deseja excluir o repositório "${repoToDelete.name}"?`
                : `Tem certeza que deseja excluir ${selectedRepos.size} repositório(s) selecionado(s)?`
              }
              <br />
              <span className="text-destructive font-medium">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de progresso de exclusão */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excluindo Repositórios</DialogTitle>
            <DialogDescription>
              Progresso da exclusão em massa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Progresso Geral */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-muted-foreground">
                  {deleteProgress.filter(p => p.status === 'completed' || p.status === 'error').length} / {deleteProgress.length}
                </span>
              </div>
              <Progress 
                value={(deleteProgress.filter(p => p.status === 'completed' || p.status === 'error').length / deleteProgress.length) * 100}
                className="h-3"
              />
              <div className="text-right text-sm font-medium">
                {Math.round((deleteProgress.filter(p => p.status === 'completed' || p.status === 'error').length / deleteProgress.length) * 100)}%
              </div>
            </div>

            {/* Lista de repositórios com progresso individual */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {deleteProgress.map((progress, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">
                        {progress.repoName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {progress.status === 'pending' && '⏳ Aguardando'}
                        {progress.status === 'deleting' && '🔄 Excluindo'}
                        {progress.status === 'completed' && '✅ Concluído'}
                        {progress.status === 'error' && '❌ Erro'}
                      </span>
                    </div>
                    
                    <Progress 
                      value={
                        progress.status === 'pending' ? 0 :
                        progress.status === 'deleting' ? 50 :
                        progress.status === 'completed' ? 100 :
                        100
                      }
                      className="h-2"
                      progressType={
                        progress.status === 'error' ? 'externo' : 'entrada'
                      }
                    />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={
                        progress.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                      }>
                        {progress.error || ''}
                      </span>
                      <span className="font-medium">
                        {progress.status === 'pending' ? '0%' :
                         progress.status === 'deleting' ? '50%' :
                         progress.status === 'completed' ? '100%' :
                         '100%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default RepositoryManager;
