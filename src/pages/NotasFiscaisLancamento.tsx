import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2, Check, AlertTriangle, X, AlertCircle, Trash2, Edit } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, collection, serverTimestamp, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, parseCurrency } from '@/lib/utils';

interface Fornecedor {
  id: string;
  cnpj: string;
  razaoSocial: string;
  pessoaContato?: string;
  email?: string;
  telefone?: string;
  condicoesPagamento?: string;
}

interface NotaFiscal {
  id?: string;
  numero: string;
  tipo: string;
  emissor: string;
  cnpjEmissor: string;
  dataEmissao: string;
  dataRecebimento: string;
  valorTotal: number;
  chaveAcesso: string;
  observacoes?: string;
  status?: string;
  usuarioCadastro?: string;
  nomeUsuario?: string;
  dataCadastro?: any;
  condicaoPagamento?: number;
  dataVencimento?: string;
  diasParaVencer?: number;
}

const tiposNota = [
  { value: "nfe", label: "NF-e (Nota Fiscal Eletrônica)" },
  { value: "cte", label: "CT-e (Conhecimento de Transporte Eletrônico)" },
  { value: "nfs", label: "NFS-e (Nota Fiscal de Serviços Eletrônica)" },
  { value: "nfce", label: "NFC-e (Nota Fiscal ao Consumidor Eletrônica)" },
  { value: "outro", label: "Outro Tipo" },
];

const condicoesPagamento = [
  { value: 1, label: "À vista" },
  { value: 7, label: "7 dias" },
  { value: 15, label: "15 dias" },
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
];

const NotasFiscaisLancamento = () => {
  const { user, userData } = useAuth();
  const [nota, setNota] = useState<NotaFiscal>({
    numero: "",
    tipo: "nfe",
    emissor: "",
    cnpjEmissor: "",
    dataEmissao: "",
    dataRecebimento: "",
    valorTotal: 0,
    chaveAcesso: "",
    observacoes: "",
    status: "pendente",
    usuarioCadastro: user?.email || "",
    nomeUsuario: userData?.nome || "",
    condicaoPagamento: 30,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastNotaCadastrada, setLastNotaCadastrada] = useState<NotaFiscal | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notasCadastradas, setNotasCadastradas] = useState<NotaFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(true);
  const [openFornecedorDropdown, setOpenFornecedorDropdown] = useState(false);
  const [searchFornecedor, setSearchFornecedor] = useState("");
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "nfes_lancamento"),
          where("usuarioCadastro", "==", user?.email || "")
        );
        const querySnapshot = await getDocs(q);
        const notas: NotaFiscal[] = [];
        querySnapshot.forEach((doc) => {
          const notaData = doc.data() as NotaFiscal;
          const dataEmissao = notaData.dataEmissao ? parseISO(notaData.dataEmissao) : null;
          const condicao = notaData.condicaoPagamento || 30;
          
          let dataVencimento = "";
          let diasParaVencer = null;
          
          if (dataEmissao) {
            const vencimento = addDays(dataEmissao, condicao);
            dataVencimento = format(vencimento, 'yyyy-MM-dd');
            diasParaVencer = differenceInDays(vencimento, new Date());
          }
          
          notas.push({ 
            id: doc.id, 
            ...notaData,
            dataVencimento,
            diasParaVencer
          });
        });
        setNotasCadastradas(notas);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao buscar as notas cadastradas.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFornecedores = async () => {
      try {
        setIsLoadingFornecedores(true);
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        const fornecedoresData: Fornecedor[] = [];
        querySnapshot.forEach((doc) => {
          fornecedoresData.push({
            id: doc.id,
            ...doc.data()
          } as Fornecedor);
        });
        setFornecedores(fornecedoresData);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao buscar os fornecedores cadastrados.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFornecedores(false);
      }
    };

    if (user) {
      fetchNotas();
      fetchFornecedores();
    }
  }, [user, isSuccessModalOpen, isDetailsModalOpen]);

  useEffect(() => {
    if (user && userData) {
      setNota(prev => ({
        ...prev,
        usuarioCadastro: user.email || "",
        nomeUsuario: userData.nome || ""
      }));
    }
  }, [user, userData]);

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const searchTerm = searchFornecedor.toLowerCase();
    return (
      fornecedor.cnpj.toLowerCase().includes(searchTerm) || 
      fornecedor.razaoSocial.toLowerCase().includes(searchTerm)
    );
  });

  const handleSelectFornecedor = (fornecedor: Fornecedor) => {
    setNota(prev => ({
      ...prev,
      emissor: fornecedor.razaoSocial,
      cnpjEmissor: fornecedor.cnpj,
      condicaoPagamento: fornecedor.condicoesPagamento ? parseInt(fornecedor.condicoesPagamento) : 30
    }));
    setOpenFornecedorDropdown(false);
    setSearchFornecedor("");
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    const parsedValue = numericValue === '' ? 0 : parseFloat(numericValue) / 100;
    
    setNota(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  const formatCurrency = (value: number) => {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value).replace('R$', '').trim();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!nota.numero) newErrors.numero = "Número da nota é obrigatório";
    if (!nota.emissor) newErrors.emissor = "Emissor é obrigatório";
    if (!nota.cnpjEmissor) newErrors.cnpjEmissor = "CNPJ do emissor é obrigatório";
    if (!nota.dataEmissao) newErrors.dataEmissao = "Data de emissão é obrigatória";
    if (!nota.dataRecebimento) newErrors.dataRecebimento = "Data de recebimento é obrigatória";
    if (nota.valorTotal <= 0) newErrors.valorTotal = "Valor deve ser maior que zero";
    if (!nota.chaveAcesso) newErrors.chaveAcesso = "Chave de acesso é obrigatória";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNota(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setNota(prev => ({
      ...prev,
      [name]: name === "condicaoPagamento" ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const dataEmissao = nota.dataEmissao ? parseISO(nota.dataEmissao) : null;
      let dataVencimento = "";
      
      if (dataEmissao) {
        const vencimento = addDays(dataEmissao, nota.condicaoPagamento || 30);
        dataVencimento = format(vencimento, 'yyyy-MM-dd');
      }
      
      const notaCompleta = {
        ...nota,
        usuarioCadastro: user?.email || "",
        nomeUsuario: userData?.nome || "",
        dataCadastro: serverTimestamp(),
        status: "pendente",
        dataVencimento
      };
      
      if (nota.id) {
        await updateDoc(doc(db, "nfes_lancamento", nota.id), notaCompleta);
        toast({
          title: "Sucesso",
          description: "Nota fiscal atualizada com sucesso!",
        });
      } else {
        const docRef = await addDoc(collection(db, "nfes_lancamento"), notaCompleta);
        setLastNotaCadastrada({
          ...notaCompleta,
          id: docRef.id
        });
        setIsSuccessModalOpen(true);
      }
      
      setIsEditModalOpen(false);
      setIsModalOpen(false);
      
      setNota({
        numero: "",
        tipo: "nfe",
        emissor: "",
        cnpjEmissor: "",
        dataEmissao: "",
        dataRecebimento: "",
        valorTotal: 0,
        chaveAcesso: "",
        observacoes: "",
        status: "pendente",
        usuarioCadastro: user?.email || "",
        nomeUsuario: userData?.nome || "",
        condicaoPagamento: 30,
      });
      
    } catch (error) {
      console.error("Erro ao cadastrar nota:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cadastrar a nota. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarcarComoLancada = async () => {
    if (!selectedNota?.id) return;
    
    try {
      await updateDoc(doc(db, "nfes_lancamento", selectedNota.id), {
        status: "lancada"
      });
      toast({
        title: "Sucesso",
        description: "Nota marcada como lançada!",
      });
      setIsDetailsModalOpen(false);
      setNotasCadastradas(notasCadastradas.map(n => 
        n.id === selectedNota.id ? {...n, status: "lancada"} : n
      ));
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a nota.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirNota = async () => {
    if (!selectedNota?.id) return;
    
    try {
      await deleteDoc(doc(db, "nfes_lancamento", selectedNota.id));
      toast({
        title: "Sucesso",
        description: "Nota excluída com sucesso!",
      });
      setIsDetailsModalOpen(false);
      setNotasCadastradas(notasCadastradas.filter(n => n.id !== selectedNota.id));
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a nota.",
        variant: "destructive",
      });
    }
  };

  const handleEditarNota = () => {
    if (!selectedNota) return;
    setNota(selectedNota);
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getVencimentoStatus = (diasParaVencer: number | null, status: string = 'pendente') => {
    if (status === 'lancada') {
      return { text: 'Lançada', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (diasParaVencer === null) return null;
    
    if (diasParaVencer < 0) {
      return { text: 'Vencido', color: 'bg-red-100 text-red-800' };
    } else if (diasParaVencer <= 5) {
      return { text: `Vence em ${diasParaVencer} dia(s)`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: `Vence em ${diasParaVencer} dia(s)`, color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <AppLayout title="Registro de Notas Fiscais para Lançamento">
      <div className="w-full h-full px-4 py-6">
        <div className="bg-card rounded-lg shadow p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Lista de Notas Fiscais</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar NF
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : notasCadastradas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma nota fiscal cadastrada ainda.</p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeira Nota
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Emissor</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notasCadastradas.map((nota) => {
                    const vencimentoStatus = getVencimentoStatus(nota.diasParaVencer ?? null, nota.status);
                    return (
                      <TableRow 
                        key={nota.id} 
                        className="cursor-pointer hover:bg-gray-950"
                        onClick={() => {
                          setSelectedNota(nota);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <TableCell>{nota.numero}</TableCell>
                        <TableCell>
                          {tiposNota.find(t => t.value === nota.tipo)?.label || nota.tipo}
                        </TableCell>
                        <TableCell>{nota.emissor}</TableCell>
                        <TableCell>{formatDate(nota.dataEmissao)}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(nota.valorTotal)}
                        </TableCell>
                        <TableCell>
                          {nota.condicaoPagamento ? `${nota.condicaoPagamento} dias` : '30 dias'}
                        </TableCell>
                        <TableCell>
                          {nota.dataVencimento ? formatDate(nota.dataVencimento) : '-'}
                        </TableCell>
                        <TableCell>
                          {vencimentoStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs ${vencimentoStatus.color}`}>
                              {vencimentoStatus.text}
                            </span>
                          )}
                          {!vencimentoStatus && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              Pendente
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Cadastro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Cadastrar Nova Nota Fiscal</DialogTitle>
            </div>
            <DialogDescription>
              Preencha todos os campos obrigatórios para cadastrar uma nova nota fiscal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Nota *</Label>
                  <Select 
                    value={nota.tipo} 
                    onValueChange={(value) => handleSelectChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de nota" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposNota.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Nota *</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={nota.numero}
                    onChange={handleChange}
                    placeholder="Ex: 123456"
                  />
                  {errors.numero && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.numero}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Popover open={openFornecedorDropdown} onOpenChange={setOpenFornecedorDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFornecedorDropdown}
                        className="w-full justify-between"
                      >
                        {nota.emissor || "Selecione um fornecedor..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar fornecedor por CNPJ ou Razão Social..."
                          value={searchFornecedor}
                          onValueChange={setSearchFornecedor}
                        />
                        <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {filteredFornecedores.map((fornecedor) => (
                            <CommandItem
                              key={fornecedor.id}
                              value={`${fornecedor.cnpj} - ${fornecedor.razaoSocial}`}
                              onSelect={() => handleSelectFornecedor(fornecedor)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{fornecedor.razaoSocial}</span>
                                <span className="text-sm text-muted-foreground">{fornecedor.cnpj}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.emissor && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.emissor}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpjEmissor">CNPJ do Emissor *</Label>
                  <Input
                    id="cnpjEmissor"
                    name="cnpjEmissor"
                    value={nota.cnpjEmissor}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    readOnly
                  />
                  {errors.cnpjEmissor && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.cnpjEmissor}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                  <Input
                    id="dataEmissao"
                    name="dataEmissao"
                    type="date"
                    value={nota.dataEmissao}
                    onChange={handleChange}
                  />
                  {errors.dataEmissao && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.dataEmissao}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataRecebimento">Data de Recebimento *</Label>
                  <Input
                    id="dataRecebimento"
                    name="dataRecebimento"
                    type="date"
                    value={nota.dataRecebimento}
                    onChange={handleChange}
                  />
                  {errors.dataRecebimento && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.dataRecebimento}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condicaoPagamento">Condição de Pagamento *</Label>
                  <Select 
                    value={nota.condicaoPagamento?.toString() || "30"} 
                    onValueChange={(value) => handleSelectChange("condicaoPagamento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      {condicoesPagamento.map((condicao) => (
                        <SelectItem key={condicao.value} value={condicao.value.toString()}>
                          {condicao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
                  <Input
                    id="valorTotal"
                    name="valorTotal"
                    value={nota.valorTotal === 0 ? '' : formatCurrency(nota.valorTotal)}
                    onChange={handleCurrencyChange}
                    placeholder="00,00"
                    />
                  {errors.valorTotal && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.valorTotal}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chaveAcesso">Chave de Acesso *</Label>
                  <Input
                    id="chaveAcesso"
                    name="chaveAcesso"
                    value={nota.chaveAcesso}
                    onChange={handleChange}
                    placeholder="Chave de acesso da nota fiscal"
                  />
                  {errors.chaveAcesso && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.chaveAcesso}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  name="observacoes"
                  value={nota.observacoes || ""}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre a nota"
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="sm:justify-start gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Nota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Editar Nota Fiscal</DialogTitle>
            </div>
            <DialogDescription>
              Edite os campos necessários da nota fiscal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Nota *</Label>
                  <Select 
                    value={nota.tipo} 
                    onValueChange={(value) => handleSelectChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de nota" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposNota.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Nota *</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={nota.numero}
                    onChange={handleChange}
                    placeholder="Ex: 123456"
                  />
                  {errors.numero && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.numero}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Popover open={openFornecedorDropdown} onOpenChange={setOpenFornecedorDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFornecedorDropdown}
                        className="w-full justify-between"
                      >
                        {nota.emissor || "Selecione um fornecedor..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar fornecedor por CNPJ ou Razão Social..."
                          value={searchFornecedor}
                          onValueChange={setSearchFornecedor}
                        />
                        <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {filteredFornecedores.map((fornecedor) => (
                            <CommandItem
                              key={fornecedor.id}
                              value={`${fornecedor.cnpj} - ${fornecedor.razaoSocial}`}
                              onSelect={() => handleSelectFornecedor(fornecedor)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{fornecedor.razaoSocial}</span>
                                <span className="text-sm text-muted-foreground">{fornecedor.cnpj}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.emissor && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.emissor}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpjEmissor">CNPJ do Emissor *</Label>
                  <Input
                    id="cnpjEmissor"
                    name="cnpjEmissor"
                    value={nota.cnpjEmissor}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    readOnly
                  />
                  {errors.cnpjEmissor && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.cnpjEmissor}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                  <Input
                    id="dataEmissao"
                    name="dataEmissao"
                    type="date"
                    value={nota.dataEmissao}
                    onChange={handleChange}
                  />
                  {errors.dataEmissao && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.dataEmissao}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataRecebimento">Data de Recebimento *</Label>
                  <Input
                    id="dataRecebimento"
                    name="dataRecebimento"
                    type="date"
                    value={nota.dataRecebimento}
                    onChange={handleChange}
                  />
                  {errors.dataRecebimento && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.dataRecebimento}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condicaoPagamento">Condição de Pagamento *</Label>
                  <Select 
                    value={nota.condicaoPagamento?.toString() || "30"} 
                    onValueChange={(value) => handleSelectChange("condicaoPagamento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      {condicoesPagamento.map((condicao) => (
                        <SelectItem key={condicao.value} value={condicao.value.toString()}>
                          {condicao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
                  <Input
                    id="valorTotal"
                    name="valorTotal"
                    value={formatCurrency(nota.valorTotal)}
                    onChange={handleCurrencyChange}
                    placeholder="00.000,00"
                  />
                  {errors.valorTotal && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.valorTotal}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chaveAcesso">Chave de Acesso *</Label>
                  <Input
                    id="chaveAcesso"
                    name="chaveAcesso"
                    value={nota.chaveAcesso}
                    onChange={handleChange}
                    placeholder="Chave de acesso da nota fiscal"
                  />
                  {errors.chaveAcesso && (
                    <Alert variant="destructive" className="mt-2 py-1 px-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{errors.chaveAcesso}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  name="observacoes"
                  value={nota.observacoes || ""}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre a nota"
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="sm:justify-start gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Atualizar Nota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal selecionada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNota && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Número:</Label>
                  <p>{selectedNota.numero}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tipo:</Label>
                  <p>{tiposNota.find(t => t.value === selectedNota.tipo)?.label || selectedNota.tipo}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Emissor:</Label>
                  <p>{selectedNota.emissor}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">CNPJ:</Label>
                  <p>{selectedNota.cnpjEmissor}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Data Emissão:</Label>
                  <p>{formatDate(selectedNota.dataEmissao)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Data Recebimento:</Label>
                  <p>{formatDate(selectedNota.dataRecebimento)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Valor Total:</Label>
                  <p>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(selectedNota.valorTotal)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Condição Pagamento:</Label>
                  <p>{selectedNota.condicaoPagamento || 30} dias</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Vencimento:</Label>
                  <p>{selectedNota.dataVencimento ? formatDate(selectedNota.dataVencimento) : '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status:</Label>
                  <p className="capitalize">{selectedNota.status || 'pendente'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Chave de Acesso:</Label>
                  <p>{selectedNota.chaveAcesso}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground">Cadastrado por:</Label>
                  <p>{selectedNota.nomeUsuario || selectedNota.usuarioCadastro}</p>
                </div>
                {selectedNota.observacoes && (
                  <div className="col-span-2 space-y-1">
                    <Label className="text-muted-foreground">Observações:</Label>
                    <p>{selectedNota.observacoes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {selectedNota.status !== 'lancada' && (
                  <Button 
                    onClick={handleMarcarComoLancada}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Marcar como Lançada
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={handleEditarNota}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleExcluirNota}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de Sucesso */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Nota Cadastrada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center">
              A nota fiscal foi cadastrada no sistema e está disponível para consulta.
            </DialogDescription>
          </DialogHeader>
          
          {lastNotaCadastrada && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Número:</span>
                <span className="text-sm font-medium">{lastNotaCadastrada.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="text-sm font-medium">
                  {tiposNota.find(t => t.value === lastNotaCadastrada.tipo)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Emissor:</span>
                <span className="text-sm font-medium">{lastNotaCadastrada.emissor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor Total:</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(lastNotaCadastrada.valorTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Condição de Pagamento:</span>
                <span className="text-sm font-medium">
                  {lastNotaCadastrada.condicaoPagamento || 30} dias
                </span>
              </div>
              {lastNotaCadastrada.dataVencimento && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data de Vencimento:</span>
                  <span className="text-sm font-medium">
                    {formatDate(lastNotaCadastrada.dataVencimento)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsSuccessModalOpen(false)} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default NotasFiscaisLancamento;