import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ManualCardProps {
  empresa: string;
  nomeManual: string;
  capaUrl?: string;
  onClick: () => void;
}

const ManualCard = ({ empresa, nomeManual, capaUrl, onClick }: ManualCardProps) => {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={`Capa - ${nomeManual}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
              Abrir Manual
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="p-4 space-y-1">
        <h3 className="font-semibold text-foreground line-clamp-1" title={empresa}>
          {empresa}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" title={nomeManual}>
          {nomeManual}
        </p>
      </CardContent>
    </Card>
  );
};

export default ManualCard;
