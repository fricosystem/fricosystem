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

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onCodeScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';
  const { toast } = useToast();

  // Initialize scanner only when the dialog is open and the element exists
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const scannerElement = document.getElementById(scannerDivId);
        if (scannerElement && !qrScannerRef.current) {
          try {
            qrScannerRef.current = new Html5Qrcode(scannerDivId);
            
            // Auto-start scanner when opened
            if (qrScannerRef.current) {
              startScannerInternal();
            }
          } catch (error) {
            toast({
              title: "Erro ao inicializar scanner",
              description: "Não foi possível inicializar o scanner de QR code.",
              variant: "destructive"
            });
          }
        }
      }, 300); // Small delay for DOM to be ready

      // Clean up
      return () => {
        clearTimeout(timeoutId);
        stopScannerSafely();
      };
    }
  }, [isOpen]);

  // Safe scanner stop function that checks state before stopping
  const stopScannerSafely = () => {
    if (qrScannerRef.current) {
      try {
        // Only attempt to stop if currently scanning
        if (isScanning) {
          qrScannerRef.current.stop()
            .then(() => {
              setIsScanning(false);
            })
            .catch(error => {
              // Still update the state even if there was an error
              setIsScanning(false);
            });
        }
        
        // Clear the reference when dialog closes
        if (!isOpen) {
          qrScannerRef.current = null;
        }
      } catch (err) {
        setIsScanning(false);
      }
    }
  };

  // Internal function to start scanner (for auto-start)
  const startScannerInternal = () => {
    if (!qrScannerRef.current || isScanning) {
      return;
    }

    const qrCodeSuccessCallback = (decodedText: string) => {
      // Stop scanning after successfully finding a QR code
      stopScannerSafely();
      onCodeScanned(decodedText);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    qrScannerRef.current
      .start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error('Error starting scanner:', err);
        toast({
          title: "Erro ao iniciar câmera",
          description: "Verifique se você permitiu o acesso à câmera.",
          variant: "destructive"
        });
      });
  };

  // Public function to start scanner (for button)
  const startScanner = () => {
    if (!qrScannerRef.current) {
      console.error("QR Scanner not initialized");
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

  // Handle closing the dialog
  const handleClose = () => {
    stopScannerSafely();
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* The scanner div must exist when initializing the scanner */}
          <div id={scannerDivId} className="w-full h-64 bg-muted rounded-md overflow-hidden"></div>
          
          <div className="flex space-x-2 w-full justify-center">
            {!isScanning ? (
              <Button onClick={startScanner}>Iniciar Scanner</Button>
            ) : (
              <Button variant="outline" onClick={stopScanner}>Parar Scanner</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;