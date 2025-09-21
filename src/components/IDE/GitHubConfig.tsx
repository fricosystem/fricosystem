import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Github, CheckCircle, XCircle, RefreshCw, Unlink } from 'lucide-react';
import { githubService, GitHubConfig } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GitHubConfigProps {
  onConfigured: () => void;
}

const GitHubConfigComponent: React.FC<GitHubConfigProps> = ({ onConfigured }) => {
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    owner: '',
    repo: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<GitHubConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeService = async () => {
      await githubService.ensureInitialized();
      const savedConfig = githubService.getConfig();
      if (savedConfig) {
        setCurrentConfig(savedConfig);
        setIsConnected(githubService.isConfigured());
        setConfig({
          token: '',
          owner: savedConfig.owner,
          repo: savedConfig.repo,
        });
      }
    };
    
    initializeService();
  }, []);

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    if (!config.token || !config.owner || !config.repo) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    
    try {
      await githubService.configure(config.token, config.owner, config.repo);
      
      const connected = await githubService.testConnection();
      
      if (connected) {
        setIsConnected(true);
        setCurrentConfig(config);
        toast({
          title: "Sucesso",
          description: "Conectado ao GitHub com sucesso! Configuração salva no Firestore.",
        });
        onConfigured();
      } else {
        await githubService.disconnect();
        toast({
          title: "Erro",
          description: "Falha ao conectar. Verifique suas credenciais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      await githubService.disconnect();
      toast({
        title: "Erro",
        description: "Falha na conexão com o GitHub",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await githubService.disconnect();
      setIsConnected(false);
      setCurrentConfig(null);
      setConfig({ token: '', owner: '', repo: '' });
      toast({
        title: "Desconectado",
        description: "Desconectado do GitHub e configuração removida do Firestore",
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar do GitHub",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    if (!isConnected) return;

    setTesting(true);
    try {
      const connected = await githubService.testConnection();
      
      if (connected) {
        toast({
          title: "Sucesso",
          description: "Conexão com GitHub funcionando",
        });
      } else {
        setIsConnected(false);
        setCurrentConfig(null);
        toast({
          title: "Erro",
          description: "Falha na conexão. Reconecte-se.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnected(false);
      setCurrentConfig(null);
      toast({
        title: "Erro",
        description: "Falha ao testar conexão",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Configuração do GitHub
          {isConnected && (
            <Badge variant="secondary" className="ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure sua integração com o GitHub para editar arquivos remotamente
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected && currentConfig ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Conectado ao repositório{' '}
                <strong>{currentConfig.owner}/{currentConfig.repo}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Configure sua conexão com o GitHub para começar a usar o IDE.
                <br />
                <strong>Nota:</strong> É necessário estar logado para usar esta funcionalidade de forma segura.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="token">Token de Acesso Pessoal</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxx"
                  value={config.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Crie um token em: Settings → Developer settings → Personal access tokens
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="owner">Proprietário/Organização</Label>
                <Input
                  id="owner"
                  placeholder="seu-usuario-github"
                  value={config.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="repo">Nome do Repositório</Label>
                <Input
                  id="repo"
                  placeholder="nome-do-repositorio"
                  value={config.repo}
                  onChange={(e) => handleInputChange('repo', e.target.value)}
                />
              </div>
            </div>
            
            <Button
              onClick={handleConnect}
              disabled={testing || !config.token || !config.owner || !config.repo}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  Conectar ao GitHub
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Permissões necessárias no token:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>repo (acesso completo aos repositórios)</li>
                <li>workflow (se usar GitHub Actions)</li>
              </ul>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  🔒 Segurança: Seus tokens são criptografados e salvos de forma segura no banco de dados.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GitHubConfigComponent;