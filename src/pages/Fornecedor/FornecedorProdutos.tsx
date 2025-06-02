import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogOut, Package, Filter, Calendar, Moon, Sun } from 'lucide-react';

interface Compra {
  id: string;
  codigo: string;
  criadoEm: any;
  criadoPor: string;
  fornecedorCnpj: string;
  fornecedorId: string;
  fornecedorNome: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  status: string;
  unidade: string;
  valor_unitario: number;
  atualizadoEm?: any;
}

const FornecedorProdutos: React.FC = () => {
  const { user, userData, logout } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [activeCompras, setActiveCompras] = useState<Compra[]>([]);
  const [deliveredCompras, setDeliveredCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'active' | 'delivered'>('active');

  // Carrega o tema do usuário do Firestore
  useEffect(() => {
    if (!user?.email) return;

    const loadUserTheme = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.email));
        if (userDoc.exists()) {
          const userTheme = userDoc.data().tema;
          setTheme(userTheme || 'dark');
          document.documentElement.classList.toggle('dark', userTheme === 'dark');
        } else {
          await updateDoc(doc(db, 'usuarios', user.email), {
            tema: 'dark',
            email: user.email,
            cnpj: userData?.cnpj || '' // Garante que o CNPJ seja salvo
          });
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    };

    loadUserTheme();
  }, [user, userData]);

  // Atualiza o tema no Firestore e no estado local
  const toggleTheme = async () => {
    if (!user?.email) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');

    try {
      await updateDoc(doc(db, 'usuarios', user.email), {
        tema: newTheme
      });
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a preferência de tema',
        variant: 'destructive'
      });
      setTheme(theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  useEffect(() => {
    if (!userData) return;

    const comprasRef = collection(db, 'compras');
    let q;

    if (userData.cargo === 'DESENVOLVEDOR') {
      // Desenvolvedor vê todas as compras
      q = query(comprasRef, orderBy('criadoEm', 'desc'));
    } else if (userData.cnpj) {
      // Fornecedor vê apenas suas compras (compara cnpj do usuário com fornecedorCnpj da compra)
      q = query(
        comprasRef,
        where('fornecedorCnpj', '==', userData.cnpj),
        orderBy('criadoEm', 'desc')
      );
    } else {
      // Caso não tenha CNPJ (não deveria acontecer para fornecedores)
      setCompras([]);
      setActiveCompras([]);
      setDeliveredCompras([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Compra[];
      
      setCompras(comprasData);
      
      // Separar compras em ativas (não entregues) e entregues/canceladas
      const active = comprasData.filter(compra => compra.status !== 'Entregue' && compra.status !== 'Cancelado');
      const delivered = comprasData.filter(compra => compra.status === 'Entregue' || compra.status === 'Cancelado');
      
      setActiveCompras(active);
      setDeliveredCompras(delivered);
      setLoading(false);
    });

    return unsubscribe;
  }, [userData]);

  useEffect(() => {
    let filtered = activeTab === 'active' ? activeCompras : deliveredCompras;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(compra => compra.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(compra =>
        compra.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [activeCompras, deliveredCompras, statusFilter, searchTerm, activeTab]);

  const handleStatusUpdate = async (compraId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'compras', compraId), {
        status: newStatus,
        atualizadoEm: serverTimestamp()
      });
      
      toast({
        title: 'Status atualizado',
        description: 'O status da compra foi atualizado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'Em Rota de entrega':
        return theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Entregue':
        return theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'Cancelado':
        return theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default:
        return theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatUpdateDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <Package className={`h-12 w-12 mx-auto mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  const currentCompras = activeTab === 'active' ? activeCompras : deliveredCompras;
  const filteredCompras = currentCompras.filter(compra => {
    const matchesStatus = statusFilter === 'all' || compra.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      compra.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compra.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compra.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark:bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/Uploads/IconeFrico3D.png" 
                alt="Fricó Alimentos" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bem Vindo, {userData?.nome}</h1>
                {userData?.cnpj && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    CNPJ: {userData.cnpj}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleTheme}
                className={`mr-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                onClick={logout}
                className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Ordens de Compra</h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Gerencie suas ordens de compra e atualize status</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'active' 
              ? theme === 'dark' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-blue-600 border-b-2 border-blue-600'
              : theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Compras Ativas ({activeCompras.length})
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'delivered' 
              ? theme === 'dark' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-blue-600 border-b-2 border-blue-600'
              : theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('delivered')}
          >
            Entregues/Canceladas ({deliveredCompras.length})
          </button>
        </div>

        {/* Filters */}
        <Card className={`mb-6 ${theme === 'dark' ? 'dark:bg-gray-950 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Buscar
                </label>
                <Input
                  placeholder="Código ou nome do produto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${theme === 'dark' ? 'dark:bg-gray-950 border-gray-600 text-white placeholder-gray-400' : 'dark:bg-gray-950 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`${theme === 'dark' ? 'dark:bg-gray-950 border-gray-600 text-white' : 'dark:bg-gray-950 border-gray-300 text-gray-900'}`}>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <SelectItem value="all" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Todos</SelectItem>
                    {activeTab === 'active' ? (
                      <>
                        <SelectItem value="Pendente" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Pendente</SelectItem>
                        <SelectItem value="Em Rota de entrega" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Em Rota de entrega</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Entregue" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Entregue</SelectItem>
                        <SelectItem value="Cancelado" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Cancelado</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className={`${theme === 'dark' ? 'dark:bg-gray-950 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {activeTab === 'active' ? 'Compras Ativas' : 'Compras Entregues/Canceladas'}
            </CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Total de {filteredCompras.length} ordem(ns) de compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Código</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Data Criação</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Produto</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Quantidade</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Valor Unit.</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Total</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Status</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Última Atualização</TableHead>
                    {activeTab === 'active' && (
                      <TableHead className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompras.map((compra) => (
                    <TableRow key={compra.id} className={theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}>
                      <TableCell className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{compra.codigo}</TableCell>
                      <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        <div className="flex items-center space-x-1">
                          <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span>{formatDate(compra.criadoEm)}</span>
                        </div>
                      </TableCell>
                      <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{compra.produtoNome}</TableCell>
                      <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{compra.quantidade} {compra.unidade}</TableCell>
                      <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{formatCurrency(compra.valor_unitario)}</TableCell>
                      <TableCell className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(compra.quantidade * compra.valor_unitario)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(compra.status)}>
                          {compra.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        <div className="flex items-center space-x-1">
                          <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span>{compra.atualizadoEm ? formatUpdateDate(compra.atualizadoEm) : '-'}</span>
                        </div>
                      </TableCell>
                      {activeTab === 'active' && (
                        <TableCell>
                          <Select
                            value={compra.status}
                            onValueChange={(value) => handleStatusUpdate(compra.id, value)}
                          >
                            <SelectTrigger className={`w-40 ${theme === 'dark' ? 'dark:bg-gray-950 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={`${theme === 'dark' ? 'dark:bg-gray-950 border-gray-600' : 'bg-white border-gray-300'}`}>
                              <SelectItem value="Pendente" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Pendente</SelectItem>
                              <SelectItem value="Em Rota de entrega" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Em Rota de entrega</SelectItem>
                              <SelectItem value="Entregue" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Entregue</SelectItem>
                              <SelectItem value="Cancelado" className={theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}>Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredCompras.length === 0 && (
                <div className="text-center py-8">
                  <Package className={`h-12 w-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {activeTab === 'active' 
                      ? 'Nenhuma compra ativa encontrada' 
                      : 'Nenhuma compra entregue ou cancelada encontrada'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FornecedorProdutos;