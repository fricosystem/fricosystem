import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize, Minimize } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  const contentRef = useRef<HTMLDivElement>(null);

  const totalPages = imagens?.length || 0;

  // Reset state when images change
  useEffect(() => {
    setCurrentPage(1);
    setScale(1);
  }, [imagens]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = async () => {
    if (!contentRef.current) return;

    if (!document.fullscreenElement) {
      await contentRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 overflow-hidden [&>button]:hidden"
      >
        <VisuallyHidden>
          <DialogTitle>{titulo}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold truncate flex-1 pr-4">
            {titulo}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} title="Diminuir zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={zoomIn} title="Aumentar zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen} title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={onClose} title="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Viewer */}
        <div className="flex-1 overflow-auto bg-muted/50 flex justify-center items-center" style={{ height: "calc(95vh - 140px)" }}>
          {totalPages > 0 ? (
            <img
              src={imagens[currentPage - 1]}
              alt={`Página ${currentPage} de ${totalPages}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhuma imagem disponível</p>
            </div>
          )}
        </div>

        {/* Footer - Page Navigation */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-4 p-3 border-t bg-background">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManuaisViewerModal;
