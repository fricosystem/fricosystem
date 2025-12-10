import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { uploadPdfToCloudinary } from "@/Cloudinary/cloudinaryUploadManuais";
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
import { Loader2, Upload, FileText, X } from "lucide-react";

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddManualModal = ({ isOpen, onClose, onSuccess }: AddManualModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido",
        variant: "destructive",
      });
    }
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

  const handleSubmit = async () => {
    if (!titulo.trim() || !subtitulo.trim() || !pdfFile) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e selecione um PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload PDF to Cloudinary
      const pdfUrl = await uploadPdfToCloudinary(pdfFile);

      // Upload capa if exists
      let capaUrl = "";
      if (capaFile) {
        const formData = new FormData();
        formData.append("file", capaFile);
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
        if (response.ok) {
          capaUrl = data.secure_url;
        }
      }

      // Save to Firestore
      await addDoc(collection(db, "pdf_manuais"), {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        pdfUrl,
        capaUrl,
        ativo: true,
        dataCriacao: new Date().toISOString(),
      });

      toast({
        description: "Manual adicionado com sucesso!",
      });

      // Reset form
      setTitulo("");
      setSubtitulo("");
      setPdfFile(null);
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
      setTitulo("");
      setSubtitulo("");
      setPdfFile(null);
      setCapaFile(null);
      setCapaPreview("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
            <Label>PDF do Manual *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {pdfFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">{pdfFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPdfFile(null)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar o PDF
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
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
                    <Upload className="h-8 w-8 text-muted-foreground" />
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
