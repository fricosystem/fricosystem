import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MousePointer2, Eye, EyeOff } from 'lucide-react';

interface PreviewOverlayProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onMessage: (event: MessageEvent) => void;
}

const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  isEditMode,
  onToggleEditMode,
  onMessage
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adiciona listener para mensagens do iframe
    window.addEventListener('message', onMessage);
    
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [onMessage]);

  useEffect(() => {
    // Injeta scripts no iframe quando o modo de edição é ativado
    if (isEditMode) {
      const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        injectEditingScripts(iframe.contentDocument);
      }
    }
  }, [isEditMode]);

  const injectEditingScripts = (doc: Document) => {
    // Remove scripts anteriores
    const existingScript = doc.getElementById('visual-editor-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Injeta novo script
    const script = doc.createElement('script');
    script.id = 'visual-editor-script';
    script.textContent = `
      (function() {
        let highlightedElement = null;
        let overlay = null;

        function createHighlightOverlay() {
          if (overlay) return overlay;
          
          overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.pointerEvents = 'none';
          overlay.style.border = '2px solid #3b82f6';
          overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          overlay.style.zIndex = '10000';
          overlay.style.transition = 'all 0.2s ease';
          document.body.appendChild(overlay);
          return overlay;
        }

        function updateHighlight(element) {
          if (!overlay) return;
          
          const rect = element.getBoundingClientRect();
          overlay.style.left = rect.left + window.scrollX + 'px';
          overlay.style.top = rect.top + window.scrollY + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
          overlay.style.display = 'block';
        }

        function hideHighlight() {
          if (overlay) {
            overlay.style.display = 'none';
          }
        }

        function isEditableElement(element) {
          const editableTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'IMG'];
          return editableTags.includes(element.tagName) && 
                 !element.closest('script') && 
                 !element.closest('style') &&
                 element.offsetParent !== null;
        }

        function handleMouseOver(e) {
          e.stopPropagation();
          const element = e.target;
          
          if (isEditableElement(element) && element !== highlightedElement) {
            highlightedElement = element;
            updateHighlight(element);
          }
        }

        function handleMouseOut(e) {
          hideHighlight();
          highlightedElement = null;
        }

        function handleClick(e) {
          e.preventDefault();
          e.stopPropagation();
          
          if (highlightedElement && isEditableElement(highlightedElement)) {
            const rect = highlightedElement.getBoundingClientRect();
            const computedStyles = window.getComputedStyle(highlightedElement);
            
            // Converte CSSStyleDeclaration para objeto plain
            const stylesObj = {};
            for (let i = 0; i < computedStyles.length; i++) {
              const prop = computedStyles[i];
              stylesObj[prop] = computedStyles.getPropertyValue(prop);
            }
            
            window.parent.postMessage({
              type: 'ELEMENT_SELECTED',
              element: {
                id: highlightedElement.id || generateElementId(highlightedElement),
                tagName: highlightedElement.tagName,
                textContent: highlightedElement.textContent,
                className: highlightedElement.className,
                styles: stylesObj,
                rect: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left,
                  bottom: rect.bottom,
                  right: rect.right
                }
              }
            }, '*');
          }
        }

        function generateElementId(element) {
          return 'element-' + Math.random().toString(36).substr(2, 9);
        }

        // Adiciona listeners
        createHighlightOverlay();
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);

        // Listener para aplicar mudanças
        window.addEventListener('message', function(event) {
          if (event.data.type === 'APPLY_CHANGES') {
            const { elementId, changes } = event.data;
            const element = document.getElementById(elementId) || 
                           document.querySelector(\`[data-element-id="\${elementId}"]\`);
            
            if (element) {
              // Aplica mudanças de texto
              if (changes.text !== undefined) {
                element.textContent = changes.text;
              }
              
              // Aplica mudanças de estilo
              if (changes.styles) {
                Object.assign(element.style, changes.styles);
              }
            }
          }
        });

        // Cleanup function
        window.visualEditorCleanup = function() {
          document.removeEventListener('mouseover', handleMouseOver, true);
          document.removeEventListener('mouseout', handleMouseOut, true);
          document.removeEventListener('click', handleClick, true);
          if (overlay) {
            overlay.remove();
            overlay = null;
          }
        };
      })();
    `;
    
    doc.head.appendChild(script);
  };

  const handleToggle = () => {
    if (isEditMode) {
      // Cleanup dos scripts quando sair do modo de edição
      const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          (iframe.contentWindow as any).visualEditorCleanup?.();
        } catch (error) {
          console.warn('Erro ao limpar scripts do editor:', error);
        }
      }
    }
    onToggleEditMode();
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <Button
        onClick={handleToggle}
        variant={isEditMode ? "destructive" : "default"}
        size="sm"
        className="flex items-center gap-2 shadow-lg"
      >
        {isEditMode ? (
          <>
            <EyeOff className="h-4 w-4" />
            Sair do Modo Edição
          </>
        ) : (
          <>
            <MousePointer2 className="h-4 w-4" />
            Modo Edição
          </>
        )}
      </Button>
      
      {isEditMode && (
        <div className="mt-2 p-2 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg text-xs text-muted-foreground max-w-[200px]">
          <div className="flex items-center gap-1 mb-1">
            <Eye className="h-3 w-3" />
            <span className="font-medium">Modo Edição Ativo</span>
          </div>
          <p>Clique em qualquer elemento da página para editá-lo.</p>
        </div>
      )}
    </div>
  );
};

export default PreviewOverlay;