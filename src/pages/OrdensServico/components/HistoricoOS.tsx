import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ClipboardList } from "lucide-react";

interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  descricaoOS: string;
  status: string;
  dataAberturaOS: string | null;
  responsavelChamado: string;
  criadoEm: any;
}

export function HistoricoOS() {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        setLoading(true);
        const ordensRef = collection(db, "ordens_servicos");
        const q = query(ordensRef, orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);
        
        const ordensData: OrdemServico[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ordensData.push({
            id: doc.id,
            setor: data.setor || "",
            equipamento: data.equipamento || "",
            descricaoOS: data.descricaoOS || "",
            status: data.status || "aberta",
            dataAberturaOS: data.dataAberturaOS || null,
            responsavelChamado: data.responsavelChamado || "",
            criadoEm: data.criadoEm
          });
        });
        
        setOrdensServico(ordensData);
      } catch (error) {
        console.error("Erro ao buscar ordens de serviço:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdens();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberta":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Aberta</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Em Andamento</Badge>;
      case "em_execucao":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Em Execução</Badge>;
      case "concluida":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Concluída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ordensServico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma ordem de serviço registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ordensServico.map((ordem) => (
        <Card key={ordem.id} className="border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{ordem.equipamento}</h3>
                <p className="text-xs text-muted-foreground">{ordem.setor}</p>
              </div>
              {getStatusBadge(ordem.status)}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {ordem.descricaoOS}
            </p>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{ordem.responsavelChamado}</span>
              {ordem.dataAberturaOS && (
                <span>{format(new Date(ordem.dataAberturaOS), "dd/MM/yyyy", { locale: ptBR })}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
