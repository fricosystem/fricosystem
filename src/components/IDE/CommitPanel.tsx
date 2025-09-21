import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GitCommit, History, ExternalLink, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { githubService } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

const CommitPanel: React.FC = () => {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const loadCommitHistory = async () => {
    if (!githubService.isConfigured()) return;

    setLoading(true);
    try {
      // Busca todos os commits do repositório (não apenas os da IDE)
      const history = await githubService.getCommitHistory(50);
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

  useEffect(() => {
    if (githubService.isConfigured()) {
      loadCommitHistory();
    }
  }, []);

  if (!githubService.isConfigured()) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Commits
          </CardTitle>
          <CardDescription>
            Configure o GitHub para ver o histórico
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Commits</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadCommitHistory}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Histórico completo do repositório
        </p>
      </div>
      
      {/* Novo Commit */}
      <div className="p-4 border-b border-border/60">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Save className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Novo Commit</span>
          </div>
          <Textarea
            placeholder="Digite a mensagem do commit..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="min-h-[70px] resize-none text-sm"
          />
          <Button
            onClick={handleSaveAndCommit}
            disabled={!commitMessage.trim() || committing}
            className="w-full h-8"
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
        </div>
      </div>

      {/* Lista de Commits */}
      <ScrollArea className="flex-1" scrollHideDelay={0}>
        <div className="p-4">
          {loading && commits.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-8">
              <GitCommit className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Nenhum commit encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="group rounded-lg border border-border/60 p-3 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-medium leading-relaxed line-clamp-2">
                        {commit.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                          {truncateSha(commit.sha)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {commit.author}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(commit.date)}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(commit.url, '_blank')}
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Confirmação */}
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
    </div>
  );
};

export default CommitPanel;