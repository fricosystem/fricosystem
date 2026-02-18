import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Upload, CheckCircle, Truck, History, Calendar, User, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/Cloudinary/cloudinaryUploadProdutos';
import { EnvioRetorno } from '@/types/typesEnvioRetorno';

interface EnvioRetornoModalProps {
  envio: EnvioRetorno;
  onClose: () => void;
  onUpdateStatus: (envioId: string, status: EnvioRetorno['status'], fotosRetorno?: string[]) => void;
}

const EnvioRetornoModal = ({ envio, onClose, onUpdateStatus }: EnvioRetornoModalProps) => {
  const [fotosRetorno, setFotosRetorno] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showRetornoConfirmation, setShowRetornoConfirmation] = useState(false);
  const { toast } = useToast();

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (fotosRetorno.length + files.length > 3) {
      toast({
        title: 'Limite excedido',
        description: 'Máximo de 3 fotos permitido.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const newFotos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (fotosRetorno.length + newFotos.length >= 3) break;
        
        const file = files[i];
        const imageUrl = await uploadImageToCloudinary(file);
        newFotos.push(imageUrl);
      }

      setFotosRetorno(prev => [...prev, ...newFotos]);
      
      toast({
        title: 'Sucesso',
        description: `${newFotos.length} foto(s) carregada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar as fotos.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFoto = (index: number) => {
    setFotosRetorno(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmRetorno = () => {
    if (fotosRetorno.length === 0) {
      toast({
        title: 'Atenção',
        description: 'É necessário adicionar pelo menos uma foto do produto retornado.',
        variant: 'destructive',
      });
      return;
    }

    onUpdateStatus(envio.id, 'retornou', fotosRetorno);
    setShowRetornoConfirmation(false);
    onClose();
  };

  const statusInfo = getStatusBadge(envio.status);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Envio</DialogTitle>
            <Badge variant={statusInfo.variant} className="text-sm">
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Informações do Produto</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Produto</Label>
                  <Input value={envio.produto} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <Textarea 
                    value={envio.descricao} 
                    readOnly 
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Quantidade</Label>
                    <Input value={`${envio.quantidade} ${envio.unidade}`} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Motivo</Label>
                    <Input value={envio.motivoEnvio} readOnly className="mt-1 capitalize" />
                  </div>
                </div>
              </div>
            </div>

            {/* Informações do Fornecedor */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Fornecedor</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <Input value={envio.fornecedor} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Contato</Label>
                  <Input value={envio.contatoFornecedor} readOnly className="mt-1" />
                </div>
              </div>
            </div>

            {/* Observações */}
            {envio.observacoes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Observações</h3>
                <Textarea 
                  value={envio.observacoes} 
                  readOnly 
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}

            {/* Informações de Tempo */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Histórico</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Cadastrado: {formatDate(envio.dataCadastro)}</span>
                </div>
                {envio.dataEnvio && (
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Enviado: {formatDate(envio.dataEnvio)}</span>
                  </div>
                )}
                {envio.dataRetorno && (
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Retornou: {formatDate(envio.dataRetorno)}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Criado por: {envio.criadoPor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fotos e Ações */}
          <div className="space-y-6">
            {/* Fotos do Envio */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Fotos do Envio</h3>
              <div className="grid grid-cols-2 gap-3">
                {envio.fotosEnvio.map((foto, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={foto}
                      alt={`Foto envio ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fotos do Retorno (se aplicável) */}
            {envio.fotosRetorno && envio.fotosRetorno.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Fotos do Retorno</h3>
                <div className="grid grid-cols-2 gap-3">
                  {envio.fotosRetorno.map((foto, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={foto}
                        alt={`Foto retorno ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
              {envio.status === 'aguardando_envio' && (
                <Button
                  className="w-full"
                  onClick={() => onUpdateStatus(envio.id, 'enviado')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marcar como Enviado
                </Button>
              )}

              {envio.status === 'enviado' && !showRetornoConfirmation && (
                <Button
                  className="w-full"
                  onClick={() => setShowRetornoConfirmation(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Registrar Retorno
                </Button>
              )}

              {showRetornoConfirmation && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold">Confirmar Retorno</h4>
                  
                  <div className="space-y-3">
                    <Label>Fotos do Retorno * (Máximo 3)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {fotosRetorno.map((foto, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={foto}
                            alt={`Foto retorno ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5"
                            onClick={() => removeFoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {fotosRetorno.length < 3 && (
                        <label className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/25 rounded cursor-pointer hover:border-muted-foreground/50 transition-colors">
                          <div className="text-center p-2">
                            <Upload className="h-4 w-4 text-muted-foreground mx-auto" />
                            <span className="text-xs text-muted-foreground block mt-1">
                              Adicionar
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>

                    {isUploading && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Camera className="h-3 w-3 mr-1 animate-pulse" />
                        Carregando...
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowRetornoConfirmation(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleConfirmRetorno}
                        disabled={fotosRetorno.length === 0 || isUploading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmar Retorno
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnvioRetornoModal;