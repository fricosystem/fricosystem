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

  const applyChanges = useCallback(async (changes: ElementChanges) => {
    if (!selectedElement) return;

    try {
      // Aqui seria implementada a lógica de parsing e atualização do código
      // Por enquanto, vamos simular a aplicação das mudanças
      
      toast({
        title: "Alterações aplicadas",
        description: "As alterações foram aplicadas com sucesso.",
      });

      // Aplicar mudanças via postMessage para o iframe
      const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'APPLY_CHANGES',
          elementId: selectedElement.id,
          changes
        }, '*');
      }

      setIsModalOpen(false);
      
    } catch (error) {
      console.error('Erro ao aplicar alterações:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao aplicar as alterações.",
        variant: "destructive",
      });
    }
  }, [selectedElement, toast]);

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
    enableEditMode,
    disableEditMode,
    selectElement,
    applyChanges,
    handleMessage,
    setIsModalOpen
  };
};