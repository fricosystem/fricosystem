import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, ChevronRight } from "lucide-react";

interface SetorCardProps {
  setor: string;
  quantidadeMaquinas: number;
  maquinasAtivas: number;
  maquinasInativas: number;
  onClick: () => void;
}

const SetorCard = ({ 
  setor, 
  quantidadeMaquinas, 
  maquinasAtivas, 
  maquinasInativas,
  onClick 
}: SetorCardProps) => {
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
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
