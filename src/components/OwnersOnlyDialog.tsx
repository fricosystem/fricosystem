import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OwnersOnlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OwnersOnlyDialog = ({ open, onOpenChange }: OwnersOnlyDialogProps) => {
  const navigate = useNavigate();

  const handleAccess = () => {
    onOpenChange(false);
    navigate("/owners");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Owners Only Access
          </DialogTitle>
          <DialogDescription>
            This area is password protected for current owners.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click below to access the secure owners portal.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleAccess} className="flex-1">
              Access Portal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OwnersOnlyDialog;
