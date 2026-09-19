
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingIndicator = ({ 
  message = "Carregando...", 
  progress = 0,
  showProgress = false
}: LoadingIndicatorProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-lg">{message}</span>
      
      {showProgress && (
        <div className="w-full max-w-md">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center mt-2">{progress}%</p>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
