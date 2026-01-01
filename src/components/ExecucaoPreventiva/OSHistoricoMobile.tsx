import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, ClipboardCheck, Clock, Package, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemFinalizada {
  id: string;
  setor: string;
  equipamento: string;
  descricao: string;
  responsavelChamado: string;
  manutentorNome: string;
  origensParada: string[];
  solucaoAplicada: string;
  observacoes: string;
  tempoTotal: number;
  tempoFormatado: string;
  inicioExecucao: Timestamp;
  fimExecucao: Timestamp;
  finalizadoEm: Timestamp;
  produtosUtilizados: {
    id: string;
    nome: string;
    codigo_estoque: string;
    quantidade: number;
    unidade_de_medida: string;
  }[];
}

export function OSHistoricoMobile() {
  const [ordensConcluidas, setOrdensConcluidas] = useState<OrdemFinalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemFinalizada | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const ordensRef = collection(db, "ordens_servico_finalizada");
    const q = query(ordensRef, orderBy("finalizadoEm", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrdemFinalizada[];
      setOrdensConcluidas(ordens);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDetails = (os: OrdemFinalizada) => {
    setSelectedOS(os);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Histórico de OS</h2>
        <Badge variant="secondary">{ordensConcluidas.length}</Badge>
      </div>

      {ordensConcluidas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ordem de serviço finalizada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordensConcluidas.map((os) => (
            <Card 
              key={os.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenDetails(os)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{os.equipamento}</p>
                    <p className="text-sm text-muted-foreground truncate">{os.setor}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{os.tempoFormatado}</span>
                      <User className="h-3 w-3 text-muted-foreground ml-2" />
                      <span className="text-xs text-muted-foreground truncate">{os.manutentorNome}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      Concluída
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {os.finalizadoEm && format(os.finalizadoEm.toDate(), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-500" />
              Detalhes da OS Concluída
            </DialogTitle>
          </DialogHeader>
          
          {selectedOS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium">{selectedOS.setor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipamento</p>
                  <p className="font-medium">{selectedOS.equipamento}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedOS.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{selectedOS.responsavelChamado}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manutentor</p>
                  <p className="font-medium">{selectedOS.manutentorNome}</p>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Tempo de Execução</p>
                  <p className="text-xl font-bold text-primary">{selectedOS.tempoFormatado}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Início
                  </p>
                  <p className="font-medium text-sm">
                    {selectedOS.inicioExecucao && format(
                      selectedOS.inicioExecucao instanceof Timestamp 
                        ? selectedOS.inicioExecucao.toDate() 
                        : new Date(selectedOS.inicioExecucao), 
                      "dd/MM/yyyy HH:mm", 
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fim
                  </p>
                  <p className="font-medium text-sm">
                    {selectedOS.fimExecucao && format(
                      selectedOS.fimExecucao instanceof Timestamp 
                        ? selectedOS.fimExecucao.toDate() 
                        : new Date(selectedOS.fimExecucao), 
                      "dd/MM/yyyy HH:mm", 
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Solução Aplicada</p>
                <p className="font-medium bg-muted/50 rounded-lg p-2 mt-1">{selectedOS.solucaoAplicada}</p>
              </div>

              {selectedOS.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium bg-muted/50 rounded-lg p-2 mt-1">{selectedOS.observacoes}</p>
                </div>
              )}

              {selectedOS.origensParada && selectedOS.origensParada.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Origens da Parada</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOS.origensParada.map((origem, idx) => (
                      <Badge key={idx} variant="outline">{origem}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOS.produtosUtilizados && selectedOS.produtosUtilizados.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Produtos Utilizados
                  </p>
                  <div className="space-y-2">
                    {selectedOS.produtosUtilizados.map((produto, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                        <div>
                          <p className="font-medium text-sm">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">{produto.codigo_estoque}</p>
                        </div>
                        <Badge variant="secondary">
                          {produto.quantidade} {produto.unidade_de_medida}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
