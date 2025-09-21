import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { githubService, FileNode } from '@/services/githubService';
import { useToast } from '@/components/ui/use-toast';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
  onRefresh?: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  onFileSelect, 
  selectedFile, 
  onRefresh 
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creatingFile, setCreatingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const { toast } = useToast();

  const loadFiles = async (path: string = '') => {
    if (!githubService.isConfigured()) {
      return [];
    }

    setLoading(true);
    try {
      const fileTree = await githubService.getRepositoryTree(path);
      return fileTree;
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar arquivos do repositório",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadRootFiles = async () => {
    const rootFiles = await loadFiles();
    setFiles(rootFiles);
  };

  const loadDirContents = async (dirPath: string) => {
    const dirFiles = await loadFiles(dirPath);
    setFiles(prevFiles => updateFileTree(prevFiles, dirPath, dirFiles));
  };

  const updateFileTree = (files: FileNode[], dirPath: string, newFiles: FileNode[]): FileNode[] => {
    return files.map(file => {
      if (file.path === dirPath && file.type === 'dir') {
        return { ...file, children: newFiles };
      }
      if (file.children) {
        return { ...file, children: updateFileTree(file.children, dirPath, newFiles) };
      }
      return file;
    });
  };

  const toggleDirectory = async (dirPath: string) => {
    const isExpanded = expandedDirs.has(dirPath);
    
    if (isExpanded) {
      setExpandedDirs(prev => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
    } else {
      setExpandedDirs(prev => new Set(prev).add(dirPath));
      
      // Carrega o conteúdo do diretório se ainda não foi carregado
      const dirNode = findNodeByPath(files, dirPath);
      if (dirNode && !dirNode.children) {
        await loadDirContents(dirPath);
      }
    }
  };

  const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCreateFile = async (dirPath: string = '') => {
    if (!newFileName.trim()) return;

    const fullPath = dirPath ? `${dirPath}/${newFileName}` : newFileName;
    
    try {
      const result = await githubService.createFile(
        fullPath,
        '// Novo arquivo criado via IDE\n',
        `Criar arquivo ${newFileName} via IDE`
      );
      
      if (result) {
        toast({
          title: "✅ Sucesso",
          description: `Arquivo ${newFileName} criado e enviado para o GitHub com timestamp`,
        });
        
        // Recarrega os arquivos
        await loadRootFiles();
        
        // Seleciona o arquivo recém-criado
        onFileSelect(fullPath);
      }
    } catch (error) {
      console.error('Erro detalhado ao criar arquivo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "❌ Falha ao Criar",
        description: `Erro: ${errorMessage}. Verifique sua conexão e permissões do token GitHub.`,
        variant: "destructive",
      });
    } finally {
      setCreatingFile(null);
      setNewFileName('');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    
    try {
      const result = await githubService.deleteFile(filePath, `Deletar arquivo ${fileName} via IDE`);
      
      if (result) {
        toast({
          title: "✅ Sucesso",
          description: `Arquivo ${fileName} deletado do GitHub com timestamp`,
        });
        
        // Recarrega os arquivos
        await loadRootFiles();
      }
    } catch (error) {
      console.error('Erro detalhado ao deletar arquivo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "❌ Falha ao Deletar",
        description: `Erro: ${errorMessage}. Verifique suas permissões do token GitHub.`,
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return '📄';
      case 'css':
      case 'scss':
      case 'sass':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      case 'md':
        return '📖';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const renderFileNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;
    
    return (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer ${
                isSelected ? 'bg-accent text-accent-foreground' : ''
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (node.type === 'file') {
                  onFileSelect(node.path);
                } else {
                  toggleDirectory(node.path);
                }
              }}
            >
              {node.type === 'dir' && (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Folder className="h-4 w-4 text-blue-500" />
                </>
              )}
              
              {node.type === 'file' && (
                <>
                  <span className="w-3" />
                  <File className="h-4 w-4 text-muted-foreground" />
                </>
              )}
              
              <span className="text-sm truncate flex-1">
                {getFileIcon(node.name)} {node.name}
              </span>
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent>
            {node.type === 'dir' && (
              <ContextMenuItem onClick={() => setCreatingFile(node.path)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo arquivo
              </ContextMenuItem>
            )}
            
            {node.type === 'file' && (
              <ContextMenuItem 
                onClick={() => handleDeleteFile(node.path)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar arquivo
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
        
        {/* Input para criar novo arquivo */}
        {creatingFile === node.path && (
          <div 
            className="flex items-center gap-2 px-2 py-1"
            style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
          >
            <span className="w-3" />
            <File className="h-4 w-4 text-muted-foreground" />
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nome-do-arquivo.tsx"
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile(node.path);
                } else if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile(node.path);
                } else {
                  setCreatingFile(null);
                }
              }}
            />
          </div>
        )}
        
        {/* Renderiza filhos se o diretório estiver expandido */}
        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (githubService.isConfigured()) {
      loadRootFiles();
    }
  }, []);

  if (!githubService.isConfigured()) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Folder className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Configure o GitHub para ver os arquivos</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium">Explorador</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreatingFile('')}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              loadRootFiles();
              onRefresh?.();
            }}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {/* Input para criar arquivo na raiz */}
        {creatingFile === '' && (
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="w-3" />
            <File className="h-4 w-4 text-muted-foreground" />
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nome-do-arquivo.tsx"
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile('');
                } else if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile('');
                } else {
                  setCreatingFile(null);
                }
              }}
            />
          </div>
        )}
        
        {loading && files.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Carregando arquivos...</p>
          </div>
        ) : (
          files.map(node => renderFileNode(node))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;