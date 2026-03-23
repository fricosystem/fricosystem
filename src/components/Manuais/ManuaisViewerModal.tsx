import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize, Minimize, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";

interface ManuaisViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagens: string[];
  titulo: string;
}

const ManuaisViewerModal = ({ isOpen, onClose, imagens, titulo }: ManuaisViewerModalProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [forceLandscape, setForceLandscape] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const totalPages = imagens?.length || 0;

  // Reset state when images change
  useEffect(() => {
    setCurrentPage(1);
    setScale(1);
  }, [imagens]);

  // Force landscape orientation on mobile when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset to portrait when closing
      if (isMobile && forceLandscape) {
        try {
          screen.orientation?.unlock?.();
        } catch {
          // Orientation API not supported
        }
      }
      setForceLandscape(false);
      return;
    }

    // Auto-enable landscape on mobile when opening
    if (isMobile && isOpen) {
      setForceLandscape(true);
      try {
        screen.orientation?.lock?.('landscape').catch(() => {
          // Orientation lock not supported or denied
        });
      } catch {
        // Orientation API not supported
      }
    }
  }, [isOpen, isMobile]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const toggleFullscreen = async () => {
    if (!contentRef.current) return;

    if (!document.fullscreenElement) {
      await contentRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const toggleLandscape = () => {
    if (forceLandscape) {
      try {
        screen.orientation?.unlock?.();
      } catch {
        // Orientation API not supported
      }
      setForceLandscape(false);
    } else {
      try {
        screen.orientation?.lock?.('landscape').catch(() => {});
      } catch {
        // Orientation API not supported
      }
      setForceLandscape(true);
    }
  };

  // Touch/swipe support for mobile
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      goToNextPage();
    } else if (diff < -threshold) {
      goToPrevPage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        className={`
          p-0 overflow-hidden [&>button]:hidden flex flex-col
          ${isMobile 
            ? 'fixed inset-0 max-w-none max-h-none w-screen h-screen rounded-none border-0' 
            : 'max-w-[95vw] max-h-[95vh] w-full h-[90vh]'
          }
          ${forceLandscape ? 'landscape-mode' : ''}
        `}
        style={isMobile && forceLandscape ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          transform: 'none',
          borderRadius: 0,
        } : undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{titulo}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className={`
          flex items-center justify-between border-b bg-background shrink-0
          ${isMobile ? 'p-2 gap-1' : 'p-3 gap-2'}
        `}>
          <h2 className={`font-semibold truncate flex-1 ${isMobile ? 'text-sm pr-2' : 'text-lg pr-4'}`}>
            {titulo}
          </h2>
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            {/* Zoom controls - hidden on very small screens, show zoom % */}
            <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={zoomOut} 
                title="Diminuir zoom"
                className={isMobile ? 'h-8 w-8' : ''}
              >
                <ZoomOut className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetZoom} 
                title="Resetar zoom"
                className={`${isMobile ? 'h-8 px-1 text-xs min-w-[40px]' : 'min-w-[50px]'}`}
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={zoomIn} 
                title="Aumentar zoom"
                className={isMobile ? 'h-8 w-8' : ''}
              >
                <ZoomIn className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
              </Button>
            </div>

            {/* Landscape toggle for mobile */}
            {isMobile && (
              <Button 
                variant={forceLandscape ? "default" : "outline"} 
                size="icon" 
                onClick={toggleLandscape} 
                title={forceLandscape ? "Modo retrato" : "Modo paisagem"}
                className="h-8 w-8"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}

            {/* Fullscreen - only on desktop */}
            {!isMobile && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleFullscreen} 
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            )}

            <Button 
              variant="outline" 
              size="icon" 
              onClick={onClose} 
              title="Fechar"
              className={isMobile ? 'h-8 w-8' : ''}
            >
              <X className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </div>
        </div>

        {/* Image Viewer */}
        <div 
          className="flex-1 overflow-auto bg-muted/50 flex justify-center items-center touch-pan-x touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {totalPages > 0 ? (
            <img
              src={imagens[currentPage - 1]}
              alt={`Pagina ${currentPage} de ${totalPages}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{ transform: `scale(${scale})` }}
              draggable={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhuma imagem disponivel</p>
            </div>
          )}
        </div>

        {/* Footer - Page Navigation */}
        {totalPages > 0 && (
          <div className={`
            flex items-center justify-center border-t bg-background shrink-0
            ${isMobile ? 'gap-2 p-2' : 'gap-4 p-3'}
          `}>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={isMobile ? 'h-10 w-10' : ''}
            >
              <ChevronLeft className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
            </Button>
            <span className={`${isMobile ? 'text-sm min-w-[80px]' : 'text-sm'} text-center`}>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className={isMobile ? 'h-10 w-10' : ''}
            >
              <ChevronRight className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManuaisViewerModal;
