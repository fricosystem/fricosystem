import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Combobox = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  loading = false,
  disabled = false,
  className
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {loading ? "Carregando..." : (selectedOption?.label || placeholder)}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        )}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    option.value === value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
