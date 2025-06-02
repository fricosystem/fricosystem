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
import { MedidaLenha } from "@/types/typesLenha";

interface ModalComprovanteTotalProps {
  isOpen: boolean;
  onClose: () => void;
  totalMetrosCubicos: number;
  totalValor: number;
  itens: MedidaLenha[];
}

const ModalComprovanteTotal = ({
  isOpen,
  onClose,
  totalMetrosCubicos,
  totalValor,
  itens = []
}: ModalComprovanteTotalProps) => {
  const comprovanteRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarData = (data: Date): string => {
    return format(data, "dd/MM/yyyy", { locale: ptBR });
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
                size: A4 portrait;
                margin: 5mm;
              }
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #000;
              }
              .container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                padding: 10mm;
              }
              .header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 15px;
              }
              .logo {
                height: 60px;
                margin-right: 20px;
              }
              .header-text {
                flex: 1;
                text-align: center;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin: 0;
              }
              .date {
                font-size: 14px;
                margin: 5px 0 0 0;
              }
              .totals {
                margin: 20px 0;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 5px;
                display: flex;
                justify-content: space-between;
              }
              .total-item {
                text-align: center;
              }
              .total-label {
                font-size: 14px;
                margin-bottom: 5px;
              }
              .total-value {
                font-weight: bold;
                font-size: 16px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
                page-break-inside: avoid;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
                text-align: left;
                padding: 8px;
                border: 1px solid #ddd;
              }
              td {
                padding: 8px;
                border: 1px solid #ddd;
              }
              .no-items {
                text-align: center;
                padding: 20px;
                font-style: italic;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="/Uploads/IconeFrico3D.png" alt="Fricó Alimentos Logo" class="logo" onerror="this.style.display='none'" />
                <div class="header-text">
                  <h1 class="title">RELATÓRIO GERAL DE MEDIÇÃO DE LENHA</h1>
                  <div class="date">Data do relatório: ${dataFormatada}</div>
                </div>
              </div>
              
              <div class="totals">
                <div class="total-item">
                  <div class="total-label">Total em metros cúbicos</div>
                  <div class="total-value">${totalMetrosCubicos.toFixed(2)} m³</div>
                </div>
                <div class="total-item">
                  <div class="total-label">Valor total</div>
                  <div class="total-value">${formatarValor(totalValor)}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>NFe</th>
                    <th>Metros³</th>
                    <th>Fornecedor</th>
                    <th>Responsável</th>
                    <th>Valor Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${itens && itens.length > 0 ? 
                    itens.map(item => `
                      <tr>
                        <td>${item.data ? formatarData(new Date(item.data)) : '-'}</td>
                        <td>${item.nfe || '-'}</td>
                        <td>${item.metrosCubicos?.toFixed(2) || '0.00'}</td>
                        <td>${item.fornecedor || '-'}</td>
                        <td>${item.responsavel || '-'}</td>
                        <td>${item.valorTotal ? formatarValor(item.valorTotal) : 'R$ 0,00'}</td>
                        <td>${item.status_envio || 'Emissão para o fornecedor'}</td>
                      </tr>
                    `).join('') : `
                    <tr>
                      <td colspan="7" class="no-items">Nenhum item cadastrado</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
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
      <DialogContent className="sm:max-w-4xl print:hidden bg-gray-900 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">Modelo de impressão</DialogTitle>
        </DialogHeader>

        <div ref={comprovanteRef} className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-700">
            <div className="mr-4">
              <img src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" className="h-12" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-bold text-white">RELATÓRIO GERAL DE MEDIÇÃO DE LENHA</h2>
              <p className="text-gray-400 text-sm">Data do relatório: {dataFormatada}</p>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg mb-6 flex justify-between">
            <div className="text-center">
              <div className="text-gray-300 text-sm">Total em metros cúbicos</div>
              <div className="font-bold text-white text-lg">{totalMetrosCubicos.toFixed(2)} m³</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300 text-sm">Valor total</div>
              <div className="font-bold text-green-400 text-lg">{formatarValor(totalValor)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-700 text-gray-300">
                  <th className="p-2 border border-gray-600">Data</th>
                  <th className="p-2 border border-gray-600">NFe</th>
                  <th className="p-2 border border-gray-600">Metros³</th>
                  <th className="p-2 border border-gray-600">Fornecedor</th>
                  <th className="p-2 border border-gray-600">Responsável</th>
                  <th className="p-2 border border-gray-600">Valor Total</th>
                  <th className="p-2 border border-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {itens && itens.length > 0 ? (
                  itens.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                      <td className="p-2 border border-gray-700">{item.data ? formatarData(new Date(item.data)) : '-'}</td>
                      <td className="p-2 border border-gray-700">{item.nfe || '-'}</td>
                      <td className="p-2 border border-gray-700">{item.metrosCubicos?.toFixed(2) || '0.00'}</td>
                      <td className="p-2 border border-gray-700">{item.fornecedor || '-'}</td>
                      <td className="p-2 border border-gray-700">{item.responsavel || '-'}</td>
                      <td className="p-2 border border-gray-700">{item.valorTotal ? formatarValor(item.valorTotal) : 'R$ 0,00'}</td>
                      <td className="p-2 border border-gray-700">{item.status_envio || 'Emissão para o fornecedor'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500 italic">Nenhum item cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
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