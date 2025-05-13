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
import { Smartphone, QrCode } from 'lucide-react'; // Added mobile-specific icons

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onCodeScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Added mobile detection
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';
  const { toast } = useToast();

  // Check if mobile device on mount
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        const scannerElement = document.getElementById(scannerDivId);
        if (scannerElement && !qrScannerRef.current) {
          try {
            qrScannerRef.current = new Html5Qrcode(scannerDivId);
            startScannerInternal();
          } catch (error) {
            toast({
              title: "Erro ao inicializar scanner",
              description: "Não foi possível inicializar o scanner de QR code.",
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
    if (qrScannerRef.current) {
      try {
        if (isScanning) {
          qrScannerRef.current.stop()
            .then(() => setIsScanning(false))
            .catch(() => setIsScanning(false));
        }
        if (!isOpen) qrScannerRef.current = null;
      } catch (err) {
        setIsScanning(false);
      }
    }
  };

  const startScannerInternal = () => {
    if (!qrScannerRef.current || isScanning) return;

    const qrCodeSuccessCallback = (decodedText: string) => {
      stopScannerSafely();
      onCodeScanned(decodedText);
      onClose();
    };

    const config = { 
      fps: 10, 
      qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 } // Adjusted for mobile
    };

    qrScannerRef.current.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      undefined
    )
    .then(() => setIsScanning(true))
    .catch((err) => {
      console.error('Error starting scanner:', err);
      toast({
        title: "Erro ao iniciar câmera",
        description: "Verifique se você permitiu o acesso à câmera.",
        variant: "destructive"
      });
    });
  };

  const startScanner = () => {
    if (!qrScannerRef.current) {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMobile ? <Smartphone className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
            Escanear QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div 
            id={scannerDivId} 
            className={`w-full ${isMobile ? 'h-[60vh]' : 'h-64'} bg-muted rounded-md overflow-hidden`}
          ></div>
          
          <div className="flex space-x-2 w-full justify-center">
            {!isScanning ? (
              <Button 
                onClick={startScanner}
                className="flex items-center gap-2"
              >
                {isMobile ? <Smartphone className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                Iniciar Scanner
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={stopScanner}
                className="flex items-center gap-2"
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

export default QrScanner;