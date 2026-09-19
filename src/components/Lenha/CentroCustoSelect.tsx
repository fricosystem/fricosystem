import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface CentroCusto {
  id: string;
  nome: string;
  unidade: string;
}

interface CentroCustoSelectProps {
  value: string;
  onChange: (centroCusto: string) => void;
}

export function CentroCustoSelect({ value, onChange }: CentroCustoSelectProps) {
  const [open, setOpen] = useState(false);
  
  const { data: centrosCusto = [] } = useQuery({
    queryKey: ["centro_de_custo"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "centro_de_custo"));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          unidade: doc.data().unidade,
        })) as CentroCusto[];
      } catch (error) {
        console.error("Erro ao buscar centros de custo:", error);
        return [];
      }
    }
  });

  const selectedCentroCusto = centrosCusto.find(c => c.nome === value);
  
  const handleSelect = (centroCustoNome: string) => {
    onChange(centroCustoNome);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Selecione um centro de custo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar centro de custo..." />
          <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {centrosCusto.map((centro) => (
              <CommandItem
                key={centro.id}
                value={centro.nome}
                onSelect={() => handleSelect(centro.nome)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === centro.nome ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {centro.nome}
                </div>
                <span className="text-sm text-muted-foreground">
                  {centro.unidade}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
