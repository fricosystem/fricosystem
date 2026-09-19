import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building2, Briefcase, Calendar, Edit3, Camera, Save, Bell, Lock, Shield, Moon, Sun, Palette, Globe, Clock, MapPin, FileText } from 'lucide-react';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import CameraModal from '@/components/CameraModal';
const Perfil = () => {
  const {
    user,
    userData
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Dados do perfil
  const [profileData, setProfileData] = useState({
    nome: userData?.nome || '',
    email: userData?.email || '',
    cpf: userData?.cpf || '',
    cnpj: userData?.cnpj || '',
    cargo: userData?.cargo || '',
    centro_de_custo: userData?.centro_de_custo || '',
    unidade: userData?.unidade || '',
    telefone: '',
    bio: '',
    linkedin: '',
    endereco: '',
    cidade: '',
    estado: '',
    imagem_perfil: userData?.imagem_perfil || ''
  });

  // Configurações de notificação
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    system_updates: true,
    security_alerts: true,
    marketing: false
  });

  // Configurações de privacidade
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'internal',
    show_email: false,
    show_phone: false,
    show_status: true
  });

  // Configurações de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const db = getFirestore();
  useEffect(() => {
    if (userData) {
      setProfileData(prev => ({
        ...prev,
        nome: userData.nome || '',
        email: userData.email || '',
        cpf: userData.cpf || '',
        cnpj: userData.cnpj || '',
        cargo: userData.cargo || '',
        centro_de_custo: userData.centro_de_custo || '',
        unidade: userData.unidade || '',
        imagem_perfil: userData.imagem_perfil || ''
      }));
    }
  }, [userData]);
  const handleProfileUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Atualizar perfil no Firebase Auth
      await updateProfile(user, {
        displayName: profileData.nome
      });

      // Atualizar dados no Firestore
      const userDocRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userDocRef, {
        nome: profileData.nome,
        cpf: profileData.cpf,
        cnpj: profileData.cnpj,
        cargo: profileData.cargo,
        centro_de_custo: profileData.centro_de_custo,
        unidade: profileData.unidade,
        imagem_perfil: profileData.imagem_perfil
      });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordChange = async () => {
    if (!user) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, passwordData.newPassword);
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso."
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getUserInitial = () => {
    return profileData.nome ? profileData.nome.charAt(0).toUpperCase() : 'U';
  };

  const handlePhotoTaken = (imageUrl: string) => {
    setProfileData(prev => ({
      ...prev,
      imagem_perfil: imageUrl
    }));
    
    // Auto-save the profile when photo is taken
    handleProfileUpdate();
  };
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Não disponível';
    try {
      let date: Date;

      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle seconds and nanoseconds (Firestore Timestamp-like object)
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle regular Date or string
      else {
        date = new Date(timestamp);
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: pt
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Data inválida';
    }
  };
  return <AppLayout title="Meu Perfil">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header do Perfil */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.imagem_perfil} alt="Foto do perfil" />
                  <AvatarFallback className="text-2xl font-semibold">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 p-0" onClick={() => setIsCameraModalOpen(true)}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* Informações Básicas */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{profileData.nome || 'Nome não informado'}</h1>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {profileData.cargo || 'Cargo não informado'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profileData.email}
                  </div>
                  
                  {profileData.unidade && <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {profileData.unidade}
                    </div>}
                  
                  {userData?.data_registro && <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membro desde {(() => {
                    try {
                      let date: Date;
                      if (userData.data_registro.toDate && typeof userData.data_registro.toDate === 'function') {
                        date = userData.data_registro.toDate();
                      } else if (userData.data_registro.seconds) {
                        date = new Date(userData.data_registro.seconds * 1000);
                      } else {
                        date = new Date(userData.data_registro as any);
                      }
                      return format(date, "MMMM 'de' yyyy", {
                        locale: pt
                      });
                    } catch {
                      return 'data não disponível';
                    }
                  })()}
                    </div>}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Online</span>
                  </div>
                  
                  {userData?.ultimo_login && <span className="text-sm text-muted-foreground">
                      • Último acesso: {formatDate(userData.ultimo_login)}
                    </span>}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs do Perfil */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferências
            </TabsTrigger>
          </TabsList>

          {/* Aba Informações */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais e profissionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" value={profileData.nome} onChange={e => setProfileData({
                    ...profileData,
                    nome: e.target.value
                  })} disabled={!isEditing} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profileData.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" value={profileData.cpf} onChange={e => setProfileData({
                      ...profileData,
                      cpf: e.target.value
                    })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input id="cnpj" value={profileData.cnpj} onChange={e => setProfileData({
                      ...profileData,
                      cnpj: e.target.value
                    })} disabled={!isEditing} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" value={profileData.cargo} onChange={e => setProfileData({
                    ...profileData,
                    cargo: e.target.value
                  })} disabled={!isEditing} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="centro_custo">Centro de Custo</Label>
                      <Input id="centro_custo" value={profileData.centro_de_custo} onChange={e => setProfileData({
                      ...profileData,
                      centro_de_custo: e.target.value
                    })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Input id="unidade" value={profileData.unidade} onChange={e => setProfileData({
                      ...profileData,
                      unidade: e.target.value
                    })} disabled={!isEditing} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imagem_perfil">URL da Foto de Perfil</Label>
                    <Input id="imagem_perfil" value={profileData.imagem_perfil} onChange={e => setProfileData({
                    ...profileData,
                    imagem_perfil: e.target.value
                  })} disabled={!isEditing} placeholder="https://exemplo.com/sua-foto.jpg" />
                  </div>

                  {isEditing && <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>}
                </CardContent>
              </Card>

              {/* Estatísticas do Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Atividade da Conta
                  </CardTitle>
                  <CardDescription>
                    Estatísticas e informações da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                        if (!userData?.data_registro) return 0;
                        try {
                          let date: Date;
                          if (userData.data_registro.toDate && typeof userData.data_registro.toDate === 'function') {
                            date = userData.data_registro.toDate();
                          } else if (userData.data_registro.seconds) {
                            date = new Date(userData.data_registro.seconds * 1000);
                          } else {
                            date = new Date(userData.data_registro as any);
                          }
                          return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                        } catch {
                          return 0;
                        }
                      })()}
                      </div>
                      <div className="text-sm text-muted-foreground">Dias na plataforma</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {userData?.ativo === 'sim' ? 'Ativa' : 'Inativa'}
                      </div>
                      <div className="text-sm text-muted-foreground">Status da conta</div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Data de registro:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(userData?.data_registro)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Último login:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(userData?.ultimo_login)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status online:</span>
                      <Badge variant={userData?.online === 'online' ? 'default' : 'secondary'}>
                        {userData?.online === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>

                    {userData?.permissoes && <div className="space-y-2">
                        <span className="text-sm font-medium">Permissões:</span>
                        <div className="flex flex-wrap gap-1">
                          {userData.permissoes.map((permissao, index) => <Badge key={index} variant="outline" className="text-xs">
                              {permissao}
                            </Badge>)}
                        </div>
                      </div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input id="currentPassword" type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value
                })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={e => setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value
                })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value
                })} />
                </div>

                <Button onClick={handlePasswordChange} disabled={loading || !passwordData.newPassword} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries({
                email_notifications: 'Notificações por email',
                push_notifications: 'Notificações push',
                system_updates: 'Atualizações do sistema',
                security_alerts: 'Alertas de segurança',
                marketing: 'Comunicações de marketing'
              }).map(([key, label]) => <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {key === 'security_alerts' ? 'Recomendado para manter sua conta segura' : key === 'marketing' ? 'Novidades e promoções da plataforma' : 'Receber notificações sobre atividades relevantes'}
                      </div>
                    </div>
                    <Switch checked={notificationSettings[key as keyof typeof notificationSettings]} onCheckedChange={checked => setNotificationSettings(prev => ({
                  ...prev,
                  [key]: checked
                }))} />
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Preferências */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência da interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Claro
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Escuro
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Sistema
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacidade
                  </CardTitle>
                  <CardDescription>
                    Controle a visibilidade das suas informações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Visibilidade do perfil</Label>
                    <Select value={privacySettings.profile_visibility} onValueChange={value => setPrivacySettings(prev => ({
                    ...prev,
                    profile_visibility: value
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="internal">Apenas empresa</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mostrar email</span>
                      <Switch checked={privacySettings.show_email} onCheckedChange={checked => setPrivacySettings(prev => ({
                      ...prev,
                      show_email: checked
                    }))} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mostrar status online</span>
                      <Switch checked={privacySettings.show_status} onCheckedChange={checked => setPrivacySettings(prev => ({
                      ...prev,
                      show_status: checked
                    }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Camera Modal */}
        <CameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onPhotoTaken={handlePhotoTaken}
        />
      </div>
    </AppLayout>;
};
export default Perfil;