import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Save, X, Circle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { githubService } from '@/services/githubService';
import { useHotkeys } from 'react-hotkeys-hook';

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
      
      setOpenFiles(prev => [...prev, newFile]);
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
      const result = await githubService.updateFile(
        filePath,
        file.content,
        `Atualizar ${fileName} via IDE`
      );

      if (result) {
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

        toast({
          title: "✅ Sucesso",
          description: `Arquivo ${fileName} salvo e enviado para o GitHub com timestamp`,
        });
      }
    } catch (error) {
      console.error('Erro detalhado ao salvar arquivo:', error);
      
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
          setOpenFiles(prev => prev.filter(f => f.path !== filePath));
          
          // Se o arquivo fechado era o ativo, muda para outro
          if (activeFile === filePath) {
            const remainingFiles = openFiles.filter(f => f.path !== filePath);
            setActiveFile(remainingFiles.length > 0 ? remainingFiles[0].path : null);
          }
        });
        return;
      }
    }
    
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    // Se o arquivo fechado era o ativo, muda para outro
    if (activeFile === filePath) {
      const remainingFiles = openFiles.filter(f => f.path !== filePath);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0].path : null);
    }
  };

  const saveActiveFile = () => {
    if (activeFile) {
      saveFile(activeFile);
    }
  };

  // Hotkeys
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    saveActiveFile();
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
      loadFile(selectedFile);
    }
  }, [selectedFile]);

  const activeFileData = openFiles.find(f => f.path === activeFile);

  if (!githubService.isConfigured()) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p>Configure o GitHub para começar a editar</p>
        </div>
      </div>
    );
  }

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-4">📂</div>
          <p>Selecione um arquivo para começar a editar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Abas dos arquivos */}
      <div className="flex border-b bg-muted/30 overflow-x-auto">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer whitespace-nowrap ${
              activeFile === file.path 
                ? 'bg-background border-b-2 border-primary' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="text-sm">
              {file.path.split('/').pop()}
            </span>
            
            {file.modified && (
              <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      {activeFileData && (
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{activeFileData.path}</span>
            {activeFileData.modified && (
              <span className="text-orange-500">(modificado)</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={saveActiveFile}
              disabled={!activeFileData.modified}
              className="h-7"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeFileData ? (
          <Editor
            height="100%"
            language={getLanguageFromPath(activeFileData.path)}
            value={activeFileData.content}
            onChange={(value) => {
              if (value !== undefined) {
                updateFileContent(activeFileData.path, value);
              }
            }}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              suggest: {
                enabled: true,
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CodeEditor;