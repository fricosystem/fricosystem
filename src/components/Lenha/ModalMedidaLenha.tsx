import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FormMedidaLenha from "@/components/Lenha/FormMedidaLenha";

interface ModalMedidaLenhaProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const ModalMedidaLenha = ({ isOpen, onClose, onSaveSuccess }: ModalMedidaLenhaProps) => {
  const handleSaveSuccess = () => {
    onSaveSuccess();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto p-6"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">Nova Medição de Lenha</SheetTitle>
        </SheetHeader>
        <div>
          <FormMedidaLenha 
            onSaveSuccess={handleSaveSuccess} 
            onCancel={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ModalMedidaLenha;