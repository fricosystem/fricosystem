import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DataNaoProcessada {
  id: string;
  date: string;
  turnos: string[];
}

interface ModalProcessarDatasAnterioresProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasNaoProcessadas: DataNaoProcessada[];
  onProcessarDatas: () => Promise<void>;
  isLoading: boolean;
}

export const ModalProcessarDatasAnteriores: React.FC<ModalProcessarDatasAnterioresProps> = ({
  open,
  onOpenChange,
  datasNaoProcessadas,
  onProcessarDatas,
  isLoading
}) => {
  const formatDate = (dateString: string) => {
    try {
      // Se for um ID de documento no formato YYYY-MM-DD, usar diretamente
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Para outras datas, criar com timezone local para evitar problemas de UTC
      const date = new Date(dateString + 'T12:00:00');
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getTotalDatas = () => datasNaoProcessadas.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Datas Anteriores Não Processadas
          </DialogTitle>
          <DialogDescription>
            Foram encontradas {getTotalDatas()} datas com dados não processados. 
            É necessário processar essas datas antes de continuar com o processamento atual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data
                </TableHead>
                <TableHead>Turnos Disponíveis</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasNaoProcessadas.map((data) => (
                <TableRow key={data.id}>
                  <TableCell className="font-medium">
                    {formatDate(data.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {data.turnos.map((turno) => (
                        <Badge key={turno} variant="outline" className="text-xs">
                          {turno.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-xs">
                      Não Processado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Atenção: Processamento Necessário
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Todas as datas listadas acima serão processadas automaticamente. 
                Essa operação atualizará o status de todas essas datas para "processado".
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onProcessarDatas}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Processando..." : "Processar Datas Anteriores"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};