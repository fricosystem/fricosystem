import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, Truck, History, Eye } from 'lucide-react';
import { EnvioRetorno } from '@/types/typesEnvioRetorno';

interface EnvioRetornoListProps {
  envios: EnvioRetorno[];
  loading: boolean;
  onSelectEnvio: (envio: EnvioRetorno) => void;
  onUpdateStatus: (envioId: string, status: EnvioRetorno['status'], fotosRetorno?: string[]) => void;
}

const EnvioRetornoList = ({ envios, loading, onSelectEnvio, onUpdateStatus }: EnvioRetornoListProps) => {
  const getStatusBadge = (status: EnvioRetorno['status']) => {
    const variants = {
      aguardando_envio: { label: 'Aguardando Envio', variant: 'secondary' as const },
      enviado: { label: 'Enviado', variant: 'default' as const },
      retornou: { label: 'Retornou', variant: 'outline' as const },
    };
    
    return variants[status];
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (envios.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum envio encontrado</h3>
          <p className="text-muted-foreground">
            Não há envios para conserto nesta categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {envios.map((envio) => {
        const statusInfo = getStatusBadge(envio.status);
        
        return (
          <Card key={envio.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{envio.produto}</CardTitle>
                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </div>
              <CardDescription>
                {envio.descricao}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">Quantidade</div>
                  <div>{envio.quantidade} {envio.unidade}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Fornecedor</div>
                  <div>{envio.fornecedor}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Motivo</div>
                  <div className="capitalize">{envio.motivoEnvio}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Cadastrado em {formatDate(envio.dataCadastro)}
                </div>
                {envio.dataEnvio && (
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    Enviado em {formatDate(envio.dataEnvio)}
                  </div>
                )}
                {envio.dataRetorno && (
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-1" />
                    Retornou em {formatDate(envio.dataRetorno)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {envio.fotosEnvio && envio.fotosEnvio.length > 0 && (
                    <div className="flex -space-x-2">
                      {envio.fotosEnvio.slice(0, 3).map((foto, index) => (
                        <img
                          key={index}
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          className="w-8 h-8 rounded-full border-2 border-background object-cover"
                        />
                      ))}
                      {envio.fotosEnvio.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                          +{envio.fotosEnvio.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectEnvio(envio)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnvioRetornoList;