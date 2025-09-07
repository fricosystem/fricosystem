import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Barcode } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onCodeScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'barcode-reader';
  const { toast } = useToast();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        const scannerElement = document.getElementById(scannerDivId);
        if (scannerElement && !scannerRef.current) {
          try {
            scannerRef.current = new Html5Qrcode(scannerDivId);
            startScannerInternal();
          } catch (error) {
            toast({
              title: "Erro ao inicializar scanner",
              description: "Não foi possível inicializar o scanner de código de barras.",
              variant: "destructive"
            });
          }
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        stopScannerSafely();
      };
    }
  }, [isOpen]);

  const stopScannerSafely = () => {
    if (scannerRef.current) {
      try {
        if (isScanning) {
          scannerRef.current.stop()
            .then(() => setIsScanning(false))
            .catch(() => setIsScanning(false));
        }
        if (!isOpen) scannerRef.current = null;
      } catch (err) {
        setIsScanning(false);
      }
    }
  };

  const startScannerInternal = () => {
    if (!scannerRef.current || isScanning) return;

    const codeSuccessCallback = (decodedText: string) => {
      stopScannerSafely();
      onCodeScanned(decodedText);
      onClose();
    };

    const config = { 
      fps: 10, 
      qrbox: isMobile ? { width: 250, height: 150 } : { width: 300, height: 180 },
      formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8] // Suporte para diversos formatos de código de barras
    };

    scannerRef.current.start(
      { facingMode: "environment" },
      config,
      codeSuccessCallback,
      undefined
    )
    .then(() => setIsScanning(true))
    .catch((err) => {
      console.error('Error starting barcode scanner:', err);
      toast({
        title: "Erro ao iniciar câmera",
        description: "Verifique se você permitiu o acesso à câmera.",
        variant: "destructive"
      });
    });
  };

  const startScanner = () => {
    if (!scannerRef.current) {
      toast({
        title: "Erro",
        description: "Scanner não inicializado corretamente.",
        variant: "destructive"
      });
      return;
    }
    startScannerInternal();
  };

  const stopScanner = () => {
    stopScannerSafely();
  };

  const handleClose = () => {
    stopScannerSafely();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMobile ? <Smartphone className="h-5 w-5" /> : <Barcode className="h-5 w-5" />}
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Posicione o código de barras (GTIN/EAN) dentro da área destacada
            </p>
          </div>
          
          <div className="relative">
            <div 
              id={scannerDivId} 
              className={`w-full ${isMobile ? 'h-[50vh]' : 'h-80'} bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20`}
            ></div>
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="text-center space-y-3">
                  <Barcode className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para iniciar o scanner
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-3">
            {!isScanning ? (
              <Button 
                onClick={startScanner}
                className="flex items-center gap-2 px-6"
                size="lg"
              >
                {isMobile ? <Smartphone className="h-5 w-5" /> : <Barcode className="h-5 w-5" />}
                Iniciar Scanner
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={stopScanner}
                className="flex items-center gap-2 px-6"
                size="lg"
              >
                Parar Scanner
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;