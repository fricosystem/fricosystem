import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Palette } from "lucide-react";

interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: 'button' | 'text' | 'card' | 'general';
  styles: Record<string, string>;
  preview?: string;
}

interface StylePresetsProps {
  onApplyPreset: (styles: Record<string, string>) => void;
}

const PRESETS: StylePreset[] = [
  // Botões
  {
    id: 'btn-primary',
    name: 'Botão Primary',
    description: 'Botão com estilo principal',
    category: 'button',
    styles: {
      'background-color': '#3b82f6',
      'color': '#ffffff',
      'padding': '12px 24px',
      'border-radius': '8px',
      'border': 'none',
      'font-weight': '600',
      'cursor': 'pointer',
      'transition': 'all 0.3s ease'
    }
  },
  {
    id: 'btn-outline',
    name: 'Botão Outline',
    description: 'Botão com borda',
    category: 'button',
    styles: {
      'background-color': 'transparent',
      'color': '#3b82f6',
      'padding': '12px 24px',
      'border-radius': '8px',
      'border': '2px solid #3b82f6',
      'font-weight': '600',
      'cursor': 'pointer',
      'transition': 'all 0.3s ease'
    }
  },
  {
    id: 'btn-gradient',
    name: 'Botão Gradiente',
    description: 'Botão com gradiente moderno',
    category: 'button',
    styles: {
      'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'color': '#ffffff',
      'padding': '12px 24px',
      'border-radius': '12px',
      'border': 'none',
      'font-weight': '600',
      'cursor': 'pointer',
      'box-shadow': '0 4px 15px rgba(102, 126, 234, 0.4)',
      'transition': 'all 0.3s ease'
    }
  },
  // Textos
  {
    id: 'text-hero',
    name: 'Título Hero',
    description: 'Título grande e chamativo',
    category: 'text',
    styles: {
      'font-size': '48px',
      'font-weight': '800',
      'line-height': '1.2',
      'letter-spacing': '-0.02em',
      'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent'
    }
  },
  {
    id: 'text-subtitle',
    name: 'Subtítulo',
    description: 'Texto secundário elegante',
    category: 'text',
    styles: {
      'font-size': '20px',
      'font-weight': '400',
      'line-height': '1.6',
      'color': '#64748b',
      'letter-spacing': '0.01em'
    }
  },
  {
    id: 'text-emphasis',
    name: 'Texto Destaque',
    description: 'Texto com ênfase visual',
    category: 'text',
    styles: {
      'font-size': '18px',
      'font-weight': '600',
      'color': '#3b82f6',
      'background-color': '#eff6ff',
      'padding': '4px 12px',
      'border-radius': '6px',
      'display': 'inline-block'
    }
  },
  // Cards
  {
    id: 'card-elevated',
    name: 'Card Elevado',
    description: 'Card com sombra suave',
    category: 'card',
    styles: {
      'background-color': '#ffffff',
      'border-radius': '16px',
      'padding': '24px',
      'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'border': '1px solid rgba(0, 0, 0, 0.05)',
      'transition': 'all 0.3s ease'
    }
  },
  {
    id: 'card-glass',
    name: 'Card Glass',
    description: 'Card com efeito glassmorphism',
    category: 'card',
    styles: {
      'background': 'rgba(255, 255, 255, 0.7)',
      'backdrop-filter': 'blur(10px)',
      'border-radius': '20px',
      'padding': '24px',
      'border': '1px solid rgba(255, 255, 255, 0.3)',
      'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
    }
  },
  {
    id: 'card-neon',
    name: 'Card Neon',
    description: 'Card com borda neon',
    category: 'card',
    styles: {
      'background-color': '#1e293b',
      'border-radius': '16px',
      'padding': '24px',
      'border': '2px solid #3b82f6',
      'box-shadow': '0 0 20px rgba(59, 130, 246, 0.5)',
      'color': '#ffffff'
    }
  },
  // Efeitos Gerais
  {
    id: 'effect-hover-lift',
    name: 'Hover Lift',
    description: 'Elevação no hover',
    category: 'general',
    styles: {
      'transition': 'transform 0.3s ease, box-shadow 0.3s ease',
      'cursor': 'pointer'
    }
  },
  {
    id: 'effect-glow',
    name: 'Efeito Glow',
    description: 'Brilho suave',
    category: 'general',
    styles: {
      'box-shadow': '0 0 20px rgba(59, 130, 246, 0.6)',
      'transition': 'box-shadow 0.3s ease'
    }
  },
  {
    id: 'effect-blur',
    name: 'Blur Background',
    description: 'Fundo desfocado',
    category: 'general',
    styles: {
      'backdrop-filter': 'blur(10px)',
      'background': 'rgba(255, 255, 255, 0.8)'
    }
  }
];

const StylePresets: React.FC<StylePresetsProps> = ({ onApplyPreset }) => {
  const categories = {
    button: { name: 'Botões', icon: '🔘' },
    text: { name: 'Textos', icon: '📝' },
    card: { name: 'Cards', icon: '🃏' },
    general: { name: 'Efeitos', icon: '✨' }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <CardTitle className="text-lg">Estilos Predefinidos</CardTitle>
        </div>
        <CardDescription>
          Aplique estilos profissionais com um clique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {Object.entries(categories).map(([categoryKey, categoryData]) => {
              const categoryPresets = PRESETS.filter(p => p.category === categoryKey);
              
              if (categoryPresets.length === 0) return null;
              
              return (
                <div key={categoryKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{categoryData.icon}</span>
                    <h3 className="font-semibold text-sm">{categoryData.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {categoryPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{preset.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApplyPreset(preset.styles)}
                            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Aplicar
                          </Button>
                        </div>
                        
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs font-mono">
                          <div className="space-y-0.5">
                            {Object.entries(preset.styles).slice(0, 3).map(([key, value], idx) => (
                              <div key={idx} className="text-muted-foreground truncate">
                                <span className="text-primary">{key}:</span> {value}
                              </div>
                            ))}
                            {Object.keys(preset.styles).length > 3 && (
                              <div className="text-muted-foreground/50">
                                +{Object.keys(preset.styles).length - 3} propriedades
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StylePresets;
