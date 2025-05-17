import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Share2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Item {
  quantidade: number;
  diametro: number;
  comprimento: number;
  metrosCubicos: number;
  valor: number;
}

interface ModalComprovanteTotalProps {
  isOpen: boolean;
  onClose: () => void;
  totalMetrosCubicos: number;
  totalValor: number;
  itens?: Item[]; // Tornando opcional com ?
}

const ModalComprovanteTotal = ({
  isOpen,
  onClose,
  totalMetrosCubicos,
  totalValor,
  itens = [] // Valor padrão para evitar undefined
}: ModalComprovanteTotalProps) => {
  const comprovanteRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const dataFormatada = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const handleImprimir = () => {
    setIsPrinting(true);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    
    iframe.onload = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              @page {
                size: A5 landscape;
                margin: 10mm;
              }
              @page :first {
                margin-top: 20mm;
              }
              body { 
                font-family: Arial, sans-serif;
                color: #000;
              }
              .page {
                page-break-after: always;
                padding: 10mm;
              }
              .page:last-child {
                page-break-after: auto;
              }
              .header {
                text-align: center;
                margin-bottom: 15mm;
              }
              .title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5mm;
              }
              .date {
                margin-bottom: 10mm;
              }
              .detalhes {
                margin: 10mm 0;
              }
              .linha {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8mm;
                font-size: 16px;
              }
              .valor-destaque {
                font-weight: bold;
                font-size: 18px;
              }
              .assinatura {
                margin-top: 20mm;
                text-align: center;
              }
              .linha-assinatura {
                width: 80mm;
                margin: 0 auto;
                border-top: 1px solid #000;
                padding-top: 5mm;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10mm;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              .footer {
                text-align: center;
                margin-top: 10mm;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header">
                <h1 class="title">Relatório dos totais</h1>
                <div class="date">${dataFormatada}</div>
              </div>
              
              <div class="detalhes">
                <div class="linha">
                  <span>Total em metros cúbicos:</span>
                  <span class="valor-destaque">${totalMetrosCubicos.toFixed(2)} m³</span>
                </div>
                <div class="linha">
                  <span>Valor total:</span>
                  <span class="valor-destaque">${formatarValor(totalValor)}</span>
                </div>
              </div>
              
              <div class="assinatura">
                <div class="linha-assinatura"></div>
                <div>Assinatura</div>
              </div>
            </div>
            
            ${itens.length > 0 ? `
            <div class="page">
              <table>
                <thead>
                  <tr>
                    <th>Quantidade</th>
                    <th>Diâmetro (cm)</th>
                    <th>Comprimento (m)</th>
                    <th>m³</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${itens.map(item => `
                    <tr>
                      <td>${item.quantidade}</td>
                      <td>${item.diametro}</td>
                      <td>${item.comprimento}</td>
                      <td>${item.metrosCubicos.toFixed(2)}</td>
                      <td>${formatarValor(item.valor)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}
          </body>
          </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            setIsPrinting(false);
            onClose();
          }, 100);
        }, 100);
      }
    };

    document.body.appendChild(iframe);
  };

  return (
    <Dialog open={isOpen} onOpenChange={isPrinting ? undefined : onClose}>
      <DialogContent className="sm:max-w-md print:hidden bg-gray-900 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">Relatório dos Totais</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between">
                <span className="text-gray-300">Modelo de impressão:</span>
        </div>
        
        <div ref={comprovanteRef} className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-center border-b border-gray-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">Relatório dos Totais</h2>
            <p className="text-gray-400">{dataFormatada}</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total em metros cúbicos:</span>
                <span className="font-bold text-white">{totalMetrosCubicos.toFixed(2)} m³</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Valor total:</span>
                <span className="font-bold text-green-400">
                  {formatarValor(totalValor)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2 print:hidden mt-4">
          <Button 
            onClick={handleImprimir} 
            disabled={isPrinting}
            className="bg-blue-600 hover:bg-blue-700 col-span-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {'share' in navigator && (
            <>
              <Button 
                variant="secondary" 
                disabled={isPrinting}
                className="bg-gray-700 hover:bg-gray-600"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isPrinting}
                className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalComprovanteTotal;