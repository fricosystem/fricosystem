import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

const FilterDropdown = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect, 
  placeholder = "All" 
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption?.label || placeholder;

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="justify-between w-full min-w-[150px] bg-background border-border hover:bg-black hover:text-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter by ${title}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="py-2">
              <button
                onClick={() => handleSelect('')}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                  selectedValue === '' ? 'bg-muted font-medium' : ''
                }`}
                role="option"
                aria-selected={selectedValue === ''}
              >
                <div className="flex items-center justify-between">
                  <span>{placeholder}</span>
                  {selectedValue === '' && <Filter className="h-3 w-3" />}
                </div>
              </button>
              
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                    selectedValue === option.value ? 'bg-muted font-medium' : ''
                  }`}
                  role="option"
                  aria-selected={selectedValue === option.value}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <div className="flex items-center gap-2">
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">({option.count})</span>
                      )}
                      {selectedValue === option.value && <Filter className="h-3 w-3" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;