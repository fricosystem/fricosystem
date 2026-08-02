import { BookOpen, Edit, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Manual } from "@/pages/Manuais";

interface ManualCardProps {
  manual: Manual;
  onClick: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const ManualCard = ({ manual, onClick, onEdit, onToggleStatus }: ManualCardProps) => {
  return (
    <Card 
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 ${
        !manual.ativo ? "opacity-60" : ""
      }`}
    >
      {/* Cover Image */}
      <div 
        className="relative aspect-video bg-muted overflow-hidden"
        onClick={onClick}
      >
        {manual.capaUrl ? (
          <img
            src={manual.capaUrl}
            alt={`Capa - ${manual.titulo}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Status Badge */}
        {!manual.ativo && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
            Inativo
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
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1" title={manual.titulo}>
          {manual.titulo}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" title={manual.subtitulo}>
          {manual.subtitulo}
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant={manual.ativo ? "destructive" : "default"}
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
          >
            <Power className="h-3 w-3 mr-1" />
            {manual.ativo ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualCard;
