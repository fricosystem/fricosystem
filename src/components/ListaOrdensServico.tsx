import React, { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  criadoEm: Timestamp;
  status: string;
}

const ListaOrdensServico = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);

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
      ordem.setor.toLowerCase().includes(searchValue) ||
      ordem.equipamento.toLowerCase().includes(searchValue) ||
      ordem.descricaoMotivo.toLowerCase().includes(searchValue) ||
      ordem.responsavelManutencao.toLowerCase().includes(searchValue)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Lista de Ordens de Serviço</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Buscar por setor, equipamento, descrição..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-md mx-auto"
          />
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
                    <TableCell>
                      {ordem.criadoEm && format(ordem.criadoEm.toDate(), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
                          <DialogContent className="max-w-3xl">
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
                                  <h4 className="font-semibold text-sm text-gray-500">Linha Parada</h4>
                                  <p>{selectedOrdem.linhaParada || "Não informado"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Descrição do Motivo</h4>
                                  <p>{selectedOrdem.descricaoMotivo}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Origem da Parada</h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedOrdem.origemParada.automatizacao && <Badge>Automatização</Badge>}
                                    {selectedOrdem.origemParada.terceiros && <Badge>Terceiros</Badge>}
                                    {selectedOrdem.origemParada.eletrica && <Badge>Elétrica</Badge>}
                                    {selectedOrdem.origemParada.mecanica && <Badge>Mecânica</Badge>}
                                    {selectedOrdem.origemParada.outro && <Badge>Outro</Badge>}
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Responsável pela Manutenção</h4>
                                  <p>{selectedOrdem.responsavelManutencao || "Não informado"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-gray-500">Observação</h4>
                                  <p>{selectedOrdem.observacao || "Não informado"}</p>
                                </div>
                                <div className="md:col-span-2 mt-4">
                                  <h4 className="font-semibold text-sm text-gray-500">Alterar Status</h4>
                                  <div className="flex space-x-2 mt-2">
                                    <Button 
                                      variant={selectedOrdem.status === "pendente" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "pendente")}
                                    >
                                      Pendente
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "em_andamento" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "em_andamento")}
                                    >
                                      Em Andamento
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "concluido" ? "default" : "outline"} 
                                      size="sm"
                                      className="dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "concluido")}
                                    >
                                      Concluído
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`
                              ${ordem.status === "pendente" ? "dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}
                            `}
                            onClick={() => handleStatusChange(ordem.id, "pendente")}
                          >
                            Pendente
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`
                              ${ordem.status === "em_andamento" ? "dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}
                            `}
                            onClick={() => handleStatusChange(ordem.id, "em_andamento")}
                          >
                            Em Andamento
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`
                              ${ordem.status === "concluido" ? "dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800" : "dark:bg-gray-700 dark:hover:bg-gray-600"}
                            `}
                            onClick={() => handleStatusChange(ordem.id, "concluido")}
                          >
                            Concluído
                          </Button>
                        </div>
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

