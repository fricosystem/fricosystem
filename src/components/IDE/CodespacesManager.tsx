import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Cloud, 
  Play, 
  Square, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Plus,
  Monitor,
  Clock,
  Cpu,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { githubService, Codespace, CodespaceConfig } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const CodespacesManager: React.FC = () => {
  const [codespaces, setCodespaces] = useState<Codespace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCodespace, setSelectedCodespace] = useState<Codespace | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCodespaceConfig, setNewCodespaceConfig] = useState<CodespaceConfig>({
    machine: 'basicLinux32gb',
    idle_timeout_minutes: 30
  });
  const { toast } = useToast();

  const loadCodespaces = async () => {
    if (!githubService.isConfigured()) return;

    setLoading(true);
    try {
      const codespacesData = await githubService.listCodespaces();
      setCodespaces(codespacesData);
    } catch (error) {
      console.error('Erro ao carregar Codespaces:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar Codespaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCodespace = async () => {
    setCreating(true);
    try {
      const newCodespace = await githubService.createCodespace(newCodespaceConfig);
      toast({
        title: "✅ Sucesso",
        description: `Codespace ${newCodespace.display_name || newCodespace.name} criado com sucesso`,
      });
      setShowCreateModal(false);
      await loadCodespaces();
    } catch (error) {
      console.error('Erro ao criar Codespace:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao criar Codespace. Verifique suas permissões e cota.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleStartCodespace = async (codespace: Codespace) => {
    try {
      await githubService.startCodespace(codespace.name);
      toast({
        title: "✅ Iniciando",
        description: `Codespace ${codespace.display_name || codespace.name} está sendo iniciado`,
      });
      await loadCodespaces();
    } catch (error) {
      console.error('Erro ao iniciar Codespace:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao iniciar Codespace",
        variant: "destructive",
      });
    }
  };

  const handleStopCodespace = async (codespace: Codespace) => {
    try {
      await githubService.stopCodespace(codespace.name);
      toast({
        title: "✅ Parando",
        description: `Codespace ${codespace.display_name || codespace.name} está sendo parado`,
      });
      await loadCodespaces();
    } catch (error) {
      console.error('Erro ao parar Codespace:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao parar Codespace",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCodespace = async () => {
    if (!selectedCodespace) return;
    
    try {
      await githubService.deleteCodespace(selectedCodespace.name);
      toast({
        title: "✅ Sucesso",
        description: `Codespace ${selectedCodespace.display_name || selectedCodespace.name} deletado`,
      });
      setShowDeleteModal(false);
      setSelectedCodespace(null);
      await loadCodespaces();
    } catch (error) {
      console.error('Erro ao deletar Codespace:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao deletar Codespace",
        variant: "destructive",
      });
    }
  };

  const openCodespace = (codespace: Codespace) => {
    if (codespace.web_url) {
      window.open(codespace.web_url, '_blank');
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Available':
      case 'Started':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Starting':
      case 'Rebuilding':
      case 'Queued':
      case 'Provisioning':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Stopping':
      case 'Stopped':
      case 'Shutdown':
      case 'Archived':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'Unavailable':
      case 'Failed':
      case 'Deleted':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'Updating':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'Available':
      case 'Started':
        return <Play className="h-3 w-3" />;
      case 'Starting':
      case 'Rebuilding':
      case 'Queued':
      case 'Provisioning':
      case 'Updating':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'Stopping':
      case 'Stopped':
      case 'Shutdown':
      case 'Archived':
        return <Square className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
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

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(0)}GB`;
  };

  useEffect(() => {
    if (githubService.isConfigured()) {
      loadCodespaces();
    }
  }, []);

  if (!githubService.isConfigured()) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-muted/20 blur-xl rounded-full"></div>
            <Cloud className="h-12 w-12 mx-auto text-muted-foreground/40 relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">GitHub não configurado</p>
            <p className="text-xs text-muted-foreground/70">Configure o GitHub para usar Codespaces</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10">
        <span className="text-sm font-semibold text-foreground">Codespaces</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
            title="Novo Codespace"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadCodespaces}
            disabled={loading}
            className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista de Codespaces */}
      <ScrollArea className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
        <div className="p-1">
          {loading && codespaces.length === 0 ? (
            <div className="p-6 text-center">
              <div className="space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary/60" />
                <p className="text-sm text-muted-foreground">Carregando Codespaces...</p>
              </div>
            </div>
          ) : codespaces.length === 0 ? (
            <div className="p-6 text-center">
              <div className="space-y-3">
                <Cloud className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum Codespace encontrado</p>
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Codespace
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {codespaces.map((codespace) => (
                <Card key={codespace.id} className="mx-1 border-border/20 bg-card/30 hover:bg-card/50 hover:border-border/40 transition-all duration-200 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {codespace.display_name || codespace.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {codespace.repository?.full_name || 'Repositório desconhecido'}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 ${getStateColor(codespace.state)}`}
                      >
                        {getStateIcon(codespace.state)}
                        <span className="ml-1">{codespace.state}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Specs da máquina */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {codespace.machine && (
                          <>
                            <div className="flex items-center gap-1">
                              <Cpu className="h-3 w-3" />
                              <span>{codespace.machine.cpus} CPUs</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatBytes(codespace.machine.memory_in_bytes)} RAM</span>
                            </div>
                          </>
                        )}
                        {codespace.last_used_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(codespace.last_used_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2">
                        {codespace.web_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCodespace(codespace)}
                            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir
                          </Button>
                        )}
                        
                        {(codespace.state === 'Stopped' || codespace.state === 'Shutdown' || codespace.state === 'Archived') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartCodespace(codespace)}
                            className="h-7 text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        
                        {(codespace.state === 'Available' || codespace.state === 'Started') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStopCodespace(codespace)}
                            className="h-7 text-xs"
                          >
                            <Square className="h-3 w-3 mr-1" />
                            Parar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCodespace(codespace);
                            setShowDeleteModal(true);
                          }}
                          className="h-7 text-xs text-destructive hover:text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Criar Codespace */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Codespace
            </DialogTitle>
            <DialogDescription>
              Configure um novo ambiente de desenvolvimento em nuvem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="machine">Tipo de Máquina</Label>
              <Select 
                value={newCodespaceConfig.machine} 
                onValueChange={(value: any) => setNewCodespaceConfig(prev => ({ ...prev, machine: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basicLinux32gb">Básica (2 cores, 8GB RAM, 32GB storage)</SelectItem>
                  <SelectItem value="standardLinux32gb">Padrão (4 cores, 16GB RAM, 32GB storage)</SelectItem>
                  <SelectItem value="premiumLinux64gb">Premium (8 cores, 32GB RAM, 64GB storage)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout de Inatividade (minutos)</Label>
              <Input
                id="timeout"
                type="number"
                value={newCodespaceConfig.idle_timeout_minutes}
                onChange={(e) => setNewCodespaceConfig(prev => ({ 
                  ...prev, 
                  idle_timeout_minutes: parseInt(e.target.value) || 30 
                }))}
                min="5"
                max="240"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCodespace} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Codespace
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o Codespace "{selectedCodespace?.display_name || selectedCodespace?.name}"?
              <div className="mt-2 p-2 rounded bg-destructive/10 text-xs">
                ⚠️ Esta ação não pode ser desfeita. Todos os dados não commitados serão perdidos.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCodespace}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar Codespace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodespacesManager;