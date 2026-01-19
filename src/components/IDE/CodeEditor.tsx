import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Save, X, Circle, Copy, Scissors, Trash2, ClipboardPaste, Undo2, Redo2, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { githubService } from '@/services/githubService';
import { useHotkeys } from 'react-hotkeys-hook';
import SaveStatusModal from '@/components/IDE/SaveStatusModal';
import { useSaveStatus } from '@/hooks/useSaveStatus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OpenFile {
  path: string;
  content: string;
  modified: boolean;
  originalContent: string;
}

interface CodeEditorProps {
  selectedFile: string | null;
  theme: 'light' | 'dark';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ selectedFile, theme }) => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  
  // Hook para gerenciar status de salvamento
  const { 
    isModalOpen, 
    steps, 
    saveFileWithStatus, 
    closeSaveModal, 
    retryLastSave, 
    cancelSave,
    modalType 
  } = useSaveStatus();

  const getLanguageFromPath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'typescript';
      case 'jsx':
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'scss':
      case 'sass':
        return 'scss';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      default:
        return 'plaintext';
    }
  };

  const loadFile = async (filePath: string) => {
    // Verifica se o arquivo já está aberto
    const existingFile = openFiles.find(f => f.path === filePath);
    if (existingFile) {
      setActiveFile(filePath);
      return;
    }

    setLoading(true);
    try {
      const content = await githubService.getFileContent(filePath);
      const newFile: OpenFile = {
        path: filePath,
        content,
        modified: false,
        originalContent: content,
      };
      
      setOpenFiles(prev => {
        // Verifica novamente para evitar condições de corrida
        const alreadyExists = prev.find(f => f.path === filePath);
        if (alreadyExists) {
          return prev;
        }
        return [...prev, newFile];
      });
      setActiveFile(filePath);
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      toast({
        title: "Erro",
        description: `Falha ao carregar o arquivo ${filePath}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFileContent = (filePath: string, content: string) => {
    setOpenFiles(prev => prev.map(file => {
      if (file.path === filePath) {
        return {
          ...file,
          content,
          modified: content !== file.originalContent,
        };
      }
      return file;
    }));
  };

  const saveFile = async (filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (!file || !file.modified) return;

    try {
      const fileName = filePath.split('/').pop() || filePath;
      const success = await saveFileWithStatus(
        filePath,
        file.content,
        `Atualizar ${fileName} via IDE`
      );

      if (success) {
        // Marca o arquivo como salvo
        setOpenFiles(prev => prev.map(f => {
          if (f.path === filePath) {
            return {
              ...f,
              modified: false,
              originalContent: f.content,
            };
          }
          return f;
        }));
      }
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "❌ Falha ao Salvar",
        description: `Erro: ${errorMessage}. Verifique sua conexão e permissões do token GitHub.`,
        variant: "destructive",
      });
    }
  };

  const closeFile = (filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    
    if (file?.modified) {
      const shouldSave = window.confirm(
        'O arquivo possui alterações não salvas. Deseja salvá-lo antes de fechar?'
      );
      
      if (shouldSave) {
        saveFile(filePath).then(() => {
          // Remove o arquivo da lista
          setOpenFiles(prev => {
            const newFiles = prev.filter(f => f.path !== filePath);
            // Se o arquivo fechado era o ativo, muda para outro
            if (activeFile === filePath) {
              setActiveFile(newFiles.length > 0 ? newFiles[0].path : null);
            }
            return newFiles;
          });
        });
        return;
      }
    }
    
    // Remove o arquivo da lista
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.path !== filePath);
      // Se o arquivo fechado era o ativo, muda para outro
      if (activeFile === filePath) {
        setActiveFile(newFiles.length > 0 ? newFiles[0].path : null);
      }
      return newFiles;
    });
  };

  const saveActiveFile = () => {
    if (activeFile) {
      saveFile(activeFile);
    }
  };

  const saveAllFiles = async () => {
    const modifiedFiles = openFiles.filter(f => f.modified);
    
    if (modifiedFiles.length === 0) {
      toast({
        title: "Informação",
        description: "Nenhum arquivo possui alterações para salvar",
      });
      return;
    }

    const promises = modifiedFiles.map(file => saveFile(file.path));
    
    try {
      await Promise.all(promises);
      toast({
        title: "✅ Sucesso",
        description: `${modifiedFiles.length} arquivo(s) salvado(s) com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao salvar arquivos:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao salvar alguns arquivos. Verifique os logs para mais detalhes.",
        variant: "destructive",
      });
    }
  };

  const getModifiedFilesCount = () => {
    return openFiles.filter(f => f.modified).length;
  };

  // Hotkeys
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    saveActiveFile();
  });

  useHotkeys('ctrl+shift+s', (e) => {
    e.preventDefault();
    saveAllFiles();
  });

  useHotkeys('ctrl+w', (e) => {
    e.preventDefault();
    if (activeFile) {
      closeFile(activeFile);
    }
  });

  // Carrega arquivo quando selecionado
  useEffect(() => {
    if (selectedFile && githubService.isConfigured()) {
      // Adiciona um pequeno delay para evitar múltiplas chamadas simultâneas
      const timer = setTimeout(() => {
        loadFile(selectedFile);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [selectedFile]);

  const activeFileData = openFiles.find(f => f.path === activeFile);

  if (!githubService.isConfigured()) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-muted/20 blur-2xl rounded-full"></div>
            <div className="text-6xl mb-4 relative z-10">📝</div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-muted-foreground">
              GitHub não configurado
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              Configure sua integração com GitHub para começar a editar
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (openFiles.length === 0) {
    return (
      <div className="h-auto flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full"></div>
            <div className="text-6xl mb-4 relative z-10">📂</div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Nenhum arquivo aberto
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              Selecione um arquivo no explorer para começar a editar
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
            <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
            <span>Aguardando seleção de arquivo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full md:h-full w-full flex flex-col">
      {/* Abas dos arquivos - compacta no mobile */}
      <div className="inline-flex h-8 md:h-10 items-center justify-start rounded-none bg-muted/30 p-0.5 md:p-1 text-muted-foreground overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-w-0 border-b flex-shrink-0">
        <div className="flex min-w-0">
          {openFiles.map((file) => (
            <div
              key={file.path}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer group min-w-0 max-w-[120px] md:max-w-[200px] gap-1 md:gap-2 ${
                activeFile === file.path 
                  ? 'bg-background text-foreground shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm' 
                  : 'hover:bg-background/80 hover:text-foreground'
              }`}
              onClick={() => setActiveFile(file.path)}
            >
              <span className="text-xs md:text-sm truncate min-w-0 flex-1" title={file.path}>
                {file.path.split('/').pop()}
              </span>
              
              {file.modified && (
                <Circle className="h-1.5 w-1.5 md:h-2 md:w-2 fill-warning text-warning animate-pulse flex-shrink-0" />
              )}
              
              <Button
                size="sm"
                variant="ghost"
                className="h-3 w-3 md:h-4 md:w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
              >
                <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Botão salvar compacto no mobile */}
        {activeFileData?.modified && (
          <Button
            size="sm"
            onClick={saveActiveFile}
            className="ml-auto mr-1 h-6 w-6 md:hidden p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            title="Salvar"
          >
            <Save className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Barra de ferramentas - escondida no mobile */}
      {activeFileData && (
        <div className="hidden md:flex items-center justify-between p-3 border-b bg-gradient-to-r from-muted/20 to-muted/5 min-w-0 overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3 text-sm min-w-0 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <span className="font-mono text-xs bg-muted/40 px-2 py-1 rounded truncate max-w-[300px]" title={activeFileData.path}>
                {activeFileData.path}
              </span>
              {activeFileData.modified && (
                <span className="text-warning text-xs bg-warning/10 px-2 py-1 rounded border border-warning/20 whitespace-nowrap flex-shrink-0">
                  • modificado
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <Button
              size="sm"
              onClick={saveActiveFile}
              disabled={!activeFileData.modified}
              className={`h-8 px-3 transition-all ${
                activeFileData.modified 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' 
                  : 'opacity-50'
              }`}
              title="Salvar arquivo atual (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            
            {getModifiedFilesCount() > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={saveAllFiles}
                className="h-8 px-3 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                title={`Salvar todos os arquivos modificados (${getModifiedFilesCount()}) - Ctrl+Shift+S`}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden md:inline">Todos ({getModifiedFilesCount()})</span>
                <span className="md:hidden">({getModifiedFilesCount()})</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor - ocupa todo espaço disponível */}
      <div className="w-full overflow-hidden relative flex-1 pb-12 md:pb-0">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeFileData ? (
          <Editor
            height="100%"
            width="100%"
            language={getLanguageFromPath(activeFileData.path)}
            value={activeFileData.content}
            onChange={(value) => {
              if (value !== undefined) {
                updateFileContent(activeFileData.path, value);
              }
            }}
            onMount={(editor) => {
              editorRef.current = editor;
              setTimeout(() => {
                editor.layout();
              }, 100);
              setTimeout(() => {
                editor.layout();
              }, 500);
              const handleResize = () => editor.layout();
              window.addEventListener('resize', handleResize);
              return () => window.removeEventListener('resize', handleResize);
            }}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
          />
        ) : null}
      </div>

      {/* Barra de ações inferior - fixada no mobile */}
      {activeFileData && (
        <div className="fixed md:relative bottom-0 left-0 right-0 flex items-center justify-center gap-1 px-2 py-1.5 border-t bg-background md:bg-muted/30 flex-shrink-0 z-50 shadow-lg md:shadow-none">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (editorRef.current) {
                const model = editorRef.current.getModel();
                if (model) {
                  editorRef.current.setSelection(model.getFullModelRange());
                  editorRef.current.focus();
                  toast({ title: "Selecionado", description: "Todo o código foi selecionado" });
                }
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Selecionar tudo (Ctrl+A)"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Selecionar</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('copy');
                toast({ title: "Copiado", description: "Texto copiado para a área de transferência" });
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Copiar (Ctrl+C)"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copiar</span>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('cut');
                toast({ title: "Cortado", description: "Texto cortado para a área de transferência" });
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Cortar (Ctrl+X)"
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cortar</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Excluir tudo"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todo o conteúdo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá limpar todo o conteúdo do arquivo atual. Você pode desfazer esta ação com Ctrl+Z.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.setValue('');
                      updateFileContent(activeFileData.path, '');
                      toast({ title: "Conteúdo excluído", description: "Todo o conteúdo foi removido" });
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (editorRef.current) {
                try {
                  const text = await navigator.clipboard.readText();
                  const selection = editorRef.current.getSelection();
                  editorRef.current.executeEdits('paste', [{
                    range: selection,
                    text: text,
                    forceMoveMarkers: true
                  }]);
                  toast({ title: "Colado", description: "Texto colado com sucesso" });
                } catch {
                  toast({ title: "Erro", description: "Não foi possível acessar a área de transferência", variant: "destructive" });
                }
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Colar (Ctrl+V)"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Colar</span>
          </Button>

          <div className="w-px h-4 bg-border mx-1" />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger('keyboard', 'undo', null);
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desfazer</span>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger('keyboard', 'redo', null);
              }
            }}
            className="h-7 px-2 text-xs gap-1"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refazer</span>
          </Button>
        </div>
      )}

      {/* Modal de Status de Salvamento */}
      <SaveStatusModal
        isOpen={isModalOpen}
        onClose={closeSaveModal}
        steps={steps}
        fileName={activeFileData?.path.split('/').pop()}
        onRetry={retryLastSave}
        canCancel={steps.some(step => step.status === 'in-progress')}
        onCancel={cancelSave}
        modalType={modalType}
      />
    </div>
  );
};

export default CodeEditor;