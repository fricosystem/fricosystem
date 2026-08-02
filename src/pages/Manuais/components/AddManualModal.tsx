import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
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

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

const AddManualModal = ({ isOpen, onClose, onSuccess }: AddManualModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();

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

    const newPreviews: ImagePreview[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) {
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

    const newPreviews = [...imagePreviews];
    const draggedItem = newPreviews[draggedIndex];
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(index, 0, draggedItem);
    setImagePreviews(newPreviews);
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
    if (!titulo.trim() || !subtitulo.trim() || imagePreviews.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e adicione pelo menos uma imagem",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload all images in order
      const imageUrls: string[] = [];
      for (const imagePreview of imagePreviews) {
        const url = await uploadImageToCloudinary(imagePreview.file);
        imageUrls.push(url);
      }

      // Upload capa if exists
      let capaUrl = "";
      if (capaFile) {
        capaUrl = await uploadImageToCloudinary(capaFile);
      }

      // Save to Firestore
      await addDoc(collection(db, "pdf_manuais"), {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        imagens: imageUrls,
        capaUrl,
        ativo: true,
        dataCriacao: new Date().toISOString(),
      });

      toast({
        description: "Manual adicionado com sucesso!",
      });

      // Clean up object URLs
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview));

      // Reset form
      setTitulo("");
      setSubtitulo("");
      setImagePreviews([]);
      setCapaFile(null);
      setCapaPreview("");
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao adicionar manual:", err);
      toast({
        title: "Erro",
        description: "Falha ao adicionar manual. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview));
      setTitulo("");
      setSubtitulo("");
      setImagePreviews([]);
      setCapaFile(null);
      setCapaPreview("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Nome da empresa ou título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitulo">Subtítulo *</Label>
            <Input
              id="subtitulo"
              placeholder="Nome do manual"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagens do Manual * (arraste para reordenar)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative group aspect-square bg-muted rounded overflow-hidden cursor-move ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <img
                        src={preview.preview}
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
                          onClick={() => removeImage(preview.id)}
                          disabled={isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <label className="cursor-pointer block text-center">
                <div className="flex flex-col items-center gap-2 py-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {imagePreviews.length > 0
                      ? "Clique para adicionar mais imagens"
                      : "Clique para selecionar imagens"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Você pode selecionar múltiplas imagens de uma vez
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
            {imagePreviews.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {imagePreviews.length} imagem(ns) selecionada(s)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagem de Capa (opcional)</Label>
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
                  Enviando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualModal;
