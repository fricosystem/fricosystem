import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Fornecedor } from "@/types/typesLenha";

interface FornecedorSelectProps {
  value: string;
  onChange: (fornecedor: string, valorUnitario: number) => void;
}

export function FornecedorSelect({ value, onChange }: FornecedorSelectProps) {
  const [open, setOpen] = useState(false);
  
  // Busca fornecedores do Firestore
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedoreslenha"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "fornecedoreslenha"));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Fornecedor[];
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        return [];
      }
    }
  });

  const selectedFornecedor = fornecedores.find(f => f.nome === value);
  
  // Ao selecionar um fornecedor, propaga o valor unitário também
  const handleSelect = (fornecedorNome: string) => {
    const fornecedor = fornecedores.find(f => f.nome === fornecedorNome);
    if (fornecedor) {
      onChange(fornecedorNome, fornecedor.valorUnitario || 0);
    } else {
      onChange(fornecedorNome, 0);
    }
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
          {value || "Selecione um fornecedor..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar fornecedor..." />
          <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {fornecedores.map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={fornecedor.nome}
                onSelect={() => handleSelect(fornecedor.nome)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === fornecedor.nome ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {fornecedor.nome}
                </div>
                <span className="text-sm text-muted-foreground">
                  R$ {(fornecedor.valorUnitario ?? 0).toFixed(2)}/m³
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
