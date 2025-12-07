import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetorCardProps {
  setor: string;
  quantidadeMaquinas: number;
  maquinasAtivas: number;
  maquinasInativas: number;
  onClick: () => void;
  onEdit?: (setor: string) => void;
}

const SetorCard = ({ 
  setor, 
  quantidadeMaquinas, 
  maquinasAtivas, 
  maquinasInativas,
  onClick,
  onEdit
}: SetorCardProps) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(setor);
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{setor}</h3>
              <p className="text-sm text-muted-foreground">
                {quantidadeMaquinas} {quantidadeMaquinas === 1 ? 'máquina' : 'máquinas'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEditClick}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Badge variant="default" className="bg-green-600">
            {maquinasAtivas} ativas
          </Badge>
          {maquinasInativas > 0 && (
            <Badge variant="secondary">
              {maquinasInativas} inativas
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SetorCard;
