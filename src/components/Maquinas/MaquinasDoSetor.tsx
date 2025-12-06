import { useMemo } from "react";
import { ArrowLeft, Search, Camera, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Maquina {
  id: string;
  equipamento: string;
  patrimonio: string;
  setor: string;
  tag: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
}

interface MaquinasDoSetorProps {
  setor: string;
  maquinas: Maquina[];
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onVoltar: () => void;
  onEdit: (maquina: Maquina) => void;
  onDelete: (id: string) => void;
  onVerDetalhes: (id: string) => void;
}

const MaquinasDoSetor = ({
  setor,
  maquinas,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onVoltar,
  onEdit,
  onDelete,
  onVerDetalhes
}: MaquinasDoSetorProps) => {
  const maquinasFiltradas = useMemo(() => {
    let filtered = maquinas.filter(m => m.setor === setor);

    if (searchTerm) {
      filtered = filtered.filter(maquina =>
        maquina.equipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maquina.patrimonio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todas") {
      filtered = filtered.filter(maquina => maquina.status === statusFilter);
    }

    return filtered;
  }, [maquinas, setor, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: maquinasFiltradas.length,
    ativas: maquinasFiltradas.filter(m => m.status === "Ativa").length,
    inativas: maquinasFiltradas.filter(m => m.status === "Inativa").length,
  }), [maquinasFiltradas]);

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onVoltar}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{setor}</h2>
          <p className="text-muted-foreground">
            {stats.total} {stats.total === 1 ? 'máquina' : 'máquinas'} neste setor
          </p>
        </div>
      </div>

      {/* Stats do setor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inativas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar máquinas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="Ativa">Ativas</SelectItem>
            <SelectItem value="Inativa">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de máquinas */}
      {maquinasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todas"
              ? "Nenhuma máquina encontrada com os filtros aplicados."
              : "Nenhuma máquina neste setor."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {maquinasFiltradas.map((maquina) => (
            <Card key={maquina.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <img
                  src={maquina.imagemUrl}
                  alt={maquina.equipamento}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={maquina.status === "Ativa" ? "default" : "secondary"}>
                    {maquina.status}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{maquina.equipamento}</CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Patrimônio: {maquina.patrimonio}</p>
                  <p>Tag: {maquina.tag}</p>
                </div>
                {maquina.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {maquina.descricao}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => onVerDetalhes(maquina.id)}
                    className="w-full"
                  >
                    Ver Detalhes
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(maquina)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(maquina.id)}
                      className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaquinasDoSetor;
