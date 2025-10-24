import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Trash2 } from "lucide-react";

interface EditHistoryItem {
  timestamp: Date;
  elementTag: string;
  elementId: string;
  changes: {
    type: 'style' | 'text' | 'class';
    property?: string;
    oldValue?: string;
    newValue?: string;
  }[];
}

interface ElementHistoryProps {
  history: EditHistoryItem[];
  onRevert: (index: number) => void;
  onClear: () => void;
}

const ElementHistory: React.FC<ElementHistoryProps> = ({
  history,
  onRevert,
  onClear
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <CardTitle className="text-lg">Histórico de Edições</CardTitle>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <CardDescription>
          {history.length} alteraç{history.length === 1 ? 'ão' : 'ões'} registrada{history.length === 1 ? '' : 's'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma edição registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.elementTag.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevert(index)}
                      className="h-7 px-2"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reverter
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {item.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="text-xs">
                        {change.type === 'style' && change.property && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Estilo:</span>
                            <code className="bg-muted px-1 py-0.5 rounded">
                              {change.property}
                            </code>
                            <span className="text-muted-foreground">→</span>
                            <code className="bg-primary/10 px-1 py-0.5 rounded">
                              {change.newValue}
                            </code>
                          </div>
                        )}
                        {change.type === 'text' && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Texto alterado</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ElementHistory;
