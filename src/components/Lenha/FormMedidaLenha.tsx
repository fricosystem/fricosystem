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
  const [chavePixFornecedor, setChavePixFornecedor] = useState(""); // Novo estado para armazenar a chave Pix
  
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
        setMetrosCubicos(Number(cubagem.toFixed(2)));
        
        // Calcula valor total
        const total = cubagem * valorUnitario;
        setValorTotal(Number(total.toFixed(2)));
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
  const handleFornecedorChange = async (novoFornecedor: string, novoValorUnitario: number) => {
    setFornecedor(novoFornecedor);
    setValorUnitario(novoValorUnitario);
    
    // Busca a chave Pix do fornecedor no Firestore
    if (novoFornecedor) {
      try {
        const fornecedorRef = doc(db, "fornecedoreslenha", novoFornecedor);
        const fornecedorDoc = await getDoc(fornecedorRef);
        
        if (fornecedorDoc.exists()) {
          const fornecedorData = fornecedorDoc.data();
          setChavePixFornecedor(fornecedorData.chavePix || "");
        } else {
          setChavePixFornecedor("");
        }
      } catch (error) {
        console.error("Erro ao buscar chave Pix do fornecedor:", error);
        setChavePixFornecedor("");
      }
    } else {
      setChavePixFornecedor("");
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
        chavePixFornecedor, // Adiciona a chave Pix ao objeto que será salvo
      };
      
      // Salva no Firestore
      const medidaRef = await addDoc(collection(db, "medidas_lenha"), novaMedida);
      
      // Salvar relatório da cubagem/lenha
      const relatorioData = {
        requisicao_id: medidaRef.id,
        produto_id: medidaRef.id,
        codigo_material: medidaRef.id, // Usando o ID como código para lenha
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
        centro_de_custo: fornecedor,
        unidade: 'm³',
        data_saida: Timestamp.fromDate(new Date()),
        data_registro: Timestamp.fromDate(new Date()),
        nfe: nfe || null,
        fornecedor: fornecedor,
        responsavel: userData?.nome || "Usuário não identificado"
      };

      await addDoc(collection(db, "relatorios"), relatorioData);
      
      toast({
        title: "Registro salvo com sucesso!",
        description: `${metrosCubicos} m³ de lenha registrados.`,
      });
      
      // Limpa o formulário
      setMedidas([0, 0, 0, 0, 0, 0]);
      setComprimento(0);
      setLargura(0);
      setFornecedor("");
      setNfe("");
      setValorUnitario(0);
      setChavePixFornecedor(""); // Limpa a chave Pix também
      
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
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">Nova Medição de Lenha</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-6">
        <form onSubmit={handleSalvar} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna 1 - Informações da Entrega */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fornecedor" className="text-base">Fornecedor*</Label>
                <FornecedorSelect 
                  value={fornecedor} 
                  onChange={handleFornecedorChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nfe" className="text-base">Nota Fiscal</Label>
                <Input 
                  id="nfe"
                  value={nfe}
                  onChange={(e) => setNfe(e.target.value)}
                  placeholder="Número da NF-e"
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-base">Responsável</Label>
                <Input 
                  id="responsavel"
                  value={userData?.nome || ""}
                  disabled
                  className="h-12 text-base bg-muted cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valorUnitario" className="text-base">Valor Unitário (R$/m³)*</Label>
                <Input 
                  id="valorUnitario"
                  type="number" 
                  min="0.01"
                  step="0.01"
                  value={valorUnitario || ""}
                  onChange={(e) => {/* Removida capacidade de edição */}}
                  placeholder="0,00"
                  readOnly={true}
                  className="h-12 text-base bg-muted cursor-not-allowed"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor definido automaticamente quando o fornecedor é selecionado
                </p>
              </div>
              
              <div className="bg-secondary p-6 rounded-lg mt-6">
                <h3 className="font-medium text-lg mb-4">Resumo do Cálculo</h3>
                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>Altura Média:</div>
                  <div className="font-medium">{alturaMedia} m</div>
                  
                  <div>Metros Cúbicos:</div>
                  <div className="font-medium">{metrosCubicos} m³</div>
                  
                  <div>Valor Total:</div>
                  <div className="font-medium text-lg">R$ {valorTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            {/* Coluna 2 - Medidas */}
            <div className="space-y-6">
              <h3 className="font-medium text-lg mb-2">Dimensões da Carga*</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="comprimento" className="text-base">Comprimento (metros)*</Label>
                  <Input
                    id="comprimento"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={comprimento || ""}
                    onChange={(e) => setComprimento(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="largura" className="text-base">Largura (metros)*</Label>
                  <Input
                    id="largura"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={largura || ""}
                    onChange={(e) => setLargura(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>
              
              <h3 className="font-medium text-lg mb-2 mt-6">Medidas de Altura (metros)*</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {medidas.map((medida, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`medida-${index}`} className="text-base">Altura {index + 1}</Label>
                    <Input
                      id={`medida-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={medida || ""}
                      onChange={(e) => handleMedidaChange(index, e.target.value)}
                      placeholder="0,00"
                      required
                      className="h-12 text-base"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm mb-2">
                  * Campos obrigatórios
                </p>
                <p className="text-sm font-medium">
                  Fórmula de cálculo:
                </p>
                <p className="text-sm">
                  Cubagem = Altura Média × Comprimento × Largura
                </p>
                <p className="text-sm mt-2">
                  As medidas de altura devem ser tomadas em 6 pontos diferentes da carga.
                </p>
              </div>
            </div>
          </div>
          
          <CardFooter className="flex justify-end p-0 pt-6 gap-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
                className="h-12 px-6 text-base"
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || !medidas.every(m => m > 0) || comprimento <= 0 || largura <= 0}
              className="h-12 px-6 text-base"
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