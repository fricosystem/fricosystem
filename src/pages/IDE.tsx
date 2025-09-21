import React, { useState, useEffect } from 'react';
import AppLayout from "@/layouts/AppLayout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Shield, UserX, Code, Eye } from "lucide-react";
import { githubService } from '@/services/githubService';
import { auth } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import FileExplorer from '@/components/IDE/FileExplorer';
import CodeEditor from '@/components/IDE/CodeEditor';
import GitHubConfigComponent from '@/components/IDE/GitHubConfig';
import CommitPanel from '@/components/IDE/CommitPanel';
import PasswordModal from '@/components/IDE/PasswordModal';

const IDE: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, loading] = useAuthState(auth);
  const [initializing, setInitializing] = useState(true);
  
  // Estados para inicializaÃ§Ã£o do projeto
  const [showInitModal, setShowInitModal] = useState(false);
  const [npmInstallProgress, setNpmInstallProgress] = useState(0);
  const [npmDevProgress, setNpmDevProgress] = useState(0);
  const [currentInitStep, setCurrentInitStep] = useState<'install' | 'dev' | 'complete'>('install');
  
  // Estado para controlar as abas do editor
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    const initializeService = async () => {
      if (!user) {
        setInitializing(false);
        return;
      }

      try {
        // Primeiro, verifica se existe configuraÃ§Ã£o no firestore
        const hasConfig = await githubService.hasExistingConfig();
        setHasExistingConfig(hasConfig);

        if (hasConfig) {
          // Se existe configuraÃ§Ã£o, mostra modal de senha
          setShowPasswordModal(true);
        } else {
          // Se nÃ£o existe configuraÃ§Ã£o, vai direto para o formulÃ¡rio
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Erro ao verificar configuraÃ§Ã£o do GitHub:', error);
        setHasExistingConfig(false);
        setIsConfigured(false);
      } finally {
        setInitializing(false);
      }
    };
    
    if (!loading) {
      initializeService();
    }
    
    // Detecta tema do sistema
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || systemTheme);
  }, [user, loading]);

  const handlePasswordValidated = async () => {
    try {
      // Carrega a configuraÃ§Ã£o do GitHub apÃ³s validar a senha
      await githubService.forceReloadConfig();
      setIsConfigured(githubService.isConfigured());
      setShowPasswordModal(false);
      
      // Inicia o processo de inicializaÃ§Ã£o do projeto
      await initializeProject();
    } catch (error) {
      console.error('Erro ao carregar configuraÃ§Ã£o do GitHub:', error);
    }
  };

  const handleConfigured = () => {
    setIsConfigured(true);
    setHasExistingConfig(true);
    // Inicia o processo de inicializaÃ§Ã£o do projeto
    initializeProject();
  };

  const initializeProject = async () => {
    setShowInitModal(true);
    setCurrentInitStep('install');
    setNpmInstallProgress(0);
    
    // Simula npm install
    for (let i = 0; i <= 100; i += 10) {
      setNpmInstallProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setCurrentInitStep('dev');
    setNpmDevProgress(0);
    
    // Simula npm run dev
    for (let i = 0; i <= 100; i += 10) {
      setNpmDevProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    setCurrentInitStep('complete');
    setTimeout(() => {
      setShowInitModal(false);
    }, 1000);
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleRefresh = () => {
    // ForÃ§a re-render dos componentes
    setSelectedFile(null);
    setTimeout(() => setSelectedFile(selectedFile), 100);
  };

  return (
    <AppLayout title="FR - Fusion IDE">
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {loading || initializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="space-y-2">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold">AutenticaÃ§Ã£o NecessÃ¡ria</h2>
                <p className="text-sm text-muted-foreground">
                  O IDE requer autenticaÃ§Ã£o para funcionar de forma segura. 
                  Por favor, faÃ§a login para acessar esta funcionalidade.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="h-3 w-3" />
                <span>Seus tokens GitHub sÃ£o criptografados e armazenados com seguranÃ§a</span>
              </div>
            </div>
          </div>
        ) : showPasswordModal ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="space-y-2">
                <Code className="h-12 w-12 mx-auto text-primary" />
                <h2 className="text-xl font-semibold">IDE - Editor de CÃ³digo</h2>
                <p className="text-sm text-muted-foreground">
                  ConfiguraÃ§Ã£o GitHub encontrada. Confirme sua senha para acessar.
                </p>
              </div>
            </div>
            <PasswordModal
              isOpen={showPasswordModal}
              onValidPassword={handlePasswordValidated}
              userEmail={user.email || ''}
            />
          </div>
        ) : !isConfigured ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <Code className="h-16 w-16 mx-auto text-primary" />
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">IDE - Editor de CÃ³digo</h1>
                  <p className="text-muted-foreground">
                    Editor completo com integraÃ§Ã£o ao GitHub, Monaco Editor e controle de versÃ£o
                  </p>
                </div>
              </div>
              
              <GitHubConfigComponent onConfigured={handleConfigured} />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Sidebar esquerda - Explorer */}
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full flex flex-col border-r border-border/60">
                  <Tabs defaultValue="explorer" className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-border/60">
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="explorer" className="text-xs">Explorer</TabsTrigger>
                        <TabsTrigger value="commits" className="text-xs">Commits</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="explorer" className="flex-1 m-0">
                      <FileExplorer 
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onRefresh={handleRefresh}
                      />
                    </TabsContent>
                    
                    <TabsContent value="commits" className="flex-1 m-0">
                      <CommitPanel />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>

              <ResizableHandle className="w-1 bg-border/60 hover:bg-border transition-colors" />

              {/* Ãrea central - Editor com abas */}
              <ResizablePanel defaultSize={80}>
                <div className="h-full flex flex-col">
                  {selectedFile ? (
                    <>
                      {/* Abas do Editor */}
                      <div className="px-4 py-3 border-b border-border/60">
                        <Tabs value={activeEditorTab} onValueChange={(value) => setActiveEditorTab(value as 'editor' | 'preview')} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-8 max-w-md">
                            <TabsTrigger value="editor" className="flex items-center gap-2 text-xs">
                              <Code className="h-3 w-3" />
                              Editor
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2 text-xs">
                              <Eye className="h-3 w-3" />
                              VisualizaÃ§Ã£o
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      
                      {/* ConteÃºdo das abas */}
                      <div className="flex-1 min-h-0">
                        {activeEditorTab === 'editor' ? (
                          <CodeEditor 
                            selectedFile={selectedFile} 
                            theme={theme}
                          />
                        ) : (
                          <div className="h-full w-full">
                            <iframe
                              src={window.location.origin}
                              className="w-full h-full border-0"
                              title="Preview"
                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Code className="h-16 w-16 mx-auto text-muted-foreground/30" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-muted-foreground">Nenhum arquivo selecionado</p>
                          <p className="text-sm text-muted-foreground/70">Selecione um arquivo no explorer para comeÃ§ar a editar</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Modal de InicializaÃ§Ã£o */}
            <Dialog open={showInitModal} onOpenChange={() => {}}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    Inicializando Projeto
                  </DialogTitle>
                  <DialogDescription>
                    Preparando o ambiente de desenvolvimento...
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* NPM Install */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        currentInitStep === 'install' ? 'text-primary' : 
                        currentInitStep === 'dev' || currentInitStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        npm install
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {currentInitStep === 'install' && `${npmInstallProgress}%`}
                        {(currentInitStep === 'dev' || currentInitStep === 'complete') && 'â'}
                      </span>
                    </div>
                    <Progress 
                      value={currentInitStep === 'install' ? npmInstallProgress : 
                             currentInitStep === 'dev' || currentInitStep === 'complete' ? 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  {/* NPM Run Dev */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        currentInitStep === 'dev' ? 'text-primary' : 
                        currentInitStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        npm run dev
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {currentInitStep === 'dev' && `${npmDevProgress}%`}
                        {currentInitStep === 'complete' && 'â'}
                      </span>
                    </div>
                    <Progress 
                      value={currentInitStep === 'dev' ? npmDevProgress : 
                             currentInitStep === 'complete' ? 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  {currentInitStep === 'complete' && (
                    <div className="text-center py-2">
                      <p className="text-sm font-medium text-green-600">â Projeto inicializado com sucesso!</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IDE;