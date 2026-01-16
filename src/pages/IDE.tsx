import React, { useState, useEffect } from 'react';
import AppLayout from "@/layouts/AppLayout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Alert component reserved for future use
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, UserX, Code, Eye, Paintbrush, FolderTree, GitBranch, GitCommit, Cloud, ChevronLeft, Save } from "lucide-react";
import { githubService } from '@/services/githubService';
import { auth } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import FileExplorer from '@/components/IDE/FileExplorer';
import CodeEditor from '@/components/IDE/CodeEditor';
import GitHubConfigComponent from '@/components/IDE/GitHubConfig';
import CommitPanel from '@/components/IDE/CommitPanel';
import CodespacesManager from '@/components/IDE/CodespacesManager';
import RepositoryManager from '@/components/IDE/RepositoryManager';
import PasswordModal from '@/components/IDE/PasswordModal';
import VisualEditModal from '@/components/IDE/VisualEditModal';
import PreviewOverlay from '@/components/IDE/PreviewOverlay';
import { useVisualEditor } from '@/hooks/useVisualEditor';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Tipo para abas da sidebar
type SidebarTab = 'explorer' | 'repos' | 'commits' | 'codespaces';

// Mapeamento de abas para nomes e ícones
const TAB_CONFIG: Record<SidebarTab, { label: string; icon: React.ReactNode }> = {
  explorer: { label: 'Explorer', icon: <FolderTree className="h-4 w-4" /> },
  repos: { label: 'Repositórios', icon: <GitBranch className="h-4 w-4" /> },
  commits: { label: 'Commits', icon: <GitCommit className="h-4 w-4" /> },
  codespaces: { label: 'Codespaces', icon: <Cloud className="h-4 w-4" /> },
};

const IDE: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, loading] = useAuthState(auth);
  const [initializing, setInitializing] = useState(true);
  
  // Estados para inicialização do projeto
  const [showInitModal, setShowInitModal] = useState(false);
  const [npmInstallProgress, setNpmInstallProgress] = useState(0);
  const [npmDevProgress, setNpmDevProgress] = useState(0);
  const [currentInitStep, setCurrentInitStep] = useState<'install' | 'dev' | 'complete'>('install');
  
  // Estado para controlar as abas do editor
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview' | 'elementor'>('editor');
  
  // Estados para navegação mobile
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');
  const [mobileView, setMobileView] = useState<'tabs' | 'list' | 'editor'>('tabs');
  const [isFileModified, setIsFileModified] = useState(false);
  
  // Hook do editor visual
  const {
    isEditMode,
    selectedElement,
    isModalOpen,
    enableEditMode,
    disableEditMode,
    applyChanges,
    handleMessage,
    setIsModalOpen
  } = useVisualEditor();

  useEffect(() => {
    const initializeService = async () => {
      if (!user) {
        setInitializing(false);
        return;
      }

      try {
        // Primeiro, verifica se existe configuração no firestore
        const hasConfig = await githubService.hasExistingConfig();
        setHasExistingConfig(hasConfig);

        if (hasConfig) {
          // Se existe configuração, mostra modal de senha
          setShowPasswordModal(true);
        } else {
          // Se não existe configuração, vai direto para o formulário
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Erro ao verificar configuração do GitHub:', error);
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
      // Carrega a configuração do GitHub após validar a senha
      await githubService.forceReloadConfig();
      setIsConfigured(githubService.isConfigured());
      setShowPasswordModal(false);
      
      // Inicia o processo de inicialização do projeto
      await initializeProject();
    } catch (error) {
      console.error('Erro ao carregar configuração do GitHub:', error);
    }
  };

  const handleConfigured = () => {
    setIsConfigured(true);
    setHasExistingConfig(true);
    // Inicia o processo de inicialização do projeto
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
    // No mobile, ao selecionar arquivo, vai para o editor
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleRefresh = () => {
    // Força re-render dos componentes
    setSelectedFile(null);
    setTimeout(() => setSelectedFile(selectedFile), 100);
  };

  // Função para selecionar aba no mobile
  const handleMobileTabSelect = (tab: SidebarTab) => {
    setActiveSidebarTab(tab);
    setMobileView('list');
  };

  // Função para voltar no mobile
  const handleMobileBack = () => {
    if (mobileView === 'editor') {
      setMobileView('list');
      setSelectedFile(null);
    } else if (mobileView === 'list') {
      setMobileView('tabs');
    }
  };

  // Callback para saber se arquivo foi modificado
  const handleFileModified = (modified: boolean) => {
    setIsFileModified(modified);
  };

  return (
    <AppLayout title="FR - Fusion IDE">
      <div className="flex flex-col h-full min-h-0 w-full overflow-hidden relative">
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
                <h2 className="text-xl font-semibold">Autenticação Necessária</h2>
                <p className="text-sm text-muted-foreground">
                  O IDE requer autenticação para funcionar de forma segura. 
                  Por favor, faça login para acessar esta funcionalidade.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="h-3 w-3" />
                <span>Seus tokens GitHub são criptografados e armazenados com segurança</span>
              </div>
            </div>
          </div>
        ) : showPasswordModal ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="space-y-2">
                <Code className="h-12 w-12 mx-auto text-primary" />
                <h2 className="text-xl font-semibold">IDE - Editor de Código</h2>
                <p className="text-sm text-muted-foreground">
                  Configuração GitHub encontrada. Confirme sua senha para acessar.
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
                  <h1 className="text-2xl font-bold">IDE - Editor de Código</h1>
                  <p className="text-muted-foreground">
                    Editor completo com integração ao GitHub, Monaco Editor e controle de versão
                  </p>
                </div>
              </div>
              
              <GitHubConfigComponent onConfigured={handleConfigured} />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full overflow-hidden bg-background">
            {/* Layout Mobile */}
            {isMobile ? (
              <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
                {/* Vista de Abas - Tela inicial mobile */}
                {mobileView === 'tabs' && (
                  <div className="h-full w-full flex flex-col p-4 gap-3">
                    <h2 className="text-lg font-semibold text-foreground mb-2">Navegação</h2>
                    {(Object.keys(TAB_CONFIG) as SidebarTab[]).map((tab) => (
                      <Button
                        key={tab}
                        variant="outline"
                        className="h-14 justify-start gap-3 text-left"
                        onClick={() => handleMobileTabSelect(tab)}
                      >
                        {TAB_CONFIG[tab].icon}
                        <span className="font-medium">{TAB_CONFIG[tab].label}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Vista de Lista - Conteúdo da aba selecionada */}
                {mobileView === 'list' && (
                  <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
                    {/* Header com botão voltar */}
                    <div className="flex items-center gap-2 p-3 border-b border-border/40 bg-background/80 backdrop-blur-sm flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMobileBack}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Voltar
                      </Button>
                      <div className="flex items-center gap-2">
                        {TAB_CONFIG[activeSidebarTab].icon}
                        <span className="font-medium">{TAB_CONFIG[activeSidebarTab].label}</span>
                      </div>
                    </div>
                    
                    {/* Conteúdo da aba */}
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                      {activeSidebarTab === 'explorer' && (
                        <FileExplorer 
                          onFileSelect={handleFileSelect}
                          selectedFile={selectedFile}
                          onRefresh={handleRefresh}
                        />
                      )}
                      {activeSidebarTab === 'repos' && <RepositoryManager />}
                      {activeSidebarTab === 'commits' && <CommitPanel />}
                      {activeSidebarTab === 'codespaces' && <CodespacesManager />}
                    </div>
                  </div>
                )}

                {/* Vista de Editor - Arquivo aberto em tela cheia */}
                {mobileView === 'editor' && selectedFile && (
                  <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
                    {/* Header com botão voltar e salvar */}
                    <div className="flex items-center justify-between p-2 border-b border-border/40 bg-background/80 backdrop-blur-sm flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMobileBack}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Voltar
                      </Button>
                      
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[40%]">
                        {selectedFile.split('/').pop()}
                      </span>
                      
                      <div className="flex gap-1">
                        {/* Abas do editor no mobile */}
                        <Button
                          variant={activeEditorTab === 'editor' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setActiveEditorTab('editor')}
                          className="h-8 px-2"
                        >
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={activeEditorTab === 'preview' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setActiveEditorTab('preview')}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Conteúdo do editor */}
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                      {activeEditorTab === 'editor' ? (
                        <CodeEditor 
                          selectedFile={selectedFile} 
                          theme={theme}
                        />
                      ) : (
                        <div className="h-full w-full overflow-hidden">
                          <iframe
                            src={window.location.origin}
                            className="w-full h-full border-0"
                            title="Prévia"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Layout Desktop/Tablet */
              <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 max-w-full overflow-hidden">
                {/* Sidebar esquerda - Explorer */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="min-w-0 overflow-hidden">
                  <div className="h-full w-full flex flex-col bg-muted/30 min-h-0 overflow-hidden">
                    <Tabs 
                      value={activeSidebarTab} 
                      onValueChange={(v) => setActiveSidebarTab(v as SidebarTab)} 
                      className="h-full w-full flex flex-col min-h-0 overflow-hidden"
                    >
                      <div className="px-1 sm:px-2 py-2 bg-background/50 backdrop-blur-sm border-b border-border/40 flex-shrink-0 overflow-hidden">
                        <TabsList className="grid w-full grid-cols-4 h-8 sm:h-9 bg-muted/50 p-0.5 sm:p-1 gap-0.5">
                          <TabsTrigger 
                            value="explorer" 
                            className="text-[9px] sm:text-xs font-medium px-1 sm:px-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                            title="Explorer"
                          >
                            <FolderTree className="h-3.5 w-3.5 md:mr-1" />
                            <span className="hidden md:inline">Explorer</span>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="repos" 
                            className="text-[9px] sm:text-xs font-medium px-1 sm:px-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                            title="Repositórios"
                          >
                            <GitBranch className="h-3.5 w-3.5 md:mr-1" />
                            <span className="hidden md:inline">Repos</span>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="commits" 
                            className="text-[9px] sm:text-xs font-medium px-1 sm:px-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                            title="Commits"
                          >
                            <GitCommit className="h-3.5 w-3.5 md:mr-1" />
                            <span className="hidden md:inline">Commits</span>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="codespaces" 
                            className="text-[9px] sm:text-xs font-medium px-1 sm:px-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                            title="Codespaces"
                          >
                            <Cloud className="h-3.5 w-3.5 md:mr-1" />
                            <span className="hidden md:inline">Cloud</span>
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <TabsContent value="explorer" className="flex-1 m-0 min-h-0 w-full overflow-hidden">
                        <FileExplorer 
                          onFileSelect={handleFileSelect}
                          selectedFile={selectedFile}
                          onRefresh={handleRefresh}
                        />
                      </TabsContent>
                      
                      <TabsContent value="repos" className="flex-1 m-0 min-h-0 w-full overflow-hidden">
                        <RepositoryManager />
                      </TabsContent>
                      
                      <TabsContent value="commits" className="flex-1 m-0 min-h-0 w-full overflow-hidden">
                        <CommitPanel />
                      </TabsContent>
                      
                      <TabsContent value="codespaces" className="flex-1 m-0 min-h-0 w-full overflow-hidden">
                        <CodespacesManager />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-gradient-to-b from-border/40 to-border/80 hover:bg-primary/20 transition-colors duration-200 flex-shrink-0 relative z-10" />

                {/* Área central - Editor com abas */}
                <ResizablePanel defaultSize={75} className="min-w-0 overflow-hidden flex-1">
                  <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
                    {selectedFile ? (
                      <>
                        {/* Abas do Editor */}
                        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-background/80 backdrop-blur-sm border-b border-border/40 flex-shrink-0 overflow-hidden">
                          <Tabs value={activeEditorTab} onValueChange={(value) => setActiveEditorTab(value as 'editor' | 'preview' | 'elementor')} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-8 sm:h-10 max-w-xs sm:max-w-md bg-muted/40 p-0.5 sm:p-1">
                              <TabsTrigger 
                                value="editor" 
                                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                              >
                                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                <span className="hidden sm:inline">Editor</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="preview" 
                                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                              >
                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                <span className="hidden sm:inline">Prévia</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="elementor" 
                                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                              >
                                <Paintbrush className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                <span className="hidden sm:inline">Visual</span>
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        
                        {/* Conteúdo das abas */}
                        <div className="flex-1 min-h-0 w-full overflow-hidden">
                          {activeEditorTab === 'editor' ? (
                            <CodeEditor 
                              selectedFile={selectedFile} 
                              theme={theme}
                            />
                          ) : activeEditorTab === 'preview' ? (
                            <div className="h-full w-full overflow-hidden">
                              <iframe
                                src={window.location.origin}
                                className="w-full h-full border-0"
                                title="Prévia"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                              />
                            </div>
                          ) : (
                            <div className="h-full w-full overflow-hidden relative">
                              <iframe
                                src={window.location.origin}
                                className="w-full h-full border-0"
                                title="Elementor"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                              />
                              <PreviewOverlay
                                isEditMode={isEditMode}
                                onToggleEditMode={isEditMode ? disableEditMode : enableEditMode}
                                onMessage={handleMessage}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center p-4 overflow-hidden">
                        <div className="text-center space-y-4">
                          <Code className="h-16 w-16 mx-auto text-muted-foreground/30" />
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-muted-foreground">Nenhum arquivo selecionado</p>
                            <p className="text-sm text-muted-foreground/70">Selecione um arquivo no explorer para começar a editar</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}

            {/* Modal de Inicialização */}
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
                        {(currentInitStep === 'dev' || currentInitStep === 'complete') && '✓'}
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
                        {currentInitStep === 'complete' && '✓'}
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
                      <p className="text-sm font-medium text-green-600">✓ Projeto inicializado com sucesso!</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Edição Visual */}
            <VisualEditModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                navigate('/dashboard');
              }}
              selectedElement={selectedElement}
              onApplyChanges={applyChanges}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IDE;