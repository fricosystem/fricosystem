import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: string;
  title?: string;
}

const PdfViewerDialog = ({ open, onOpenChange, file, title = "Document" }: PdfViewerDialogProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setPageNumber(1);
  };

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base md:text-lg">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3 flex items-center justify-between gap-2 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.1))} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => setPageNumber((p) => Math.max(1, p - 1))} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">
              {pageNumber} / {numPages || "-"}
            </span>
            <Button variant="outline" size="icon" disabled={!canNext} onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <a href={file} download className="inline-flex">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </a>
        </div>

        <div className="h-[70vh] md:h-[80vh] overflow-auto flex items-start justify-center bg-background">
          {file ? (
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} onLoadError={() => {}} loading={<div className="p-6 text-sm">Loading PDF…</div>}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          ) : (
            <div className="p-6 text-sm">No file selected</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerDialog;
