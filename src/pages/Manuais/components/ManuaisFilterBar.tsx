import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ManuaisFilterState {
  status: "todos" | "ativos" | "inativos";
}

interface ManuaisFilterBarProps {
  onFiltersChange: (filters: ManuaisFilterState) => void;
}

const ManuaisFilterBar = ({ onFiltersChange }: ManuaisFilterBarProps) => {
  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value as ManuaisFilterState["status"] });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="w-full sm:w-auto">
        <Select defaultValue="ativos" onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ManuaisFilterBar;
