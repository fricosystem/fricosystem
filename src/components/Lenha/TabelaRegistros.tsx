import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, QueryDocumentSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
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
              chavePixFornecedor: data.chavePixFornecedor || "" // Adicionando a propriedade faltante
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
  
  const handleVerDetalhes = (registro: MedidaLenha, e: React.MouseEvent) => {
    e.stopPropagation();
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
    return format(data, "dd/MM/yyyy", { locale: ptBR });
  };
  
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  return (
    <>
      <Card className="w-full mt-6">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center border-b">
          <div className="flex gap-2 mt-2 md:mt-0">
            <Button 
              variant="outline"
              onClick={() => setModalComprovanteAberto(true)}
              className="gap-2"
            >
              <Receipt className="h-4 w-4" />
              Imprimir relatório geral
            </Button>
            <Button 
              onClick={onClickNovo}
              className="gap-2"
            >
              <File className="h-4 w-4" />
              Nova Medição
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setModalFornecedorAberto(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto p-4">
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
                    <TableHead className="min-w-[120px]">Data</TableHead>
                    <TableHead className="min-w-[100px]">NFe</TableHead>
                    <TableHead className="min-w-[100px]">Metros³</TableHead>
                    <TableHead className="min-w-[150px]">Fornecedor</TableHead>
                    <TableHead className="min-w-[140px]">Responsável</TableHead>
                    <TableHead className="min-w-[150px] text-right">Valor Total</TableHead>
                    <TableHead className="min-w-[170px]">Status</TableHead>
                    <TableHead className="min-w-[130px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow 
                      key={registro.id}
                      onClick={(e) => handleVerDetalhes(registro, e)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {formatarData(registro.data)}
                      </TableCell>
                      <TableCell>
                        {registro.nfe || "-"}
                      </TableCell>
                      <TableCell>
                        {registro.metrosCubicos} m³
                      </TableCell>
                      <TableCell className="truncate max-w-[180px]">
                        {registro.fornecedor}
                      </TableCell>
                      <TableCell>
                        {registro.responsavel}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatarValor(registro.valorTotal)}
                      </TableCell>
                      <TableCell>
                        {registro.status_envio === "enviado" ? (
                          <Badge className="gap-1 bg-green-600 text-green-100 hover:bg-gray-900">
                            <Check className="h-4 w-4" />
                            Enviado para o fornecedor
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={(e) => handleEnviar(registro.id, e)}
                          >
                           Marcar como enviado ao fornecedor
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => handleEditar(registro, e)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleExcluirConfirmacao(registro.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-muted-foreground">
                    Total de registros: <span className="font-medium">{registros.length}</span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total em metros cúbicos</span>
                    <span className="text-xl font-bold">{totalMetrosCubicos.toFixed(2)} m³</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Valor total</span>
                    <span className="text-xl font-bold text-primary">{formatarValor(totalValor)}</span>
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