import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface ParadaMaquina {
  id: string;
  setor: string;
  equipamento: string;
  hrInicial: string;
  hrFinal: string;
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
  produtosUtilizados: ProdutoUtilizado[];
  valorTotalProdutos: number;
  criadoPor: string;
  criadoEm: Timestamp;
  status: string;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
}

export function HistoricoParadasMobile() {
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);

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
          });
        });
        
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const fetchParadas = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "paradas_maquina"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedParadas: ParadaMaquina[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar apenas paradas concluídas
        if (data.status === "concluido") {
          fetchedParadas.push({
            id: doc.id,
            ...data
          } as ParadaMaquina);
        }
      });
      
      setParadas(fetchedParadas);
    } catch (error) {
      console.error("Erro ao buscar paradas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParadas();
  }, []);

  const filteredParadas = paradas.filter((parada) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      parada.solucaoAplicada?.toLowerCase().includes(searchValue)
    );
  });

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? usuario.nome : responsavelId || "Não informado";
  };

  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    if (!origens) return [];
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no histórico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredParadas.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma parada concluída</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParadas.map((parada) => (
            <Card key={parada.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{parada.equipamento}</div>
                    <div className="text-sm text-muted-foreground">{parada.setor}</div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-[10px]">
                    Concluído
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {parada.solucaoAplicada || parada.descricaoMotivo}
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{parada.tipoManutencao || "Não informado"}</span>
                  <span>{parada.criadoEm && format(parada.criadoEm.toDate(), "dd/MM/yy HH:mm")}</span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedParada(parada)}
                    >
                      Ver Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detalhes da Parada</DialogTitle>
                    </DialogHeader>
                    {selectedParada && (
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                          <p>{selectedParada.setor}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                          <p>{selectedParada.equipamento}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                          <p>{selectedParada.tipoManutencao || "-"}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Responsável</h4>
                          <p>{getResponsavelNome(selectedParada.responsavelManutencao)}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Hora Inicial</h4>
                          <p>{selectedParada.hrInicial || "-"}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-muted-foreground">Hora Final</h4>
                          <p>{selectedParada.hrFinal || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="font-semibold text-xs text-muted-foreground">Descrição do Problema</h4>
                          <p>{selectedParada.descricaoMotivo}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="font-semibold text-xs text-muted-foreground">Solução Aplicada</h4>
                          <p>{selectedParada.solucaoAplicada || "-"}</p>
                        </div>
                        {selectedParada.origemParada && getOrigensParada(selectedParada.origemParada).length > 0 && (
                          <div className="col-span-2">
                            <h4 className="font-semibold text-xs text-muted-foreground">Origem</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getOrigensParada(selectedParada.origemParada).map((origem, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">{origem}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedParada.produtosUtilizados && selectedParada.produtosUtilizados.length > 0 && (
                          <div className="col-span-2 border-t pt-2">
                            <h4 className="font-semibold text-xs text-muted-foreground mb-2">Produtos Utilizados</h4>
                            <div className="space-y-1">
                              {selectedParada.produtosUtilizados.map((produto, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span>{produto.nome} x{produto.quantidade}</span>
                                  <span>{formatCurrency(produto.valorTotal)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-semibold text-xs pt-1 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(selectedParada.valorTotalProdutos || 0)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
