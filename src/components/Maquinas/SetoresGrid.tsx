import { useMemo } from "react";
import { Plus, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SetorCard from "./SetorCard";

interface Maquina {
  id: string;
  setor: string;
  status: "Ativa" | "Inativa";
}

interface SetorInfo {
  nome: string;
  total: number;
  ativas: number;
  inativas: number;
}

interface SetoresGridProps {
  maquinas: Maquina[];
  loading: boolean;
  onSetorSelect: (setor: string) => void;
  onAddMaquina: () => void;
}

const SetoresGrid = ({ maquinas, loading, onSetorSelect, onAddMaquina }: SetoresGridProps) => {
  const setores = useMemo(() => {
    const setorMap = new Map<string, SetorInfo>();
    
    maquinas.forEach(maquina => {
      const setor = maquina.setor || "Sem Setor";
      
      if (!setorMap.has(setor)) {
        setorMap.set(setor, {
          nome: setor,
          total: 0,
          ativas: 0,
          inativas: 0
        });
      }
      
      const info = setorMap.get(setor)!;
      info.total++;
      if (maquina.status === "Ativa") {
        info.ativas++;
      } else {
        info.inativas++;
      }
    });
    
    return Array.from(setorMap.values()).sort((a, b) => 
      a.nome.localeCompare(b.nome)
    );
  }, [maquinas]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando setores...</p>
      </div>
    );
  }

  if (setores.length === 0) {
    return (
      <div className="text-center py-12">
        <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          Nenhum setor encontrado. Adicione sua primeira máquina!
        </p>
        <Button onClick={onAddMaquina} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Máquina
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{setores.length}</div>
            <p className="text-sm text-muted-foreground">Setores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{maquinas.length}</div>
            <p className="text-sm text-muted-foreground">Total de Máquinas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {maquinas.filter(m => m.status === "Ativa").length}
            </div>
            <p className="text-sm text-muted-foreground">Máquinas Ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de setores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setores.map((setor) => (
          <SetorCard
            key={setor.nome}
            setor={setor.nome}
            quantidadeMaquinas={setor.total}
            maquinasAtivas={setor.ativas}
            maquinasInativas={setor.inativas}
            onClick={() => onSetorSelect(setor.nome)}
          />
        ))}
      </div>
    </div>
  );
};

export default SetoresGrid;
