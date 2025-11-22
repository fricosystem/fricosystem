import { useState, useEffect } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  fornecedor: string;
  deposito: string;
  status: string;
  estoque: string;
}

export const FilterBar = ({ onFiltersChange }: FilterBarProps) => {
  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [depositos, setDepositos] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    fornecedor: "todos",
    deposito: "todos",
    status: "ativos",
    estoque: "todos",
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const fetchFilterOptions = async () => {
    try {
      // Buscar fornecedores únicos
      const fornecedoresSnapshot = await getDocs(collection(db, "fornecedores"));
      const fornecedoresData = fornecedoresSnapshot.docs.map(doc => doc.data().nome);
      setFornecedores([...new Set(fornecedoresData)]);

      // Buscar depósitos únicos
      const depositosSnapshot = await getDocs(collection(db, "depositos"));
      const depositosData = depositosSnapshot.docs.map(doc => doc.data().nome);
      setDepositos([...new Set(depositosData)]);
    } catch (error) {
      console.error("Erro ao buscar opções de filtro:", error);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fornecedor: "todos",
      deposito: "todos",
      status: "ativos",
      estoque: "todos",
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value, index) => {
      const keys = Object.keys(filters);
      const key = keys[index];
      return key === "status" ? value !== "ativos" : value !== "todos";
    }
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fornecedor" className="text-xs text-muted-foreground">
            Fornecedor
          </Label>
          <Select
            value={filters.fornecedor}
            onValueChange={(value) => handleFilterChange("fornecedor", value)}
          >
            <SelectTrigger id="fornecedor" className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {fornecedores.map((fornecedor) => (
                <SelectItem key={fornecedor} value={fornecedor}>
                  {fornecedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deposito" className="text-xs text-muted-foreground">
            Depósito
          </Label>
          <Select
            value={filters.deposito}
            onValueChange={(value) => handleFilterChange("deposito", value)}
          >
            <SelectTrigger id="deposito" className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {depositos.map((deposito) => (
                <SelectItem key={deposito} value={deposito}>
                  {deposito}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-xs text-muted-foreground">
            Status
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger id="status" className="h-9">
              <SelectValue placeholder="Ativos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoque" className="text-xs text-muted-foreground">
            Estoque
          </Label>
          <Select
            value={filters.estoque}
            onValueChange={(value) => handleFilterChange("estoque", value)}
          >
            <SelectTrigger id="estoque" className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">Estoque Baixo</SelectItem>
              <SelectItem value="zerado">Zerado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
