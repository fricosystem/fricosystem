import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShoppingCart, Filter, MessageSquare, Check } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface Compra {
  id: string;
  material: string;
  quantidade: number;
  unidade: string;
  valorUnitario?: number;
  fornecedorNome?: string;
  codigoMaterial?: string;
  status: string;
  prioridade?: string;
  observacao: string;
  contato?: string;
  criadoPor: string;
  criadoEm: Timestamp;
  compradoPor?: {
    nome: string;
    email: string;
    id: string;
  };
  compradoEm?: Timestamp;
}

const Compras = () => {
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [comprasFiltradas, setComprasFiltradas] = useState<Compra[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  const buscarCompras = async () => {
    try {
      setLoading(true);
      const comprasRef = collection(db, "pedidos");
      const q = query(comprasRef, orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const comprasData: Compra[] = [];
      querySnapshot.forEach((doc) => {
        comprasData.push({
          id: doc.id,
          ...doc.data()
        } as Compra);
      });
      
      setCompras(comprasData);
      aplicarFiltro(comprasData, filtroStatus);
    } catch (error) {
      console.error("Erro ao buscar compras:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as compras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarCompras();
  }, []);

  const aplicarFiltro = (comprasData: Compra[], status: string) => {
    if (status === "todos") {
      setComprasFiltradas(comprasData);
    } else {
      setComprasFiltradas(comprasData.filter(compra => compra.status === status));
    }
  };

  useEffect(() => {
    aplicarFiltro(compras, filtroStatus);
  }, [filtroStatus, compras]);

  const marcarComoComprado = async (compra: Compra) => {
    if (!user || !userData) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar o status do pedido
      const compraRef = doc(db, "pedidos", compra.id);
      await updateDoc(compraRef, {
        status: "realizado",
        compradoPor: {
          nome: userData.nome || user.displayName || user.email || "Usuário desconhecido",
          email: user.email || "Email não disponível",
          id: user.uid
        },
        compradoEm: serverTimestamp()
      });
      
      toast({
        title: "Compra realizada",
        description: `A compra de ${compra.material} foi marcada como realizada.`,
      });
      
      buscarCompras();
    } catch (error) {
      console.error("Erro ao atualizar status da compra:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da compra.",
        variant: "destructive",
      });
    }
  };

  const formatarData = (data: Timestamp) => {
    return format(data.toDate(), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "realizado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPrioridadeBadgeClass = (prioridade?: string) => {
    switch (prioridade) {
      case "urgente":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "normal":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const abrirWhatsApp = (contato?: string) => {
    if (!contato) {
      toast({
        title: "Contato não disponível",
        description: "Este fornecedor não possui contato cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    const numeroLimpo = contato.replace(/\D/g, '');
    
    if (numeroLimpo.length < 8) {
      toast({
        title: "Contato inválido",
        description: "O número de contato parece ser inválido.",
        variant: "destructive",
      });
      return;
    }
    
    const url = `https://wa.me/${numeroLimpo}`;
    window.open(url, '_blank');
  };

  return (
    <AppLayout title="Compras">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {comprasFiltradas.length} compras encontradas
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {comprasFiltradas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Comprado por</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comprasFiltradas.map((compra) => (
                        <TableRow key={compra.id}>
                          <TableCell>
                            <div>
                              <div>{compra.material}</div>
                              {compra.codigoMaterial && (
                                <div className="text-xs text-muted-foreground">
                                  Cód: {compra.codigoMaterial}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{compra.quantidade} {compra.unidade}</TableCell>
                          <TableCell>
                            {compra.valorUnitario ? (
                              <>{formatarValor(compra.valorUnitario * compra.quantidade)}</>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {compra.fornecedorNome || '-'}
                              {compra.contato && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => abrirWhatsApp(compra.contato)}
                                  title="Enviar mensagem pelo WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeBadgeClass(compra.prioridade)}`}>
                              {(compra.prioridade || "Normal").charAt(0).toUpperCase() + (compra.prioridade || "Normal").slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(compra.status)}`}>
                              {compra.status.charAt(0).toUpperCase() + compra.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {compra.compradoEm 
                              ? formatarData(compra.compradoEm) 
                              : compra.criadoEm 
                                ? formatarData(compra.criadoEm)
                                : "-"}
                          </TableCell>
                          <TableCell>
                            {compra.compradoPor ? (
                              <div className="text-sm">
                                <div className="font-medium text-foreground">{compra.compradoPor.nome}</div>
                                <div className="text-xs text-muted-foreground">{compra.compradoPor.email}</div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {compra.status === "pendente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => marcarComoComprado(compra)}
                                title="Marcar como comprado"
                              >
                                <Check className="mr-1 h-4 w-4" /> Comprado
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold">Nenhuma compra encontrada</p>
                  <p className="text-muted-foreground mt-2">
                    {filtroStatus !== "todos"
                      ? `Não há compras com status "${filtroStatus}".`
                      : "Registre pedidos para visualizar as compras."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Compras;