import { useState, useCallback } from 'react';
import { githubService } from '@/services/githubService';
import { useToast } from '@/hooks/use-toast';

interface SelectedElement {
  id: string;
  tagName: string;
  textContent?: string;
  styles: Record<string, string>; // Mudança: agora é um objeto plain, não CSSStyleDeclaration
  className?: string;
  rect: DOMRect;
}

interface ElementChanges {
  text?: string;
  styles: Record<string, string>;
  className?: string;
}

export const useVisualEditor = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stagedChanges, setStagedChanges] = useState<Array<{id: string; changes: ElementChanges}>>([]);
  const { toast } = useToast();

  const enableEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const disableEditMode = useCallback(() => {
    setIsEditMode(false);
    setSelectedElement(null);
    setIsModalOpen(false);
  }, []);

  const selectElement = useCallback((element: SelectedElement) => {
    setSelectedElement(element);
    setIsModalOpen(true);
  }, []);

  const stageChanges = useCallback((elementId: string, changes: ElementChanges) => {
    setStagedChanges(prev => {
      const existing = prev.findIndex(c => c.id === elementId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { id: elementId, changes };
        return updated;
      }
      return [...prev, { id: elementId, changes }];
    });
  }, []);

  const clearStagedChanges = useCallback(() => {
    setStagedChanges([]);
  }, []);

  const applyChanges = useCallback(async (changes: ElementChanges) => {
    if (!selectedElement) return;

    try {
      // Aplicar mudanças via postMessage para o iframe
      const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'APPLY_CHANGES',
          elementId: selectedElement.id,
          changes
        }, '*');
        
        // Adiciona as alterações ao staging
        stageChanges(selectedElement.id, changes);
      }

      toast({
        title: "Alterações aplicadas",
        description: "As mudanças foram aplicadas ao elemento. Use 'Enviar' para salvar.",
      });

      setIsModalOpen(false);
      
    } catch (error) {
      console.error('Erro ao aplicar alterações:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao aplicar as alterações.",
        variant: "destructive",
      });
    }
  }, [selectedElement, toast, stageChanges]);

  const parseElementFromMessage = useCallback((data: any): SelectedElement | null => {
    try {
      return {
        id: data.id,
        tagName: data.tagName,
        textContent: data.textContent,
        styles: data.styles,
        className: data.className,
        rect: data.rect
      };
    } catch (error) {
      console.error('Erro ao parsing elemento:', error);
      return null;
    }
  }, []);

  // Handler para mensagens do iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === 'ELEMENT_SELECTED') {
      const element = parseElementFromMessage(event.data.element);
      if (element) {
        selectElement(element);
      }
    }
  }, [parseElementFromMessage, selectElement]);

  return {
    isEditMode,
    selectedElement,
    isModalOpen,
    stagedChanges,
    enableEditMode,
    disableEditMode,
    selectElement,
    applyChanges,
    stageChanges,
    clearStagedChanges,
    handleMessage,
    setIsModalOpen
  };
};