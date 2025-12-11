import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import { collection, addDoc, getDoc, doc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MedidaLenha } from "@/types/typesLenha";
import { FornecedorSelect } from "@/components/Lenha/FornecedorSelect";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FormMedidaLenhaProps {
  onSaveSuccess: () => void;
  onCancel?: () => void;
}

const FormMedidaLenha = ({ onSaveSuccess, onCancel }: FormMedidaLenhaProps) => {
  // Estado inicial
  const [medidas, setMedidas] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [comprimento, setComprimento] = useState<number>(0);
  const [largura, setLargura] = useState<number>(0);
  const [fornecedor, setFornecedor] = useState("");
  const [nfe, setNfe] = useState("");
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [chavePixFornecedor, setChavePixFornecedor] = useState("");
  const [contatoFornecedor, setContatoFornecedor] = useState("");
  const [cnpjFornecedor, setCnpjFornecedor] = useState("");
  const [centroCusto, setCentroCusto] = useState("");
  
  // Valores calculados
  const [alturaMedia, setAlturaMedia] = useState<number>(0);
  const [metrosCubicos, setMetrosCubicos] = useState<number>(0);
  const [valorTotal, setValorTotal] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth();
  const { toast } = useToast();
  
  // Cálculos automáticos quando os valores mudam
  useEffect(() => {
    // Verifica se todas as medidas são válidas
    const medidasValidas = medidas.every(m => m > 0);
    
    if (medidasValidas) {
      // Calcula altura média
      const media = medidas.reduce((sum, current) => sum + current, 0) / 6;
      setAlturaMedia(Number(media.toFixed(2)));
      
      // Calcula cubagem usando altura média, comprimento e largura
      if (comprimento > 0 && largura > 0) {
        const cubagem = media * comprimento * largura;
        // Arredonda cubagem para exibição mas mantém precisão para cálculo
        const cubagemArredondada = Math.round(cubagem * 100) / 100;
        setMetrosCubicos(cubagemArredondada);
        
        // Calcula valor total usando cubagem arredondada para garantir consistência
        // Math.round garante arredondamento correto para centavos
        const total = Math.round(cubagemArredondada * valorUnitario * 100) / 100;
        setValorTotal(total);
      }
    } else {
      setAlturaMedia(0);
      setMetrosCubicos(0);
      setValorTotal(0);
    }
  }, [medidas, comprimento, largura, valorUnitario]);
  
  // Atualiza uma medida específica
  const handleMedidaChange = (index: number, value: string) => {
    const novoValor = parseFloat(value) || 0;
    const novasMedidas = [...medidas];
    novasMedidas[index] = novoValor;
    setMedidas(novasMedidas);
  };
  
  // Handler para quando o fornecedor é selecionado
  const handleFornecedorChange = async (fornecedorId: string, novoFornecedor: string, novoValorUnitario: number) => {
    setFornecedor(novoFornecedor);
    setValorUnitario(novoValorUnitario);
    
    // Busca a chave Pix, contato e centro de custo do fornecedor no Firestore
    if (fornecedorId) {
      try {
        const fornecedorRef = doc(db, "fornecedoreslenha", fornecedorId);
        const fornecedorDoc = await getDoc(fornecedorRef);
        
        if (fornecedorDoc.exists()) {
          const fornecedorData = fornecedorDoc.data();
          setChavePixFornecedor(fornecedorData.chavePix || "");
          setContatoFornecedor(fornecedorData.contato || "");
          setCnpjFornecedor(fornecedorData.cnpj || "");
          setCentroCusto(fornecedorData.centroCusto || "");
        } else {
          setChavePixFornecedor("");
          setContatoFornecedor("");
          setCnpjFornecedor("");
          setCentroCusto("");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do fornecedor:", error);
        setChavePixFornecedor("");
        setContatoFornecedor("");
        setCnpjFornecedor("");
        setCentroCusto("");
      }
    } else {
      setChavePixFornecedor("");
      setContatoFornecedor("");
      setCnpjFornecedor("");
      setCentroCusto("");
    }
  };
  
  // Salva no Firestore
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida se todas as medidas são maiores que zero
    if (!medidas.every(m => m > 0)) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Todas as medidas de altura devem ser maiores que zero.",
      });
      return;
    }
    
    // Valida campos de comprimento e largura
    if (comprimento <= 0 || largura <= 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Comprimento e largura devem ser maiores que zero.",
      });
      return;
    }
    
    // Valida campos obrigatórios
    if (!fornecedor || valorUnitario <= 0) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    if (!centroCusto) {
      toast({
        variant: "destructive",
        title: "Centro de custo não encontrado",
        description: "O fornecedor selecionado não possui centro de custo cadastrado.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const novaMedida: Omit<MedidaLenha, "id"> = {
        data: new Date(),
        medidas: medidas.map(m => m.toString()),
        comprimento,
        largura,
        metrosCubicos,
        fornecedor,
        nfe,
        responsavel: userData?.nome || "Usuário não identificado",
        valorUnitario,
        valorTotal,
        usuario: userData?.nome || "Usuário não identificado",
        chavePixFornecedor,
        contatoFornecedor,
        cnpjFornecedor,
        centroCusto,
      };
      
      // Salvar na coleção medidas_lenha (para aparecer na tabela)
      const medidaRef = await addDoc(collection(db, "medidas_lenha"), {
        data: Timestamp.fromDate(new Date()),
        medidas: medidas.map(m => m.toString()),
        comprimento,
        largura,
        metrosCubicos,
        fornecedor,
        nfe,
        responsavel: userData?.nome || "Usuário não identificado",
        valorUnitario,
        valorTotal,
        usuario: userData?.nome || "Usuário não identificado",
        chavePixFornecedor,
        contatoFornecedor,
        cnpjFornecedor,
        centroCusto,
        status_envio: "pendente"
      });
      
      // Salvar relatório da cubagem/lenha
      const relatorioRef = await addDoc(collection(db, "relatorios"), {
        requisicao_id: null,
        produto_id: null,
        codigo_material: null,
        nome_produto: `Lenha - ${fornecedor}`,
        quantidade: metrosCubicos,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
        status: 'entrada',
        tipo: 'Cubagem/Lenha',
        solicitante: {
          id: userData?.id || 'system',
          nome: userData?.nome || 'Sistema',
          cargo: userData?.cargo || 'Administrador'
        },
        usuario: {
          id: userData?.id || 'system',
          nome: userData?.nome || 'Sistema',
          email: userData?.email || 'sistema@empresa.com'
        },
        deposito: fornecedor,
        prateleira: "Cubagem de Lenha",
        centro_de_custo: centroCusto,
        unidade_centro_custo: centroCusto,
        unidade: 'm³',
        data_saida: Timestamp.fromDate(new Date()),
        data_registro: Timestamp.fromDate(new Date()),
        nfe: nfe || null,
        fornecedor: fornecedor,
        responsavel: userData?.nome || "Usuário não identificado",
        medidas: medidas.map(m => m.toString()),
        comprimento,
        largura,
        alturaMedia,
        metrosCubicos,
        chavePixFornecedor,
        contatoFornecedor,
        cnpjFornecedor
      });
      
      toast({
        title: "Registro salvo com sucesso!",
        description: `${metrosCubicos} m³ de lenha registrados.`,
      });
      
      // Preparar dados para impressão usando o ID da medida
      const medidaParaImpressao: MedidaLenha = {
        id: medidaRef.id,
        ...novaMedida
  };
  
  // Função para imprimir o recibo automaticamente
  const imprimirRecibo = (medida: MedidaLenha) => {
    const dataFormatada = format(medida.data, "dd/MM/yyyy", { locale: ptBR });
    
    const formatarValor = (valor: number) => {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Entrega de Lenha</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          @page {
            margin-top: 15mm;
            margin-bottom: 15mm;
          }
          /* Remove cabeçalhos e rodapés padrão do navegador */
          @media print {
            @page { margin: 0; }
            body { margin: 15mm; }
          }
          body {
            font-family: Arial, sans-serif;
            color: #000;
            padding: 0;
            margin: 0;
            font-size: 13px;
          }
          .page-container {
            padding: 10px 20px;
          }
          .recibo-container {
            padding: 10px 0;
          }
          .recibo-header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #000;
          }
          .recibo-header h1 {
            font-size: 16px;
            margin: 3px 0;
          }
          .recibo-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 15px;
            margin-bottom: 4px;
          }
          .recibo-label {
            font-weight: bold;
          }
          .recibo-value {
            text-align: right;
          }
          .recibo-fornecedor {
            font-weight: bold;
            font-size: 16px;
            grid-column: span 2;
            text-align: center;
            margin-bottom: 8px;
          }
          .recibo-total {
            grid-column: span 2;
            text-align: right;
            font-weight: bold;
            margin-top: 4px;
            font-size: 14px;
          }
          .recibo-recebido {
            margin-top: 4px;
          }
          .recibo-assinatura {
            margin-top: 15px;
            text-align: center;
            padding-top: 4px;
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
          .logo-container {
            text-align: center;
            margin-bottom: 8px;
          }
          .logo-container img {
            height: 60px;
            width: auto;
          }
          .recibo-divider {
            border-top: 2px dashed #000;
            margin: 20px 0;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="recibo-container">
            <div>
              <div class="logo-container">
                <img src="https://res.cloudinary.com/diomtgcvb/image/upload/v1758851478/IconeFrico3D_oasnj7.png" alt="Fricó Alimentos Logo" onError="this.style.display='none'" />
              </div>
              
              <div class="recibo-header">
                <h1>Comprovante de Entrega de Lenha</h1>
              </div>
              
              <div class="recibo-fornecedor">${medida.fornecedor}</div>
              
              <div class="recibo-content">
                ${medida.cnpjFornecedor ? `
                  <div class="recibo-label">CNPJ Fornecedor:</div>
                  <div class="recibo-value">${medida.cnpjFornecedor}</div>
                ` : ''}
                
                <div class="recibo-label">Data:</div>
                <div class="recibo-value">${dataFormatada}</div>
                
                <div class="recibo-label">Quantidade:</div>
                <div class="recibo-value">${medida.metrosCubicos.toFixed(2)} m³</div>
                
                <div class="recibo-label">Unidade:</div>
                <div class="recibo-value">Mt</div>
                
                ${medida.centroCusto ? `
                  <div class="recibo-label">Centro de Custo:</div>
                  <div class="recibo-value">${medida.centroCusto}</div>
                ` : ''}
                
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
              
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #333;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                  <div class="recibo-label">Comprimento:</div>
                  <div class="recibo-value">${medida.comprimento.toFixed(2)} m</div>
                  
                  <div class="recibo-label">Largura:</div>
                  <div class="recibo-value">${medida.largura.toFixed(2)} m</div>
                </div>
                
                ${medida.medidas && medida.medidas.length > 0 ? `
                  <div style="margin-top: 8px;">
                    <div class="recibo-label" style="margin-bottom: 4px;">Medidas:</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                      ${medida.medidas.map((m, index) => `
                        <div style="font-size: 12px;">
                          <span class="recibo-label">Medida ${index + 1}:</span> ${m} m³
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="recibo-assinatura">
              <div class="recibo-assinatura-line"></div>
              <div class="recibo-assinatura-text">Assinatura do Funcionário</div>
            </div>
          </div>
          
          <div class="recibo-divider"></div>
          
          <div class="recibo-container">
            <div>
              <div class="logo-container">
                <img src="https://res.cloudinary.com/diomtgcvb/image/upload/v1758851478/IconeFrico3D_oasnj7.png" alt="Fricó Alimentos Logo" onError="this.style.display='none'" />
              </div>
              
              <div class="recibo-header">
                <h1>Comprovante de Entrega de Lenha</h1>
              </div>
              
              <div class="recibo-fornecedor">${medida.fornecedor}</div>
              
              <div class="recibo-content">
                ${medida.cnpjFornecedor ? `
                  <div class="recibo-label">CNPJ Fornecedor:</div>
                  <div class="recibo-value">${medida.cnpjFornecedor}</div>
                ` : ''}
                
                <div class="recibo-label">Data:</div>
                <div class="recibo-value">${dataFormatada}</div>
                
                <div class="recibo-label">Quantidade:</div>
                <div class="recibo-value">${medida.metrosCubicos.toFixed(2)} m³</div>
                
                <div class="recibo-label">Unidade:</div>
                <div class="recibo-value">Mt</div>
                
                ${medida.centroCusto ? `
                  <div class="recibo-label">Centro de Custo:</div>
                  <div class="recibo-value">${medida.centroCusto}</div>
                ` : ''}
                
                <div class="recibo-label">Nota Fiscal:</div>
                <div class="recibo-value">${medida.nfe || "-"}</div>
                
                <div class="recibo-label">Valor Unitário:</div>
                <div class="recibo-value">${formatarValor(medida.valorUnitario)}</div>
                
                <div class="recibo-total">${formatarValor(medida.valorTotal)}</div>
              </div>
              
              <div class="recibo-recebido">
                <div class="recibo-label">Recebido por:</div>
                <div>${medida.usuario}</div>
                ${medida.chavePixFornecedor ? `
                  <div style="margin-top: 10px;">
                    <div class="recibo-label">Chave PIX Fornecedor:</div>
                    <div>${medida.chavePixFornecedor}</div>
                  </div>
                ` : ''}
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

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }, 250);
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        variant: "destructive",
        title: "Erro na impressão",
        description: "Não foi possível enviar para impressão automaticamente."
      });
    }
  };
      
      // Impressão automática
      imprimirRecibo(medidaParaImpressao);
      
      // Limpa o formulário
      setMedidas([0, 0, 0, 0, 0, 0]);
      setComprimento(0);
      setLargura(0);
      setFornecedor("");
      setNfe("");
      setValorUnitario(0);
      setChavePixFornecedor("");
      setContatoFornecedor("");
      setCentroCusto("");
      
      // Notifica componente pai sobre sucesso
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar medida:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o registro. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-3 px-4 md:pb-4 md:px-6">
        <CardTitle className="text-xl md:text-2xl font-bold">Nova Medição de Lenha</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4 px-4 md:pb-6 md:px-6">
        <form onSubmit={handleSalvar} className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Coluna 1 - Informações da Entrega */}
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fornecedor" className="text-sm md:text-base">Fornecedor*</Label>
                <FornecedorSelect 
                  value={fornecedor} 
                  onChange={handleFornecedorChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nfe" className="text-sm md:text-base">Nota Fiscal</Label>
                <Input 
                  id="nfe"
                  value={nfe}
                  onChange={(e) => setNfe(e.target.value)}
                  placeholder="Número da NF-e"
                  className="h-10 md:h-12 text-sm md:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-sm md:text-base">Responsável</Label>
                <Input 
                  id="responsavel"
                  value={userData?.nome || ""}
                  disabled
                  className="h-10 md:h-12 text-sm md:text-base bg-muted cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valorUnitario" className="text-sm md:text-base">Valor Unitário (R$/m³)*</Label>
                <Input 
                  id="valorUnitario"
                  type="number" 
                  min="0.01"
                  step="0.01"
                  value={valorUnitario || ""}
                  onChange={(e) => {/* Removida capacidade de edição */}}
                  placeholder="0,00"
                  readOnly={true}
                  className="h-10 md:h-12 text-sm md:text-base bg-muted cursor-not-allowed"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor definido automaticamente quando o fornecedor é selecionado
                </p>
              </div>
              
              <div className="bg-secondary p-4 md:p-6 rounded-lg mt-4 md:mt-6">
                <h3 className="font-medium text-base md:text-lg mb-3 md:mb-4">Resumo do Cálculo</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm md:text-base">
                  <div>Fornecedor:</div>
                  <div className="font-medium">{fornecedor || "-"}</div>
                  
                  {centroCusto && (
                    <>
                      <div>Centro de Custo:</div>
                      <div className="font-medium">{centroCusto}</div>
                    </>
                  )}
                  
                  <div>Altura Média:</div>
                  <div className="font-medium">{alturaMedia} m</div>
                  
                  <div>Metros Cúbicos:</div>
                  <div className="font-medium">{metrosCubicos} m³</div>
                  
                  <div>Valor Total:</div>
                  <div className="font-medium text-base md:text-lg">R$ {valorTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            {/* Coluna 2 - Medidas */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="font-medium text-base md:text-lg mb-2">Dimensões da Carga*</h3>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="comprimento" className="text-sm md:text-base">Comprimento (m)*</Label>
                  <Input
                    id="comprimento"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={comprimento || ""}
                    onChange={(e) => setComprimento(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="largura" className="text-sm md:text-base">Largura (m)*</Label>
                  <Input
                    id="largura"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={largura || ""}
                    onChange={(e) => setLargura(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                </div>
              </div>
              
              <h3 className="font-medium text-base md:text-lg mb-2 mt-4 md:mt-6">Medidas de Altura (m)*</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {medidas.map((medida, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`medida-${index}`} className="text-sm md:text-base">Altura {index + 1}</Label>
                    <Input
                      id={`medida-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={medida || ""}
                      onChange={(e) => handleMedidaChange(index, e.target.value)}
                      placeholder="0,00"
                      required
                      className="h-10 md:h-12 text-sm md:text-base"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm mb-2">
                  * Campos obrigatórios
                </p>
                <p className="text-xs md:text-sm font-medium">
                  Fórmula de cálculo:
                </p>
                <p className="text-xs md:text-sm">
                  Cubagem = Altura Média × Comprimento × Largura
                </p>
                <p className="text-xs md:text-sm mt-2">
                  As medidas de altura devem ser tomadas em 6 pontos diferentes da carga.
                </p>
              </div>
            </div>
          </div>
          
          <CardFooter className="flex flex-col sm:flex-row justify-end p-0 pt-4 md:pt-6 gap-2 md:gap-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
                className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base w-full sm:w-auto"
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || !medidas.every(m => m > 0) || comprimento <= 0 || largura <= 0 || !fornecedor}
              className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base w-full sm:w-auto"
            >
              {loading ? "Salvando..." : "Registrar Medição"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default FormMedidaLenha;