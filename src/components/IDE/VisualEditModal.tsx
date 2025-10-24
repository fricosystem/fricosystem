import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Type, Palette, Layout, Square, Save, X, Sparkles, Eye, RotateCcw, Copy, Trash2, Wand2 } from "lucide-react";

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
  const [history, setHistory] = useState<ElementChanges[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [previewMode, setPreviewMode] = useState(false);

  // Atualiza o estado quando o elemento selecionado muda
  useEffect(() => {
    if (selectedElement) {
      setChanges({
        styles: {},
        text: selectedElement?.textContent || ''
      });
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [selectedElement]);

  const handleStyleChange = (property: string, value: string) => {
    setChanges(prev => {
      const newChanges = {
        ...prev,
        styles: {
          ...prev.styles,
          [property]: value
        }
      };
      
      // Adiciona ao histórico
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newChanges);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return newChanges;
    });
  };

  const handleTextChange = (value: string) => {
    setChanges(prev => {
      const newChanges = {
        ...prev,
        text: value
      };
      
      // Adiciona ao histórico
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newChanges);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return newChanges;
    });
  };

  const handleApply = () => {
    onApplyChanges(changes);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setChanges(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setChanges(history[historyIndex + 1]);
    }
  };

  const handleReset = () => {
    setChanges({
      styles: {},
      text: selectedElement?.textContent || ''
    });
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleCopyStyles = () => {
    const stylesString = JSON.stringify(changes.styles, null, 2);
    navigator.clipboard.writeText(stylesString);
  };

  const getCurrentValue = (property: string) => {
    return changes.styles[property] || selectedElement?.styles[property] || '';
  };

  if (!selectedElement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <span>Editor Visual - {selectedElement.tagName.toLowerCase()}</span>
              <Badge variant="outline" className="ml-2">
                {selectedElement.className || 'sem classe'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Desfazer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Refazer"
              >
                <RotateCcw className="h-4 w-4 scale-x-[-1]" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyStyles}
                title="Copiar estilos"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Resetar alterações"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Edite o elemento selecionado usando os controles abaixo. As mudanças serão aplicadas em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="text" className="flex items-center gap-1">
                <Type className="h-3 w-3" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-1">
                <Palette className="h-3 w-3" />
                Cores
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-1">
                <Layout className="h-3 w-3" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="border" className="flex items-center gap-1">
                <Square className="h-3 w-3" />
                Borda
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Efeitos
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Avançado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Conteúdo do Texto</Label>
                <Textarea
                  value={changes.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Digite o texto..."
                  rows={3}
                  className="resize-none"
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
                <div className="space-y-2">
                  <Label>Alinhamento do Texto</Label>
                  <Select 
                    value={getCurrentValue('text-align')} 
                    onValueChange={(value) => handleStyleChange('text-align', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                      <SelectItem value="justify">Justificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Decoração do Texto</Label>
                  <Select 
                    value={getCurrentValue('text-decoration')} 
                    onValueChange={(value) => handleStyleChange('text-decoration', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="underline">Sublinhado</SelectItem>
                      <SelectItem value="overline">Linha Acima</SelectItem>
                      <SelectItem value="line-through">Tachado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Espaçamento entre Letras</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseFloat(getCurrentValue('letter-spacing')) || 0]}
                    onValueChange={([value]) => handleStyleChange('letter-spacing', `${value}px`)}
                    max={10}
                    min={-2}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseFloat(getCurrentValue('letter-spacing')) || 0}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Altura da Linha</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseFloat(getCurrentValue('line-height')) || 1.5]}
                    onValueChange={([value]) => handleStyleChange('line-height', `${value}`)}
                    max={3}
                    min={0.5}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {parseFloat(getCurrentValue('line-height')) || 1.5}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
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
                <div className="space-y-2">
                  <Label>Opacidade</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseFloat(getCurrentValue('opacity')) * 100 || 100]}
                      onValueChange={([value]) => handleStyleChange('opacity', `${value / 100}`)}
                      max={100}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[40px]">
                      {Math.round((parseFloat(getCurrentValue('opacity')) || 1) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Display</Label>
                <Select 
                  value={getCurrentValue('display')} 
                  onValueChange={(value) => handleStyleChange('display', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                    <SelectItem value="inline-block">Inline-Block</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="none">None (Ocultar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
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
                <div className="space-y-2">
                  <Label>Margin Left</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseInt(getCurrentValue('margin-left')) || 0]}
                      onValueChange={([value]) => handleStyleChange('margin-left', `${value}px`)}
                      max={100}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[40px]">
                      {parseInt(getCurrentValue('margin-left')) || 0}px
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Margin Right</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseInt(getCurrentValue('margin-right')) || 0]}
                      onValueChange={([value]) => handleStyleChange('margin-right', `${value}px`)}
                      max={100}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[40px]">
                      {parseInt(getCurrentValue('margin-right')) || 0}px
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="border" className="space-y-4 mt-4">
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

              <div className="space-y-2">
                <Label>Box Shadow</Label>
                <Input
                  value={getCurrentValue('box-shadow')}
                  onChange={(e) => handleStyleChange('box-shadow', e.target.value)}
                  placeholder="ex: 0 4px 6px rgba(0,0,0,0.1)"
                />
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Transform</Label>
                <Input
                  value={getCurrentValue('transform')}
                  onChange={(e) => handleStyleChange('transform', e.target.value)}
                  placeholder="ex: rotate(45deg), scale(1.2)"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rotação (deg)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseInt(getCurrentValue('rotate')) || 0]}
                      onValueChange={([value]) => handleStyleChange('transform', `rotate(${value}deg)`)}
                      max={360}
                      min={-360}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[50px]">
                      {parseInt(getCurrentValue('rotate')) || 0}°
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Escala</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseFloat(getCurrentValue('scale')) * 100 || 100]}
                      onValueChange={([value]) => handleStyleChange('transform', `scale(${value / 100})`)}
                      max={200}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[50px]">
                      {Math.round((parseFloat(getCurrentValue('scale')) || 1) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Transição</Label>
                <Select 
                  value={getCurrentValue('transition')} 
                  onValueChange={(value) => handleStyleChange('transition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="all 0.2s ease">Rápida (0.2s)</SelectItem>
                    <SelectItem value="all 0.3s ease">Média (0.3s)</SelectItem>
                    <SelectItem value="all 0.5s ease">Lenta (0.5s)</SelectItem>
                    <SelectItem value="all 1s ease">Muito Lenta (1s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtros (CSS)</Label>
                <Input
                  value={getCurrentValue('filter')}
                  onChange={(e) => handleStyleChange('filter', e.target.value)}
                  placeholder="ex: blur(5px) brightness(1.2)"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Z-Index</Label>
                <Input
                  type="number"
                  value={getCurrentValue('z-index')}
                  onChange={(e) => handleStyleChange('z-index', e.target.value)}
                  placeholder="ex: 10"
                />
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select 
                  value={getCurrentValue('position')} 
                  onValueChange={(value) => handleStyleChange('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="absolute">Absolute</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="sticky">Sticky</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Top</Label>
                  <Input
                    value={getCurrentValue('top')}
                    onChange={(e) => handleStyleChange('top', e.target.value)}
                    placeholder="ex: 0, 10px, 50%"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Right</Label>
                  <Input
                    value={getCurrentValue('right')}
                    onChange={(e) => handleStyleChange('right', e.target.value)}
                    placeholder="ex: 0, 10px, 50%"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bottom</Label>
                  <Input
                    value={getCurrentValue('bottom')}
                    onChange={(e) => handleStyleChange('bottom', e.target.value)}
                    placeholder="ex: 0, 10px, 50%"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Left</Label>
                  <Input
                    value={getCurrentValue('left')}
                    onChange={(e) => handleStyleChange('left', e.target.value)}
                    placeholder="ex: 0, 10px, 50%"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Cursor</Label>
                <Select 
                  value={getCurrentValue('cursor')} 
                  onValueChange={(value) => handleStyleChange('cursor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="pointer">Pointer</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="move">Move</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="wait">Wait</SelectItem>
                    <SelectItem value="not-allowed">Not Allowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Overflow</Label>
                <Select 
                  value={getCurrentValue('overflow')} 
                  onValueChange={(value) => handleStyleChange('overflow', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="scroll">Scroll</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CSS Personalizado</Label>
                <Textarea
                  value={Object.entries(changes.styles).map(([key, value]) => `${key}: ${value};`).join('\n')}
                  onChange={(e) => {
                    const cssLines = e.target.value.split('\n');
                    const newStyles: Record<string, string> = {};
                    cssLines.forEach(line => {
                      const [property, value] = line.split(':').map(s => s.trim());
                      if (property && value) {
                        newStyles[property] = value.replace(';', '');
                      }
                    });
                    setChanges(prev => ({ ...prev, styles: newStyles }));
                  }}
                  placeholder="propriedade: valor;"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between items-center gap-3 pt-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {Object.keys(changes.styles).length} alteraç{Object.keys(changes.styles).length === 1 ? 'ão' : 'ões'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleApply} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Aplicar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualEditModal;