import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, FilePlus, FileX, FileCheck, HardDrive } from 'lucide-react';

interface FileComparison {
  path: string;
  status: 'new' | 'modified' | 'deleted' | 'unchanged';
  sourceHash?: string;
  targetHash?: string;
  sizeDiff?: number;
}

interface FileComparisonPreviewProps {
  comparisons: FileComparison[];
  selectedFiles: Set<string>;
  onFileToggle: (path: string, selected: boolean) => void;
  onSelectAll: (status: string, selected: boolean) => void;
}

const FileComparisonPreview: React.FC<FileComparisonPreviewProps> = ({
  comparisons,
  selectedFiles,
  onFileToggle,
  onSelectAll
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <FilePlus className="h-4 w-4 text-emerald-600" />;
      case 'modified':
        return <FileText className="h-4 w-4 text-amber-600" />;
      case 'deleted':
        return <FileX className="h-4 w-4 text-red-600" />;
      case 'unchanged':
        return <FileCheck className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      modified: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      deleted: 'bg-red-100 text-red-800 hover:bg-red-200',
      unchanged: 'bg-muted text-muted-foreground'
    };

    const labels = {
      new: 'Novo',
      modified: 'Modificado',
      deleted: 'Deletado',
      unchanged: 'Inalterado'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatFileSize = (size: number) => {
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(Math.abs(size)) / Math.log(k));
    return `${(size / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getSizeDiffDisplay = (sizeDiff?: number) => {
    if (!sizeDiff || sizeDiff === 0) return null;
    
    const isPositive = sizeDiff > 0;
    const icon = isPositive ? '+' : '';
    const color = isPositive ? 'text-emerald-600' : 'text-red-600';
    
    return (
      <span className={`text-xs ${color}`}>
        ({icon}{formatFileSize(sizeDiff)})
      </span>
    );
  };

  // Group files by status
  const groupedComparisons = comparisons.reduce((groups, comp) => {
    if (!groups[comp.status]) {
      groups[comp.status] = [];
    }
    groups[comp.status].push(comp);
    return groups;
  }, {} as Record<string, FileComparison[]>);

  // Calculate statistics
  const stats = {
    new: comparisons.filter(c => c.status === 'new').length,
    modified: comparisons.filter(c => c.status === 'modified').length,
    deleted: comparisons.filter(c => c.status === 'deleted').length,
    unchanged: comparisons.filter(c => c.status === 'unchanged').length,
    selected: selectedFiles.size
  };

  const totalSizeDiff = comparisons.reduce((sum, comp) => sum + (comp.sizeDiff || 0), 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Preview das Alterações
        </CardTitle>
        <CardDescription>
          {stats.new} novos, {stats.modified} modificados, {stats.deleted} deletados
          {totalSizeDiff !== 0 && (
            <span className="ml-2">
              ({totalSizeDiff > 0 ? '+' : ''}{formatFileSize(totalSizeDiff)})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats).map(([status, count]) => {
            if (status === 'selected' || count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-2">
                <Checkbox
                  checked={groupedComparisons[status]?.every(comp => selectedFiles.has(comp.path)) || false}
                  onCheckedChange={(checked) => onSelectAll(status, checked === true)}
                />
                {getStatusBadge(status)}
                <span className="text-sm text-muted-foreground">({count})</span>
              </div>
            );
          })}
        </div>

        {/* Selected files counter */}
        {stats.selected > 0 && (
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm font-medium">
              {stats.selected} arquivo{stats.selected !== 1 ? 's' : ''} selecionado{stats.selected !== 1 ? 's' : ''} para transferência
            </p>
          </div>
        )}

        {/* File list */}
        <ScrollArea className="h-64 w-full border rounded-md">
          <div className="p-4 space-y-2">
            {Object.entries(groupedComparisons).map(([status, files]) => (
              <div key={status} className="space-y-1">
                {files.map((comp) => (
                  <div
                    key={comp.path}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedFiles.has(comp.path)}
                        onCheckedChange={(checked) => onFileToggle(comp.path, checked === true)}
                        disabled={comp.status === 'unchanged'}
                      />
                      
                      {getStatusIcon(comp.status)}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={comp.path}>
                          {comp.path.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {comp.path}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getSizeDiffDisplay(comp.sizeDiff)}
                      {getStatusBadge(comp.status)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {comparisons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhuma diferença encontrada</p>
                <p className="text-xs">Os repositórios estão sincronizados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileComparisonPreview;