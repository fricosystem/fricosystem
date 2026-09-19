import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FormFornecedor from "@/components/Lenha/FormFornecedor";

interface ModalFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const ModalFornecedor = ({ isOpen, onClose, onSaveSuccess }: ModalFornecedorProps) => {
  const handleSaveSuccess = () => {
    onSaveSuccess();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-6"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">Cadastrar Fornecedor</SheetTitle>
        </SheetHeader>
        <div>
          <FormFornecedor 
            onSaveSuccess={handleSaveSuccess} 
            onCancel={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ModalFornecedor;