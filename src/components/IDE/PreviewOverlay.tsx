import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MousePointer2, Eye, EyeOff, Upload, Wand2, Maximize2, Copy, Trash2 } from 'lucide-react';

interface PreviewOverlayProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onMessage: (event: MessageEvent) => void;
  stagedChanges: Array<{id: string; changes: any}>;
  onStageChange: (elementId: string, changes: any) => void;
  onCommitChanges: () => void;
  onOpenVisualEdit?: (element: any) => void;
}

const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  isEditMode,
  onToggleEditMode,
  onMessage,
  stagedChanges,
  onStageChange,
  onCommitChanges,
  onOpenVisualEdit
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    show: boolean;
    x: number;
    y: number;
    element: any;
  } | null>(null);

  useEffect(() => {
    // Handler customizado para mensagens do iframe
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOW_CONTEXT_MENU') {
        setContextMenu({
          show: true,
          x: event.data.position.x,
          y: event.data.position.y,
          element: event.data.element
        });
      } else if (event.data.type === 'STAGE_CHANGES') {
        onStageChange(event.data.elementId, event.data.changes);
      }
      
      // Chama o handler original
      onMessage(event);
    };
    
    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [onMessage, onStageChange]);

  useEffect(() => {
    // Injeta scripts no iframe quando o modo de edição é ativado
    if (isEditMode) {
      const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        injectEditingScripts(iframe.contentDocument);
        
        // Previne navegação não intencional no iframe
        iframe.contentWindow?.addEventListener('beforeunload', (e) => {
          if (isEditMode) {
            e.preventDefault();
            e.returnValue = '';
          }
        });
      }
    } else {
      // Fecha o menu de contexto quando sair do modo de edição
      setContextMenu(null);
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
        let resizeHandles = null;
        let isResizing = false;
        let resizeStartPos = { x: 0, y: 0 };
        let resizeStartSize = { width: 0, height: 0 };
        let currentResizeHandle = null;
        let isEditingText = false;
        let originalTextContent = '';
        
        // Previne navegação enquanto está editando
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        
        window.history.pushState = function(...args) {
          console.log('Navegação prevenida - modo edição ativo');
          return;
        };
        
        window.history.replaceState = function(...args) {
          console.log('Navegação prevenida - modo edição ativo');
          return;
        };
        
        // Intercepta cliques em links
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link && link.href && !link.target) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clique em link prevenido - modo edição ativo');
            return false;
          }
        }, true);

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

        function createResizeHandles() {
          if (resizeHandles) return resizeHandles;
          
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.zIndex = '10001';
          container.style.pointerEvents = 'none';
          
          const positions = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
          positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle-' + pos;
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.backgroundColor = '#3b82f6';
            handle.style.border = '2px solid white';
            handle.style.borderRadius = '50%';
            handle.style.pointerEvents = 'auto';
            handle.style.cursor = pos.includes('n') || pos.includes('s') ? 
              (pos.includes('e') || pos.includes('w') ? pos + '-resize' : 'ns-resize') :
              'ew-resize';
            
            if (pos === 'nw') { handle.style.top = '-5px'; handle.style.left = '-5px'; }
            else if (pos === 'ne') { handle.style.top = '-5px'; handle.style.right = '-5px'; }
            else if (pos === 'sw') { handle.style.bottom = '-5px'; handle.style.left = '-5px'; }
            else if (pos === 'se') { handle.style.bottom = '-5px'; handle.style.right = '-5px'; }
            else if (pos === 'n') { handle.style.top = '-5px'; handle.style.left = '50%'; handle.style.transform = 'translateX(-50%)'; }
            else if (pos === 's') { handle.style.bottom = '-5px'; handle.style.left = '50%'; handle.style.transform = 'translateX(-50%)'; }
            else if (pos === 'e') { handle.style.right = '-5px'; handle.style.top = '50%'; handle.style.transform = 'translateY(-50%)'; }
            else if (pos === 'w') { handle.style.left = '-5px'; handle.style.top = '50%'; handle.style.transform = 'translateY(-50%)'; }
            
            handle.addEventListener('mousedown', (e) => startResize(e, pos));
            container.appendChild(handle);
          });
          
          document.body.appendChild(container);
          resizeHandles = container;
          return container;
        }

        function updateHighlight(element) {
          if (!overlay) return;
          
          const rect = element.getBoundingClientRect();
          overlay.style.left = rect.left + window.scrollX + 'px';
          overlay.style.top = rect.top + window.scrollY + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
          overlay.style.display = 'block';
          
          if (resizeHandles && !isEditingText) {
            resizeHandles.style.left = rect.left + window.scrollX + 'px';
            resizeHandles.style.top = rect.top + window.scrollY + 'px';
            resizeHandles.style.width = rect.width + 'px';
            resizeHandles.style.height = rect.height + 'px';
            resizeHandles.style.display = 'block';
          }
        }

        function hideHighlight() {
          if (overlay) {
            overlay.style.display = 'none';
          }
          if (resizeHandles) {
            resizeHandles.style.display = 'none';
          }
        }

        function startResize(e, handle) {
          e.preventDefault();
          e.stopPropagation();
          
          if (!highlightedElement) return;
          
          isResizing = true;
          currentResizeHandle = handle;
          resizeStartPos = { x: e.clientX, y: e.clientY };
          const rect = highlightedElement.getBoundingClientRect();
          resizeStartSize = { width: rect.width, height: rect.height };
          
          document.body.style.userSelect = 'none';
        }

        function handleResize(e) {
          if (!isResizing || !highlightedElement) return;
          
          const deltaX = e.clientX - resizeStartPos.x;
          const deltaY = e.clientY - resizeStartPos.y;
          
          let newWidth = resizeStartSize.width;
          let newHeight = resizeStartSize.height;
          
          if (currentResizeHandle.includes('e')) newWidth += deltaX;
          if (currentResizeHandle.includes('w')) newWidth -= deltaX;
          if (currentResizeHandle.includes('s')) newHeight += deltaY;
          if (currentResizeHandle.includes('n')) newHeight -= deltaY;
          
          highlightedElement.style.width = Math.max(20, newWidth) + 'px';
          highlightedElement.style.height = Math.max(20, newHeight) + 'px';
          
          updateHighlight(highlightedElement);
        }

        function endResize(e) {
          if (!isResizing || !highlightedElement) return;
          
          isResizing = false;
          document.body.style.userSelect = '';
          
          const rect = highlightedElement.getBoundingClientRect();
          const changes = {
            styles: {
              width: rect.width + 'px',
              height: rect.height + 'px'
            }
          };
          
          window.parent.postMessage({
            type: 'STAGE_CHANGES',
            elementId: highlightedElement.id || generateElementId(highlightedElement),
            changes
          }, '*');
        }

        function startTextEdit(element) {
          if (isEditingText) return;
          
          isEditingText = true;
          originalTextContent = element.textContent || '';
          element.contentEditable = 'true';
          element.focus();
          
          element.style.outline = '2px solid #3b82f6';
          element.style.outlineOffset = '2px';
          
          if (resizeHandles) {
            resizeHandles.style.display = 'none';
          }
        }

        function endTextEdit(element, save = true) {
          if (!isEditingText) return;
          
          isEditingText = false;
          element.contentEditable = 'false';
          element.style.outline = '';
          element.style.outlineOffset = '';
          
          if (save && element.textContent !== originalTextContent) {
            const changes = {
              text: element.textContent
            };
            
            window.parent.postMessage({
              type: 'STAGE_CHANGES',
              elementId: element.id || generateElementId(element),
              changes
            }, '*');
          } else if (!save) {
            element.textContent = originalTextContent;
          }
        }

        function isEditableElement(element) {
          const editableTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'IMG', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'MAIN', 'LABEL', 'INPUT', 'TEXTAREA', 'SELECT', 'LI', 'UL', 'OL'];
          return editableTags.includes(element.tagName) && 
                 !element.closest('script') && 
                 !element.closest('style') &&
                 !element.closest('iframe') &&
                 element.offsetParent !== null;
        }

        function handleMouseOver(e) {
          if (isResizing || isEditingText) return;
          e.stopPropagation();
          const element = e.target;
          
          if (isEditableElement(element) && element !== highlightedElement) {
            highlightedElement = element;
            updateHighlight(element);
          }
        }

        function handleMouseOut(e) {
          if (isResizing || isEditingText) return;
          hideHighlight();
          highlightedElement = null;
        }

        function handleClick(e) {
          if (isResizing) return;
          
          if (isEditingText && e.target.contentEditable !== 'true') {
            const editableElement = document.querySelector('[contenteditable="true"]');
            if (editableElement) {
              endTextEdit(editableElement, true);
            }
            return;
          }
          
          const element = e.target;
          const isNavElement = element.tagName === 'A' || element.closest('a') || 
                               (element.tagName === 'BUTTON' && element.closest('nav, header, [data-nav]'));
          
          if (!isNavElement && isEditableElement(element)) {
            e.preventDefault();
            e.stopPropagation();
            
            // Envia mensagem para abrir o menu de contexto
            const rect = element.getBoundingClientRect();
            const elementId = element.id || generateElementId(element);
            if (!element.id) {
              element.setAttribute('data-element-id', elementId);
            }
            
            window.parent.postMessage({
              type: 'SHOW_CONTEXT_MENU',
              elementId,
              position: { x: e.clientX, y: e.clientY },
              element: {
                id: elementId,
                tagName: element.tagName,
                textContent: element.textContent,
                className: element.className,
                rect: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  right: rect.right,
                  bottom: rect.bottom,
                  left: rect.left
                }
              }
            }, '*');
          }
        }

        function handleDoubleClick(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const element = e.target;
          if (isEditableElement(element) && hasTextContent(element)) {
            startTextEdit(element);
          }
        }

        function hasTextContent(element) {
          const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LABEL', 'LI'];
          return textTags.includes(element.tagName) && element.textContent && element.textContent.trim().length > 0;
        }

        function handleKeyDown(e) {
          if (isEditingText && e.key === 'Escape') {
            const editableElement = document.querySelector('[contenteditable="true"]');
            if (editableElement) {
              endTextEdit(editableElement, false);
            }
          }
        }

        function generateElementId(element) {
          return 'element-' + Math.random().toString(36).substr(2, 9);
        }

        // Adiciona listeners
        createHighlightOverlay();
        createResizeHandles();
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
        document.addEventListener('keydown', handleKeyDown);

        // Listener para aplicar mudanças
        window.addEventListener('message', function(event) {
          if (event.data.type === 'APPLY_CHANGES') {
            const { elementId, changes } = event.data;
            
            // Busca o elemento por ID ou por atributo gerado
            let element = null;
            if (elementId.startsWith('element-')) {
              // ID gerado - busca por data-attribute ou usa o elemento atual em destaque
              element = highlightedElement;
              if (element && !element.id) {
                element.setAttribute('data-element-id', elementId);
              }
            } else {
              element = document.getElementById(elementId) || 
                       document.querySelector(\`[data-element-id="\${elementId}"]\`);
            }
            
            if (element) {
              // Aplica mudanças de texto (preserva elementos filhos se existirem)
              if (changes.text !== undefined && changes.text !== element.textContent) {
                const hasChildElements = element.children.length > 0;
                if (!hasChildElements) {
                  element.textContent = changes.text;
                } else {
                  // Se tem elementos filhos, atualiza apenas os text nodes diretos
                  const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === 3);
                  if (textNodes.length > 0) {
                    textNodes[0].textContent = changes.text;
                  }
                }
              }
              
              // Aplica mudanças de estilo
              if (changes.styles) {
                Object.entries(changes.styles).forEach(([prop, value]) => {
                  element.style.setProperty(prop, value);
                });
              }

              // Adiciona uma animação suave ao aplicar mudanças
              element.style.transition = 'all 0.3s ease';
              
              // Remove a transição após a animação
              setTimeout(() => {
                element.style.transition = '';
              }, 300);
              
              // Feedback visual
              element.style.outline = '3px solid #10b981';
              setTimeout(() => {
                element.style.outline = '';
              }, 1000);
            }
          }
        });

        // Cleanup function
        window.visualEditorCleanup = function() {
          // Restaura métodos originais do history
          window.history.pushState = originalPushState;
          window.history.replaceState = originalReplaceState;
          
          document.removeEventListener('mouseover', handleMouseOver, true);
          document.removeEventListener('mouseout', handleMouseOut, true);
          document.removeEventListener('click', handleClick, true);
          document.removeEventListener('dblclick', handleDoubleClick, true);
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', endResize);
          document.removeEventListener('keydown', handleKeyDown);
          if (overlay) {
            overlay.remove();
            overlay = null;
          }
          if (resizeHandles) {
            resizeHandles.remove();
            resizeHandles = null;
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

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu?.element) return;
    
    const iframe = document.querySelector('iframe[title="Elementor"]') as HTMLIFrameElement;
    
    switch (action) {
      case 'customize':
        // Abre o modal de edição visual
        if (onOpenVisualEdit) {
          onOpenVisualEdit(contextMenu.element);
        }
        break;
        
      case 'resize':
        // Mantém o elemento selecionado para redimensionamento
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'ENABLE_RESIZE_MODE',
            elementId: contextMenu.element.id
          }, '*');
        }
        break;
        
      case 'duplicate':
        // Duplica o elemento
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'DUPLICATE_ELEMENT',
            elementId: contextMenu.element.id
          }, '*');
        }
        break;
        
      case 'delete':
        // Exclui o elemento
        if (confirm('Tem certeza que deseja excluir este elemento?')) {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'DELETE_ELEMENT',
              elementId: contextMenu.element.id
            }, '*');
          }
        }
        break;
    }
    
    setContextMenu(null);
  };

  const handleCommit = () => {
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    onCommitChanges();
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
      <Button
        onClick={handleToggle}
        variant={isEditMode ? "destructive" : "default"}
        size="sm"
        className="flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
      >
        {isEditMode ? (
          <>
            <EyeOff className="h-4 w-4" />
            <span className="hidden sm:inline">Sair do Modo Edição</span>
          </>
        ) : (
          <>
            <MousePointer2 className="h-4 w-4" />
            <span className="hidden sm:inline">Modo Edição Visual</span>
          </>
        )}
      </Button>
      
      {isEditMode && stagedChanges.length > 0 && (
        <Button
          onClick={handleCommit}
          variant="default"
          size="sm"
          className="flex items-center gap-2 shadow-lg hover:scale-105 transition-transform bg-green-600 hover:bg-green-700 animate-fade-in"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Enviar {stagedChanges.length} alteração(ões)</span>
          <span className="sm:hidden">{stagedChanges.length}</span>
        </Button>
      )}
      
      {isEditMode && (
        <div className="animate-fade-in mt-2 p-3 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-xs text-muted-foreground max-w-[240px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-foreground">Editor Visual Ativo</span>
          </div>
          <p className="mb-2">
            Edite elementos diretamente na página:
          </p>
          <ul className="space-y-1 text-[10px]">
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> <strong>Duplo clique</strong> em textos para editar
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> <strong>Arraste bordas</strong> para redimensionar
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> <strong>ESC</strong> cancela edição de texto
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> Clique <strong>Enviar</strong> para salvar no GitHub
            </li>
          </ul>
          {stagedChanges.length > 0 && (
            <div className="mt-2 pt-2 border-t text-[10px] text-green-600 dark:text-green-400 font-medium">
              ✓ {stagedChanges.length} alteração(ões) preparada(s)
            </div>
          )}
        </div>
      )}
      
      {/* Menu de Contexto */}
      {contextMenu?.show && (
        <>
          {/* Overlay transparente para fechar o menu ao clicar fora */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setContextMenu(null)}
          />
          
          {/* Menu de contexto */}
          <div
            className="fixed z-[9999] bg-background border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <div className="py-1">
              <button
                onClick={() => handleContextMenuAction('customize')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                Personalizar
              </button>
              
              <button
                onClick={() => handleContextMenuAction('resize')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
                Proporção
              </button>
              
              <div className="border-t border-border my-1" />
              
              <button
                onClick={() => handleContextMenuAction('duplicate')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </button>
              
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PreviewOverlay;