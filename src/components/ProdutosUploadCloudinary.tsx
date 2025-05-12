// Componente ImageUpload para o modal de produtos
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2, X } from 'lucide-react';
import { uploadImageToCloudinary, getOptimizedImageUrl } from '@/Cloudinary/cloudinaryUploadProdutos';

interface ProductImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

const ProductImageUpload = ({ onImageUploaded, currentImageUrl, className }: ProductImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Create a preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file);
      
      // Call the callback with the image URL
      onImageUploaded(imageUrl);
    } catch (error: any) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (isCapturing) {
        // Stop capturing
        stopCamera();
        return;
      }

      setIsCapturing(true);
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      setStream(mediaStream);
      
      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const takePhoto = async () => {
    if (!videoRef.current || !stream) return;
    
    try {
      setIsUploading(true);
      
      // Create a canvas to capture the photo
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to a blob
        const blob = await new Promise<Blob>(resolve => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.95);
        });
        
        // Create a File from the blob
        const file = new File([blob], `product-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Create a preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        
        // Upload to Cloudinary
        const imageUrl = await uploadImageToCloudinary(file);
        
        // Call the callback with the image URL
        onImageUploaded(imageUrl);
        
        // Stop the camera
        stopCamera();
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onImageUploaded('');
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {isCapturing ? (
        <div className="relative border rounded-md overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            <Button 
              type="button"
              variant="secondary"
              size="sm"
              onClick={stopCamera}
            >
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button 
              type="button"
              variant="default"
              size="sm"
              onClick={takePhoto}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
              Capturar
            </Button>
          </div>
        </div>
      ) : (
        <>
          {preview ? (
            <div className="relative border rounded-md p-2 w-full">
              <img
                src={preview}
                alt="Preview"
                className="h-48 w-full object-contain"
              />
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full"> {/* Container ocupando 100% da largura */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCameraCapture}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Abrir Câmera
            </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductImageUpload;