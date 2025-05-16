import { useRef } from "react";
import { MedidaLenha } from "@/types/typesLenha";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer } from "lucide-react";

interface ModalReciboProps {
  medida: MedidaLenha;
  isOpen: boolean;
  onClose: () => void;
}

const ModalRecibo = ({ medida, isOpen, onClose }: ModalReciboProps) => {
  const reciboRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Formatar data para exibição
  const dataFormatada = format(medida.data, "dd/MM/yyyy", { locale: ptBR });

  // Formatar valor para exibição
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Método de impressão nativo do navegador
  const handlePrint = () => {
    try {
      // Guarda o conteúdo original do documento
      const originalContents = document.body.innerHTML;
      
      // Substitui temporariamente o conteúdo do documento pelo recibo
      if (reciboRef.current) {
        const conteudoImprimir = reciboRef.current.innerHTML;
        const estiloImprimir = `
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .recibo-cabecalho {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 1px solid #000;
              margin-bottom: 20px;
            }
            .recibo-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .label {
              font-weight: bold;
            }
            .assinatura {
              margin-top: 60px;
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        `;
        
        document.body.innerHTML = estiloImprimir + `
          <div class="recibo-wrapper">
            <div class="recibo-cabecalho">
              <h2>Comprovante de Entrega de Lenha</h2>
            </div>
            <div class="recibo-info">
              <div class="label">Fornecedor:</div>
              <div>${medida.fornecedor}</div>
              
              <div class="label">Data:</div>
              <div>${dataFormatada}</div>
              
              <div class="label">Quantidade:</div>
              <div>${medida.metrosCubicos} m³</div>
              
              <div class="label">Unidade:</div>
              <div>Mt</div>
              
              <div class="label">Nota Fiscal:</div>
              <div>${medida.nfe || "-"}</div>
              
              <div class="label">Valor Unitário:</div>
              <div>${formatarValor(medida.valorUnitario)}</div>
              
              <div class="label">Valor Total:</div>
              <div><strong>${formatarValor(medida.valorTotal)}</strong></div>
            </div>
            
            <div>
              <div class="label">Recebido por:</div>
              <div>${medida.usuario}</div>
              
              <div class="assinatura">
                <div>_______________________________________________________</div>
                <div style="font-size: 0.875rem;">Assinatura</div>
              </div>
            </div>
          </div>
        `;
        
        // Chama o método de impressão
        window.print();
        
        // Restaura o conteúdo original
        document.body.innerHTML = originalContents;
        
        toast({
          title: "Recibo enviado para impressão",
          description: "Verifique a impressora selecionada."
        });
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        variant: "destructive",
        title: "Erro na impressão",
        description: `Não foi possível enviar para impressão. Erro: ${(error as Error).message}`
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Entrega</DialogTitle>
        </DialogHeader>
        
        {/* Conteúdo do recibo */}
        <div ref={reciboRef} className="p-4 bg-white">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">Comprovante de Entrega de Lenha</h2>
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Fornecedor:</div>
              <div>{medida.fornecedor}</div>
              
              <div className="font-semibold">Data:</div>
              <div>{dataFormatada}</div>
              
              <div className="font-semibold">Quantidade:</div>
              <div>{medida.metrosCubicos} m³</div>
              
              <div className="font-semibold">Unidade:</div>
              <div>Mt</div>
              
              <div className="font-semibold">Nota Fiscal:</div>
              <div>{medida.nfe || "-"}</div>
              
              <div className="font-semibold">Valor Unitário:</div>
              <div>{formatarValor(medida.valorUnitario)}</div>
              
              <div className="font-semibold">Valor Total:</div>
              <div className="font-bold">{formatarValor(medida.valorTotal)}</div>
            </div>
            
            <div className="border-t pt-4 mt-6">
              <div className="font-semibold">Recebido por:</div>
              <div className="mt-2">{medida.usuario}</div>
              
              <div className="mt-8 border-t border-dashed pt-2 text-center">
                <div>_______________________________________________________</div>
                <div className="text-sm">Assinatura</div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRecibo;