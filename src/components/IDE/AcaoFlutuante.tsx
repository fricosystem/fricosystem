import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Copy, 
  Scissors, 
  Trash2, 
  ClipboardPaste, 
  Undo2, 
  Redo2, 
  CheckSquare,
  ChevronLeft,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AcaoFlutuanteProps {
  fileName: string;
  isModified: boolean;
  onSave: () => void;
  onBack: () => void;
  editorRef: React.MutableRefObject<any>;
  onContentChange: (content: string) => void;
}

const AcaoFlutuante: React.FC<AcaoFlutuanteProps> = ({
  fileName,
  isModified,
  onSave,
  onBack,
  editorRef,
  onContentChange,
}) => {
  const { toast } = useToast();

  const handleSelectAll = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.setSelection(model.getFullModelRange());
        editorRef.current.focus();
        toast({ title: "Selecionado", description: "Todo o código foi selecionado" });
      }
    }
  };

  const handleCopy = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('copy');
      toast({ title: "Copiado", description: "Texto copiado para a área de transferência" });
    }
  };

  const handleCut = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('cut');
      toast({ title: "Cortado", description: "Texto cortado para a área de transferência" });
    }
  };

  const handlePaste = async () => {
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
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  const handleDeleteAll = () => {
    if (editorRef.current) {
      editorRef.current.setValue('');
      onContentChange('');
      toast({ title: "Conteúdo excluído", description: "Todo o conteúdo foi removido" });
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-2 py-1.5 gap-2">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Nome do arquivo */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-mono truncate text-muted-foreground">
            {fileName}
          </span>
          {isModified && (
            <span className="w-2 h-2 bg-warning rounded-full shrink-0 animate-pulse" />
          )}
        </div>

        {/* Botão Salvar */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={!isModified}
          className={`h-8 px-2.5 shrink-0 ${
            isModified 
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
              : 'opacity-50'
          }`}
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          Salvar
        </Button>

        {/* Menu de ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-[60]">
            <DropdownMenuItem onClick={handleSelectAll}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar tudo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCut}>
              <Scissors className="h-4 w-4 mr-2" />
              Cortar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Colar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Desfazer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRedo}>
              <Redo2 className="h-4 w-4 mr-2" />
              Refazer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir tudo
                </DropdownMenuItem>
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
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AcaoFlutuante;