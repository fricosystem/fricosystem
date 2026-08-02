import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload } from 'lucide-react';

interface SaveConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fileName: string;
}

const SaveConfirmationDialog: React.FC<SaveConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  fileName,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>Confirmar salvamento</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Tem certeza que deseja salvar o arquivo <strong className="text-foreground">{fileName}</strong> no GitHub?
            <br />
            <span className="text-muted-foreground text-xs mt-2 block">
              Esta ação irá criar um novo commit no repositório.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            Sim, salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SaveConfirmationDialog;
