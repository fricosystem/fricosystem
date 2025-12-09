import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadPdfToCloudinary } from "@/Cloudinary/cloudinaryUploadManuais";
import { db } from "@/firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface ManualUploadButtonProps {
  maquinaId: string;
  maquinaNome: string;
  onUploadSuccess: (url: string) => void;
}

const ManualUploadButton = ({ maquinaId, maquinaNome, onUploadSuccess }: ManualUploadButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são permitidos.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 50MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Cloudinary
      const pdfUrl = await uploadPdfToCloudinary(file);
      
      // Save to Firestore
      await setDoc(doc(db, "manuais_maquinas", maquinaId), {
        maquinaId,
        maquinaNome,
        pdfUrl,
        fileName: file.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Sucesso",
        description: "Manual enviado com sucesso!",
      });

      onUploadSuccess(pdfUrl);
    } catch (error) {
      console.error("Erro ao enviar manual:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o manual.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={triggerFileInput}
      disabled={isUploading}
      title="Enviar manual PDF"
      className="h-8 w-8"
    >
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ManualUploadButton;
