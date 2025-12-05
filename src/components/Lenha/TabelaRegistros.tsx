import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, QueryDocumentSnapshot, doc, deleteDoc, updateDoc, getDocs, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge"; 
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, File, Edit, Trash2, AlertCircle, Receipt, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ModalRecibo from "./ModalRecibo";
import ModalEditarRegistro from "@/components/Lenha/ModalEditarRegistro";
import ModalFornecedor from "@/components/Lenha/ModalFornecedor";
import ModalComprovanteTotal from "./ModalComprovanteTotal";
import { MedidaLenha } from "@/types/typesLenha";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TabelaRegistrosProps {
  onClickNovo: () => void;
  atualizarDados: boolean;
}

const TabelaRegistros = ({ onClickNovo }: TabelaRegistrosProps) => {
  const [registros, setRegistros] = useState<MedidaLenha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [medidaSelecionada, setMedidaSelecionada] = useState<MedidaLenha | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalComprovanteAberto, setModalComprovanteAberto] = useState(false);
  const [registroParaExcluir, setRegistroParaExcluir] = useState<string | null>(null);
  const [excluindoRegistro, setExcluindoRegistro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMetrosCubicos, setTotalMetrosCubicos] = useState(0);
  const [totalValor, setTotalValor] = useState(0);
  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
  const [atualizarDados, setAtualizarDados] = useState(false);

  const handleEnviar = async (registroId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "medidas_lenha", registroId), {
        status_envio: "enviado"
      });
      toast({
        title: "Status atualizado",
        description: "O status foi atualizado para 'enviado'",
      });
      setAtualizarDados(prev => !prev); // Atualiza os dados após mudança
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  // Carregar dados do Firestore
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, "medidas_lenha"),
        orderBy("data", "desc")
      );
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const docs: MedidaLenha[] = [];
          let somaMetrosCubicos = 0;
          let somaValor = 0;
          
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            const comprimento = data.comprimento || 0;
            const largura = data.largura || 0;
            
            const registro: MedidaLenha = {
              id: doc.id,
              data: data.data.toDate(),
              medidas: data.medidas,
              comprimento,
              largura,
              metrosCubicos: data.metrosCubicos,
              fornecedor: data.fornecedor,
              nfe: data.nfe,
              responsavel: data.responsavel,
              valorUnitario: data.valorUnitario,
              valorTotal: data.valorTotal,
              usuario: data.usuario,
              status_envio: data.status_envio || "pendente",
              chavePixFornecedor: data.chavePixFornecedor || "",
              contatoFornecedor: data.contatoFornecedor || ""
            };
            
            docs.push(registro);
            
            somaMetrosCubicos += data.metrosCubicos;
            somaValor += data.valorTotal;
          });
          
          setRegistros(docs);
          setTotalMetrosCubicos(Number(somaMetrosCubicos.toFixed(2)));
          setTotalValor(Number(somaValor.toFixed(2)));
          setIsLoading(false);
        },
        (error) => {
          console.error("Erro ao buscar registros:", error);
          setIsLoading(false);
          setError("Não foi possível carregar os registros.");
        }
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Erro ao configurar listener:", error);
      setIsLoading(false);
      setError("Não foi possível configurar a busca de registros.");
    }
  }, [atualizarDados]);
  
  const handleVerDetalhes = async (registro: MedidaLenha, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Se não houver chave PIX ou contato, busca do fornecedor
    if (!registro.chavePixFornecedor || !registro.contatoFornecedor) {
      try {
        const fornecedoresRef = collection(db, "fornecedoreslenha");
        const fornecedoresQuery = query(fornecedoresRef, where("nome", "==", registro.fornecedor));
        const fornecedoresSnapshot = await getDocs(fornecedoresQuery);
        
        if (!fornecedoresSnapshot.empty) {
          const fornecedorData = fornecedoresSnapshot.docs[0].data();
          registro.chavePixFornecedor = fornecedorData.chavePix || "";
          registro.contatoFornecedor = fornecedorData.contato || "";
        }
      } catch (error) {
        console.error("Erro ao buscar dados do fornecedor:", error);
      }
    }
    
    setMedidaSelecionada(registro);
    setModalReciboAberto(true);
  };
  
  const handleEditar = (registro: MedidaLenha, e: React.MouseEvent) => {
    e.stopPropagation();
    setMedidaSelecionada(registro);
    setModalEditarAberto(true);
  };
  
  const handleExcluirConfirmacao = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRegistroParaExcluir(id);
  };
  
  const handleExcluir = async () => {
    if (!registroParaExcluir) return;
    
    try {
      setExcluindoRegistro(true);
      await deleteDoc(doc(db, "medidas_lenha", registroParaExcluir));
      setRegistroParaExcluir(null);
      toast({
        title: "Registro excluído",
        description: "O registro foi excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o registro",
        variant: "destructive",
      });
    } finally {
      setExcluindoRegistro(false);
    }
  };

  const handleSaveSuccess = () => {
    setAtualizarDados(prev => !prev);
  };
  
  const formatarData = (data: Date): string => {
    return format(data, "dd/MM/yyyy - HH:mm", { locale: ptBR });
  };
  
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  return (
    <>
      <Card className="w-full mt-4 md:mt-6">
        <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-3 border-b">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => setModalComprovanteAberto(true)}
              className="gap-2 w-full sm:w-auto text-xs md:text-sm h-9 md:h-10"
            >
              <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Imprimir relatório geral</span>
              <span className="sm:hidden">Relatório</span>
            </Button>
            <Button 
              onClick={onClickNovo}
              className="gap-2 w-full sm:w-auto text-xs md:text-sm h-9 md:h-10"
            >
              <File className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Nova Medição
            </Button>
          </div>
          <div className="flex">
            <Button 
              variant="outline"
              onClick={() => setModalFornecedorAberto(true)}
              className="w-full sm:w-auto text-xs md:text-sm h-9 md:h-10"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              Novo Fornecedor
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto p-3 md:p-4">
          {isLoading ? (
            <div className="text-center py-4">Carregando registros...</div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">
              {error}
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum registro encontrado. Clique em "Nova Medição" para adicionar.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[130px]">Data / Hora</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">NFe</TableHead>
                    <TableHead className="min-w-[80px]">Metros³</TableHead>
                    <TableHead className="min-w-[120px]">Fornecedor</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[120px]">Responsável</TableHead>
                    <TableHead className="min-w-[100px] text-right">Valor</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[150px]">Status</TableHead>
                    <TableHead className="min-w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow 
                      key={registro.id}
                      onClick={(e) => handleVerDetalhes(registro, e)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-sm">
                        {formatarData(registro.data)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {registro.nfe || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{registro.metrosCubicos} m³</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          NFe: {registro.nfe || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[150px] text-sm">
                        <div>{registro.fornecedor}</div>
                        <div className="text-xs text-muted-foreground lg:hidden">
                          {registro.responsavel}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {registro.responsavel}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatarValor(registro.valorTotal)}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {registro.status_envio === "enviado" ? (
                          <Badge className="gap-1 bg-green-600 text-green-100 hover:bg-gray-900 text-xs">
                            <Check className="h-3 w-3" />
                            Enviado
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => handleEnviar(registro.id, e)}
                          >
                           Marcar enviado
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={(e) => handleEditar(registro, e)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleExcluirConfirmacao(registro.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="mb-0">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Total de registros: <span className="font-medium">{registros.length}</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row md:items-center gap-3 md:gap-8 w-full md:w-auto">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm text-muted-foreground">Total em metros cúbicos</span>
                    <span className="text-lg md:text-xl font-bold">{totalMetrosCubicos.toFixed(2)} m³</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm text-muted-foreground">Valor total</span>
                    <span className="text-lg md:text-xl font-bold text-primary">{formatarValor(totalValor)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* Modais */}
      {medidaSelecionada && (
        <ModalRecibo
          medida={medidaSelecionada}
          isOpen={modalReciboAberto}
          onClose={() => setModalReciboAberto(false)}
        />
      )}
      
      {medidaSelecionada && (
        <ModalEditarRegistro
          medida={medidaSelecionada}
          isOpen={modalEditarAberto}
          onClose={() => {
            setModalEditarAberto(false);
            setMedidaSelecionada(null);
          }}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      <ModalFornecedor 
        isOpen={modalFornecedorAberto}
        onClose={() => setModalFornecedorAberto(false)}
        onSaveSuccess={handleSaveSuccess}
      />
      
      <ModalComprovanteTotal
        isOpen={modalComprovanteAberto}
        onClose={() => setModalComprovanteAberto(false)}
        totalMetrosCubicos={totalMetrosCubicos}
        totalValor={totalValor}
        itens={registros} // Adicionando a propriedade faltante
      />
      
      <AlertDialog open={!!registroParaExcluir} onOpenChange={(open) => !open && setRegistroParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoRegistro}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExcluir}
              disabled={excluindoRegistro}
              className="bg-destructive hover:bg-destructive/90"
            >
              {excluindoRegistro ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TabelaRegistros;