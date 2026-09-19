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
import { Smartphone, QrCode } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned?: (code: string) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onCodeScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const scannerDivId = 'qr-reader-parada';
  const { toast } = useToast();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (isOpen) {
      hasScannedRef.current = false;
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
    } else {
      // Reset quando fechar
      hasScannedRef.current = false;
    }
  }, [isOpen]);

  const stopScannerSafely = async () => {
    if (qrScannerRef.current) {
      try {
        const scanner = qrScannerRef.current;
        const state = scanner.getState();
        if (state === 2) { // SCANNING state
          await scanner.stop();
        }
        setIsScanning(false);
        if (!isOpen) {
          qrScannerRef.current = null;
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
        setIsScanning(false);
      }
    }
  };

  const startScannerInternal = () => {
    if (!qrScannerRef.current || isScanning || hasScannedRef.current) return;

    const qrCodeSuccessCallback = async (decodedText: string) => {
      // Previne múltiplos callbacks
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;
      
      await stopScannerSafely();
      onClose();
      // Chama o callback após fechar o modal
      setTimeout(() => {
        onCodeScanned?.(decodedText);
      }, 100);
    };

    const config = { 
      fps: 10, 
      qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 }
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMobile ? <Smartphone className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
            Escanear QR Code - Equipamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Posicione o QR Code do equipamento para auto-preencher o formulário
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
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
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
                {isMobile ? <Smartphone className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
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

export default QrScannerModal;
