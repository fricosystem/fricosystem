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

  // Método de impressão direto
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Entrega de Lenha</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            color: #000;
            padding: 0;
            margin: 0;
            font-size: 14px;
            height: 100vh;
          }
          .page-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding-top: 20px;
          }
          .recibo-container {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .recibo-spacer {
            height: 30px;
          }
          .recibo-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000;
            margin-top: 10px;
          }
          .recibo-header h1 {
            font-size: 18px;
            margin: 5px 0;
          }
          .recibo-header p {
            margin: 20;
            font-size: 14px;
          }
          .recibo-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 15px;
            margin-bottom: 15px;
          }
          .recibo-label {
            font-weight: bold;
          }
          .recibo-value {
            text-align: right;
          }
          .recibo-fornecedor {
            font-weight: bold;
            font-size: 18px;
            grid-column: span 2;
            text-align: center;
            margin-bottom: 10px;
          }
          .recibo-total {
            grid-column: span 2;
            text-align: right;
            font-weight: bold;
            margin-top: 5px;
            font-size: 15px;
          }
          .recibo-recebido {
            margin-top: 10px;
          }
          .recibo-assinatura {
            margin-top: 40px;
            text-align: center;
            padding-top: 10px;
          }
          .recibo-assinatura-line {
            width: 200px;
            margin: 0 auto;
            border-top: 1px dashed #000;
          }
          .recibo-assinatura-text {
            font-size: 12px;
            margin-top: 5px;
          }
          .recibo-chave-pix {
            margin-top: 10px;
            font-size: 12px;
            text-align: center;
          }
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
          }
          .logo-container img {
            height: 80px; /* Ícone maior */
            width: auto;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              height: 100%;
            }
            .page-container {
              height: 100%;
              padding-top: 20px;
            }
            .recibo-divider {
              border-top: 2px dashed #000;
              text-align: center;
              padding: 5px 0;
              font-size: 12px;
              margin: 10px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Primeiro recibo -->
          <div class="recibo-container">
            <div>
              <div class="logo-container">
                <img src="/Uploads/IconeFrico3D.png" alt="Fricó Alimentos Logo" onError="this.style.display='none'" />
              </div>
              <div class="recibo-header">
                <h1>Comprovante de Entrega de Lenha</h1>
                <div style="height: 20px;"></div>
              </div>
              
              <div class="recibo-fornecedor">${medida.fornecedor}</div>
              
              <div class="recibo-content">
                <div class="recibo-label">Data:</div>
                <div class="recibo-value">${dataFormatada}</div>
                
                <div class="recibo-label">Quantidade:</div>
                <div class="recibo-value">${medida.metrosCubicos.toFixed(2)} m³</div>
                
                <div class="recibo-label">Unidade:</div>
                <div class="recibo-value">Mt</div>
                
                <div class="recibo-label">Nota Fiscal:</div>
                <div class="recibo-value">${medida.nfe || "-"}</div>
                
                <div class="recibo-label">Valor Unitário:</div>
                <div class="recibo-value">${formatarValor(medida.valorUnitario)}</div>
                
                <div class="recibo-total">${formatarValor(medida.valorTotal)}</div>
              </div>
              
              <div class="recibo-recebido">
                <div class="recibo-label">Recebido por:</div>
                <div>${medida.usuario}</div>
              </div>
            </div>
            
            <div class="recibo-assinatura">
              <div class="recibo-assinatura-line"></div>
              <div class="recibo-assinatura-text">Assinatura do Funcionário</div>
              ${medida.chavePixFornecedor ? `
                <div class="recibo-chave-pix">Chave Pix para pagamento: ${medida.chavePixFornecedor}</div>
              ` : ''}
            </div>
          </div>
          
          <!-- Substitui a divisória por espaçamento -->
          <div style="height: 20px;"></div>
          <!-- Divisória central -->
          <div class="recibo-divider"></div>
          <!-- Substitui a divisória por espaçamento -->
          <div style="height: 20px;"></div>
          
          <!-- Segundo recibo (cópia) -->
          <div class="recibo-container">
            <div>
              <div class="logo-container">
                <img src="/Uploads/IconeFrico3D.png" alt="Fricó Alimentos Logo" onError="this.style.display='none'" />
              </div>
              <div class="recibo-header">
                <h1>Comprovante de Entrega de Lenha</h1>
                <div style="height: 20px;"></div>
              </div>
              
              <div class="recibo-fornecedor">${medida.fornecedor}</div>
              
              <div class="recibo-content">
                <div class="recibo-label">Data:</div>
                <div class="recibo-value">${dataFormatada}</div>
                
                <div class="recibo-label">Quantidade:</div>
                <div class="recibo-value">${medida.metrosCubicos.toFixed(2)} m³</div>
                
                <div class="recibo-label">Unidade:</div>
                <div class="recibo-value">Mt</div>
                
                <div class="recibo-label">Nota Fiscal:</div>
                <div class="recibo-value">${medida.nfe || "-"}</div>
                
                <div class="recibo-label">Valor Unitário:</div>
                <div class="recibo-value">${formatarValor(medida.valorUnitario)}</div>
                
                <div class="recibo-total">${formatarValor(medida.valorTotal)}</div>
              </div>
              
              <div class="recibo-recebido">
                <div class="recibo-label">Recebido por:</div>
                <div>${medida.usuario}</div>
              </div>
            </div>
            
            <div class="recibo-assinatura">
              <div class="recibo-assinatura-line"></div>
              <div class="recibo-assinatura-text">Assinatura do Fornecedor</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Cria um iframe invisível para impressão
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();

        // Espera o conteúdo carregar antes de imprimir
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          
          // Remove o iframe após impressão
          setTimeout(() => {
            document.body.removeChild(iframe);
            onClose();
          }, 100);
        }, 100);
      }

      toast({
        title: "Recibo enviado para impressão",
        description: "Verifique a impressora selecionada."
      });
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
      <DialogContent className="sm:max-w-xl print:hidden bg-gray-900 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">Comprovante de Entrega de Lenha</DialogTitle>
        </DialogHeader>
        
        {/* Conteúdo do recibo com tema escuro */}
        <div ref={reciboRef} className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-center border-b border-gray-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">Comprovante de Entrega de Lenha</h2>
            <p className="text-gray-400">{dataFormatada}</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="font-semibold text-gray-300">Fornecedor:</div>
              <div className="text-right font-bold text-white text-lg">{medida.fornecedor}</div>
              
              <div className="font-semibold text-gray-300">Data:</div>
              <div className="text-right text-white">{dataFormatada}</div>
              
              <div className="font-semibold text-gray-300">Quantidade:</div>
              <div className="text-right text-white">{medida.metrosCubicos.toFixed(2)} m³</div>
              
              <div className="font-semibold text-gray-300">Unidade:</div>
              <div className="text-right text-white">Mt</div>
              
              <div className="font-semibold text-gray-300">Nota Fiscal:</div>
              <div className="text-right text-white">{medida.nfe || "-"}</div>
              
              <div className="font-semibold text-gray-300">Valor Unitário:</div>
              <div className="text-right text-white">{formatarValor(medida.valorUnitario)}</div>
              
              <div className="font-semibold text-gray-300">Valor Total:</div>
              <div className="text-right font-bold text-green-400">
                {formatarValor(medida.valorTotal)}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-700">
              <div className="font-semibold text-gray-300 mb-2">Recebido por:</div>
              <div className="text-white">{medida.usuario}</div>
              
              <div className="mt-12 pt-2 text-center">
                <div className="mx-auto w-3/4 border-t border-dashed border-gray-600 pt-2">
                  <div className="text-sm text-gray-500">Assinatura</div>
                  {medida.chavePixFornecedor && (
                    <div className="text-xs text-gray-500 mt-2">Chave Pix para pagamento: {medida.chavePixFornecedor}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between print:hidden">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mr-2 bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            Fechar
          </Button>
          <Button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRecibo;