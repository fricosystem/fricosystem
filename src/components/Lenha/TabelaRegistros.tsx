import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, QueryDocumentSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, File, Edit, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ModalRecibo from "./ModalRecibo";
import ModalEditarRegistro from "@/components/Lenha/ModalEditarRegistro";
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
import { toast } from "@/components/ui/use-toast";

interface TabelaRegistrosProps {
  onClickNovo: () => void;
  atualizarDados: boolean;
}

const TabelaRegistros = ({ onClickNovo, atualizarDados }: TabelaRegistrosProps) => {
  const [registros, setRegistros] = useState<MedidaLenha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [medidaSelecionada, setMedidaSelecionada] = useState<MedidaLenha | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [registroParaExcluir, setRegistroParaExcluir] = useState<string | null>(null);
  const [excluindoRegistro, setExcluindoRegistro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do Firestore
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, "medidasLenha"),
        orderBy("data", "desc")
      );
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const docs: MedidaLenha[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            docs.push({
              id: doc.id,
              data: data.data.toDate(),
              medidas: data.medidas,
              metrosCubicos: data.metrosCubicos,
              fornecedor: data.fornecedor,
              nfe: data.nfe,
              responsavel: data.responsavel,
              valorUnitario: data.valorUnitario,
              valorTotal: data.valorTotal,
              usuario: data.usuario
            });
          });
          setRegistros(docs);
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
  
  // Abre o modal de recibo
  const handleVerDetalhes = (registro: MedidaLenha, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o evento se propague
    setMedidaSelecionada(registro);
    setModalReciboAberto(true);
  };
  
  // Abre o modal de edição
  const handleEditar = (registro: MedidaLenha, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o evento se propague
    setMedidaSelecionada(registro);
    setModalEditarAberto(true);
  };
  
  // Abre o diálogo de confirmação de exclusão
  const handleExcluirConfirmacao = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o evento se propague
    setRegistroParaExcluir(id);
  };
  
  // Executa a exclusão do registro
  const handleExcluir = async () => {
    if (!registroParaExcluir) return;
    
    try {
      setExcluindoRegistro(true);
      await deleteDoc(doc(db, "medidasLenha", registroParaExcluir));
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
  
  // Formata valores para exibição
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
          <h2 className="text-xl font-bold">Histórico de Entregas</h2>
          <Button 
            onClick={onClickNovo}
            className="mt-2 md:mt-0"
          >
            <File className="mr-2 h-4 w-4" />
            Nova Medição
          </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Metros³</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>NFe</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow 
                    key={registro.id}
                    onClick={() => handleVerDetalhes(registro, new MouseEvent('click') as any)}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <TableCell>{formatarData(registro.data)}</TableCell>
                    <TableCell>{registro.metrosCubicos} m³</TableCell>
                    <TableCell>{registro.fornecedor}</TableCell>
                    <TableCell>{registro.nfe || "-"}</TableCell>
                    <TableCell>{registro.responsavel}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatarValor(registro.valorTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={(e) => handleEditar(registro, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="text-destructive hover:bg-destructive/20"
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
          )}
        </div>
      </Card>
      
      {/* Modal de recibo */}
      {medidaSelecionada && (
        <ModalRecibo
          medida={medidaSelecionada}
          isOpen={modalReciboAberto}
          onClose={() => setModalReciboAberto(false)}
        />
      )}
      
      {/* Modal de edição */}
      {medidaSelecionada && (
        <ModalEditarRegistro
          medida={medidaSelecionada}
          isOpen={modalEditarAberto}
          onClose={() => {
            setModalEditarAberto(false);
            setMedidaSelecionada(null);
          }}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
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