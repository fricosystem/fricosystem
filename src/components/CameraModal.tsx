import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Camera, Smartphone, X } from 'lucide-react';
import { uploadImageToCloudinary } from '@/Cloudinary/cloudinaryUploadPerfil';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (imageUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onPhotoTaken }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Seguindo a mesma lógica do QRScanner
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        const videoElement = videoRef.current;
        if (videoElement && !streamRef.current) {
          // Inicialização será feita pelo botão
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        stopCameraSafely();
      };
    }
  }, [isOpen]);

  const stopCameraSafely = () => {
    if (streamRef.current) {
      try {
        if (isStreaming) {
          streamRef.current.getTracks().forEach(track => track.stop());
          setIsStreaming(false);
        }
        if (!isOpen) streamRef.current = null;
      } catch (err) {
        setIsStreaming(false);
      }
    }
  };

  const startCameraInternal = async () => {
    if (!videoRef.current || isStreaming) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = mediaStream;
      videoRef.current.srcObject = mediaStream;
      
      await videoRef.current.play();
      setIsStreaming(true);
      
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Erro ao iniciar câmera",
        description: "Verifique se você permitiu o acesso à câmera.",
        variant: "destructive"
      });
    }
  };

  const startCamera = () => {
    if (!videoRef.current) {
      toast({
        title: "Erro",
        description: "Câmera não inicializada corretamente.",
        variant: "destructive"
      });
      return;
    }
    startCameraInternal();
  };

  const stopCamera = () => {
    stopCameraSafely();
  };

  const takePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      setIsUploading(true);
      
      // Create canvas to capture the photo
      const canvas = canvasRef.current || document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Could not create image blob');
        }

        try {
          // Create file from blob
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          
          // Upload to Cloudinary
          const imageUrl = await uploadImageToCloudinary(file);
          
          // Call callback with the uploaded image URL
          onPhotoTaken(imageUrl);
          
          // Close modal
          handleClose();
          
          toast({
            title: "Foto capturada",
            description: "Sua foto de perfil foi atualizada com sucesso!"
          });
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload da foto. Tente novamente.",
            variant: "destructive"
          });
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Erro ao capturar foto",
        description: "Não foi possível capturar a foto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCameraSafely();
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
            {isMobile ? <Smartphone className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            Tirar Foto de Perfil
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Posicione-se no centro da tela e clique para capturar sua foto
            </p>
          </div>
          
          <div className="relative">
            <div 
              className={`w-full ${isMobile ? 'h-[50vh]' : 'h-80'} bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isStreaming ? 'block' : 'none' }}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="text-center space-y-3">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para iniciar a câmera
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Canvas hidden for photo capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          
          <div className="flex justify-center gap-3">
            {!isStreaming ? (
              <Button 
                onClick={startCamera}
                className="flex items-center gap-2 px-6"
                size="lg"
              >
                {isMobile ? <Smartphone className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                Iniciar Câmera
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-4"
                  size="lg"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                
                <Button 
                  onClick={takePhoto}
                  className="flex items-center gap-2 px-6"
                  size="lg"
                  disabled={isUploading}
                >
                  <Camera className="h-5 w-5" />
                  {isUploading ? 'Enviando...' : 'Capturar Foto'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;