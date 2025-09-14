import React, { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  hrInicial: string;
  hrFinal: string;
  tempoParada: string;
  linhaParada: string;
  descricaoMotivo: string;
  observacao: string;
  origemParada: {
    automatizacao: boolean;
    terceiros: boolean;
    eletrica: boolean;
    mecanica: boolean;
    outro: boolean;
  };
  responsavelManutencao: string;
  tipoManutencao: string;
  solucaoAplicada: string;
  produtosUtilizados?: ProdutoUtilizado[];
  valorTotalProdutos?: number;
  criadoPor: string;
  criadoEm: Timestamp;
  status: string;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: string;
}

const ListaOrdensServico = () => {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);

  // Carregar usuários para exibir o nome do responsável
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usuariosRef);
        
        const usuariosData: Usuario[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || "",
            email: data.email || "",
            ativo: data.ativo || "",
          });
        });
        
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "ordens_servicos"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedOrdens: OrdemServico[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrdens.push({
          id: doc.id,
          ...doc.data()
        } as OrdemServico);
      });
      
      setOrdens(fetchedOrdens);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
      toast.error("Erro ao carregar as ordens de serviço");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredOrdens = ordens.filter((ordem) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      ordem.setor?.toLowerCase().includes(searchValue) ||
      ordem.equipamento?.toLowerCase().includes(searchValue) ||
      ordem.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      getResponsavelNome(ordem.responsavelManutencao)?.toLowerCase().includes(searchValue) ||
      ordem.tipoManutencao?.toLowerCase().includes(searchValue)
    );
  });

  const handleStatusChange = async (ordemId: string, newStatus: string) => {
    try {
      const ordemRef = doc(db, "ordens_servicos", ordemId);
      await updateDoc(ordemRef, {
        status: newStatus
      });
      
      setOrdens(prev => 
        prev.map(ordem => 
          ordem.id === ordemId ? { ...ordem, status: newStatus } : ordem
        )
      );
      
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case "concluido":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? `${usuario.nome} (${usuario.cargo})` : responsavelId || "Não informado";
  };

  const getOrigensParada = (origens: { automatizacao: boolean; terceiros: boolean; eletrica: boolean; mecanica: boolean; outro: boolean; }) => {
    const tipos = [];
    if (origens.automatizacao) tipos.push("Automatização");
    if (origens.terceiros) tipos.push("Terceiros");
    if (origens.eletrica) tipos.push("Elétrica");
    if (origens.mecanica) tipos.push("Mecânica");
    if (origens.outro) tipos.push("Outro");
    return tipos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Lista de Ordens de Serviço</CardTitle>
        <div className="mt-4 flex justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por setor, equipamento, responsável..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 w-80"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Carregando ordens...</span>
          </div>
        ) : filteredOrdens.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdens.map((ordem) => (
                  <TableRow key={ordem.id}>
                    <TableCell>{ordem.setor}</TableCell>
                    <TableCell>{ordem.equipamento}</TableCell>
                    <TableCell>{ordem.tipoManutencao}</TableCell>
                    <TableCell>
                      {ordem.criadoEm && format(ordem.criadoEm.toDate(), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="dark:bg-gray-700 dark:hover:bg-gray-600"
                              onClick={() => setSelectedOrdem(ordem)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
                            </DialogHeader>
                            {selectedOrdem && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Setor</h4>
                                  <p>{selectedOrdem.setor}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Equipamento</h4>
                                  <p>{selectedOrdem.equipamento}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Tipo de Manutenção</h4>
                                  <p>{selectedOrdem.tipoManutencao || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Linha Parada</h4>
                                  <p>{selectedOrdem.linhaParada || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Hora Inicial</h4>
                                  <p>{selectedOrdem.hrInicial || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Hora Final</h4>
                                  <p>{selectedOrdem.hrFinal || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Tempo de Parada</h4>
                                  <p>{selectedOrdem.tempoParada || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-500">Criado Em</h4>
                                  <p>{selectedOrdem.criadoEm && format(selectedOrdem.criadoEm.toDate(), "dd/MM/yyyy HH:mm")}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Responsável pela Manutenção</h4>
                                  <p>{getResponsavelNome(selectedOrdem.responsavelManutencao)}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Descrição do Motivo</h4>
                                  <p>{selectedOrdem.descricaoMotivo}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Solução Aplicada</h4>
                                  <p>{selectedOrdem.solucaoAplicada || "Não informado"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Origem da Parada</h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedOrdem.origemParada && getOrigensParada(selectedOrdem.origemParada).map((origem, index) => (
                                      <Badge key={index}>{origem}</Badge>
                                    ))}
                                    {(!selectedOrdem.origemParada || getOrigensParada(selectedOrdem.origemParada).length === 0) && 
                                      <span className="text-gray-500">Não informado</span>
                                    }
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Observação</h4>
                                  <p>{selectedOrdem.observacao || "Não informado"}</p>
                                </div>

                                {/* Seção de Produtos Utilizados */}
                                {selectedOrdem.produtosUtilizados && selectedOrdem.produtosUtilizados.length > 0 && (
                                  <div className="md:col-span-2">
                                    <h4 className="font-semibold text-sm text-gray-500">Produtos Utilizados</h4>
                                    <div className="mt-2 border rounded-lg divide-y">
                                      {selectedOrdem.produtosUtilizados.map((produto, index) => (
                                        <div key={index} className="p-3 flex justify-between items-center">
                                          <div>
                                            <p className="font-medium">{produto.nome}</p>
                                            <p className="text-sm text-gray-500">
                                              {produto.quantidade} x {formatCurrency(produto.valorUnitario)} = {formatCurrency(produto.valorTotal)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 text-right font-semibold">
                                      Total: {selectedOrdem.valorTotalProdutos ? formatCurrency(selectedOrdem.valorTotalProdutos) : "R$ 0,00"}
                                    </div>
                                  </div>
                                )}

                                <div className="md:col-span-2 mt-4">
                                  <h4 className="font-semibold text-sm text-gray-500">Alterar Status</h4>
                                   <div className="flex space-x-2 mt-2">
                                    <Button 
                                      variant={selectedOrdem.status === "pendente" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "pendente")}
                                      disabled={selectedOrdem.status === "pendente"}
                                    >
                                      Pendente
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "em_andamento" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "em_andamento")}
                                      disabled={selectedOrdem.status === "em_andamento"}
                                    >
                                      Em Andamento
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "concluido" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "concluido")}
                                      disabled={selectedOrdem.status === "concluido"}
                                    >
                                      Concluído
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {ordem.status !== "concluido" && (
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={`${ordem.status === "pendente" ? "dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}`}
                              onClick={() => handleStatusChange(ordem.id, "pendente")}
                            >
                              Pendente
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={`${ordem.status === "em_andamento" ? "dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}`}
                              onClick={() => handleStatusChange(ordem.id, "em_andamento")}
                            >
                              Em Andamento
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={`${ordem.status === "concluido" ? "dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}`}
                              onClick={() => handleStatusChange(ordem.id, "concluido")}
                            >
                              Concluído
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListaOrdensServico;