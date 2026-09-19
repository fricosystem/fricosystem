import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Type, Palette, Layout, Square, Save, X } from "lucide-react";

interface SelectedElement {
  id: string;
  tagName: string;
  textContent?: string;
  styles: Record<string, string>; // Mudança: agora é um objeto plain, não CSSStyleDeclaration
  className?: string;
  rect: DOMRect;
}

interface VisualEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: SelectedElement | null;
  onApplyChanges: (changes: ElementChanges) => void;
}

interface ElementChanges {
  text?: string;
  styles: Record<string, string>;
  className?: string;
}

const VisualEditModal: React.FC<VisualEditModalProps> = ({
  isOpen,
  onClose,
  selectedElement,
  onApplyChanges
}) => {
  const [changes, setChanges] = useState<ElementChanges>({
    styles: {},
    text: selectedElement?.textContent || ''
  });

  const handleStyleChange = (property: string, value: string) => {
    setChanges(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [property]: value
      }
    }));
  };

  const handleTextChange = (value: string) => {
    setChanges(prev => ({
      ...prev,
      text: value
    }));
  };

  const handleApply = () => {
    onApplyChanges(changes);
    onClose();
  };

  const getCurrentValue = (property: string) => {
    return changes.styles[property] || selectedElement?.styles[property] || '';
  };

  if (!selectedElement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            Editar {selectedElement.tagName.toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              Estilo
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-1">
              <Layout className="h-3 w-3" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="border" className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              Borda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-3">
              <Label>Conteúdo do Texto</Label>
              <Input
                value={changes.text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Digite o texto..."
              />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho da Fonte</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('font-size')) || 16]}
                    onValueChange={([value]) => handleStyleChange('font-size', `${value}px`)}
                    max={72}
                    min={8}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('font-size')) || 16}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Peso da Fonte</Label>
                <Select 
                  value={getCurrentValue('font-weight')} 
                  onValueChange={(value) => handleStyleChange('font-weight', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light (300)</SelectItem>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Medium (500)</SelectItem>
                    <SelectItem value="600">Semi-bold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extra-bold (800)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={getCurrentValue('color') || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={getCurrentValue('color')}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={getCurrentValue('background-color') || '#ffffff'}
                    onChange={(e) => handleStyleChange('background-color', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={getCurrentValue('background-color')}
                    onChange={(e) => handleStyleChange('background-color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Largura</Label>
                <Input
                  value={getCurrentValue('width')}
                  onChange={(e) => handleStyleChange('width', e.target.value)}
                  placeholder="auto, 100px, 50%"
                />
              </div>

              <div className="space-y-2">
                <Label>Altura</Label>
                <Input
                  value={getCurrentValue('height')}
                  onChange={(e) => handleStyleChange('height', e.target.value)}
                  placeholder="auto, 100px, 50%"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Margin Top</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('margin-top')) || 0]}
                    onValueChange={([value]) => handleStyleChange('margin-top', `${value}px`)}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('margin-top')) || 0}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margin Bottom</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('margin-bottom')) || 0]}
                    onValueChange={([value]) => handleStyleChange('margin-bottom', `${value}px`)}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('margin-bottom')) || 0}px
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Padding Horizontal</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('padding-left')) || 0]}
                    onValueChange={([value]) => {
                      handleStyleChange('padding-left', `${value}px`);
                      handleStyleChange('padding-right', `${value}px`);
                    }}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('padding-left')) || 0}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Padding Vertical</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('padding-top')) || 0]}
                    onValueChange={([value]) => {
                      handleStyleChange('padding-top', `${value}px`);
                      handleStyleChange('padding-bottom', `${value}px`);
                    }}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('padding-top')) || 0}px
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="border" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Espessura</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(getCurrentValue('border-width')) || 0]}
                    onValueChange={([value]) => handleStyleChange('border-width', `${value}px`)}
                    max={20}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseInt(getCurrentValue('border-width')) || 0}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estilo</Label>
                <Select 
                  value={getCurrentValue('border-style')} 
                  onValueChange={(value) => handleStyleChange('border-style', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Sólida</SelectItem>
                    <SelectItem value="dashed">Tracejada</SelectItem>
                    <SelectItem value="dotted">Pontilhada</SelectItem>
                    <SelectItem value="double">Dupla</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={getCurrentValue('border-color') || '#000000'}
                    onChange={(e) => handleStyleChange('border-color', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Border Radius</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[parseInt(getCurrentValue('border-radius')) || 0]}
                  onValueChange={([value]) => handleStyleChange('border-radius', `${value}px`)}
                  max={50}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {parseInt(getCurrentValue('border-radius')) || 0}px
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleApply} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Aplicar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualEditModal;