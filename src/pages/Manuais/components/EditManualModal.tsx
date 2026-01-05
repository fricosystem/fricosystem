import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Manual } from "@/pages/Manuais";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image, GripVertical } from "lucide-react";

interface EditManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  manual: Manual;
  onSuccess: () => void;
}

interface ImageItem {
  url: string;
  isNew: boolean;
  file?: File;
  preview?: string;
  id: string;
}

const EditManualModal = ({ isOpen, onClose, manual, onSuccess }: EditManualModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (manual) {
      setTitulo(manual.titulo);
      setSubtitulo(manual.subtitulo);
      setCapaPreview(manual.capaUrl);
      
      // Initialize existing images
      const existingImages: ImageItem[] = (manual.imagens || []).map((url, index) => ({
        url,
        isNew: false,
        id: `existing-${index}-${Date.now()}`,
      }));
      setImageItems(existingImages);
    }
  }, [manual]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      toast({
        title: "Aviso",
        description: "Alguns arquivos não são imagens válidas e foram ignorados",
        variant: "destructive",
      });
    }

    const newItems: ImageItem[] = validFiles.map((file) => ({
      url: "",
      isNew: true,
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setImageItems((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    setImageItems((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...imageItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setImageItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setCapaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCapaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "UploadProdutos");
    formData.append("cloud_name", "diomtgcvb");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/diomtgcvb/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error("Falha no upload da imagem");
    }
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !subtitulo.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (imageItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma imagem ao manual",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload new images and keep existing URLs in order
      const imageUrls: string[] = [];
      for (const item of imageItems) {
        if (item.isNew && item.file) {
          const url = await uploadImageToCloudinary(item.file);
          imageUrls.push(url);
        } else {
          imageUrls.push(item.url);
        }
      }

      const updateData: Partial<Manual> = {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        imagens: imageUrls,
      };

      // Upload new capa if selected
      if (capaFile) {
        updateData.capaUrl = await uploadImageToCloudinary(capaFile);
      }

      // Update Firestore
      const manualRef = doc(db, "pdf_manuais", manual.id);
      await updateDoc(manualRef, updateData);

      toast({
        description: "Manual atualizado com sucesso!",
      });

      // Clean up object URLs
      imageItems.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao atualizar manual:", err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar manual. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      imageItems.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      setCapaFile(null);
      onClose();
    }
  };

  const getImageSrc = (item: ImageItem) => {
    return item.isNew ? item.preview : item.url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo-edit">Título *</Label>
            <Input
              id="titulo-edit"
              placeholder="Nome da empresa ou título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitulo-edit">Subtítulo *</Label>
            <Input
              id="subtitulo-edit"
              placeholder="Nome do manual"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagens do Manual (arraste para reordenar)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {imageItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {imageItems.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative group aspect-square bg-muted rounded overflow-hidden cursor-move ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <img
                        src={getImageSrc(item)}
                        alt={`Página ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <GripVertical className="h-5 w-5 text-white absolute top-1 left-1" />
                        <span className="text-white text-xs font-medium">{index + 1}</span>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => removeImage(item.id)}
                          disabled={isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {item.isNew && (
                        <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground px-1 py-0.5 rounded text-[10px]">
                          Nova
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <label className="cursor-pointer block text-center">
                <div className="flex flex-col items-center gap-2 py-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para adicionar mais imagens
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImagesChange}
                  disabled={isUploading}
                />
              </label>
            </div>
            {imageItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {imageItems.length} imagem(ns) no total
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {capaPreview ? (
                <div className="relative inline-block">
                  <img
                    src={capaPreview}
                    alt="Preview da capa"
                    className="max-h-32 rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setCapaFile(null);
                      setCapaPreview("");
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar uma imagem
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCapaChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditManualModal;
