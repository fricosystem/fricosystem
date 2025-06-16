import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Usuario } from '@/types/usuario';
import { Unidade } from '@/types/unidade';

interface UsuarioFormProps {
  usuario?: Usuario;
  onSubmit: (usuario: Omit<Usuario, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  unidades: Unidade[];
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({ 
  usuario, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  unidades = []
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: '',
    unidade: '',
    ativo: 'sim',
    imagem_perfil: ''
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
        perfil: usuario.perfil,
        unidade: usuario.unidade,
        ativo: usuario.ativo,
        imagem_perfil: usuario.imagem_perfil
      });
    }
  }, [usuario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{usuario ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="text"
                value={formData.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select 
                value={formData.perfil} 
                onValueChange={(value) => handleChange('perfil', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESENVOLVEDOR">DESENVOLVEDOR</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">ADMINISTRATIVO</SelectItem>
                  <SelectItem value="ENCARREGADO">ENCARREGADO</SelectItem>
                  <SelectItem value="COLABORADOR">COLABORADOR</SelectItem>
                  <SelectItem value="ESTOQUISTA">ESTOQUISTA</SelectItem>
                  <SelectItem value="LÍDER">LÍDER</SelectItem>
                  <SelectItem value="PRESIDENTE">PRESIDENTE</SelectItem>
                  <SelectItem value="GERENTE">GERENTE</SelectItem>
                  <SelectItem value="FORNECEDOR">FORNECEDOR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) => handleChange('unidade', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.length > 0 ? (
                    unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.nome}>
                        {unidade.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-units" disabled>Nenhuma unidade encontrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ativo">Status</Label>
              <Select 
                value={formData.ativo} 
                onValueChange={(value) => handleChange('ativo', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">sim</SelectItem>
                  <SelectItem value="nao">não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imagem_perfil">URL da Imagem de Perfil</Label>
            <Input
              id="imagem_perfil"
              value={formData.imagem_perfil}
              onChange={(e) => handleChange('imagem_perfil', e.target.value)}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UsuarioForm;