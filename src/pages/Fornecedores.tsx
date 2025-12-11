import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import AppLayout from "@/layouts/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Eye, Search } from "lucide-react";
import { User } from "firebase/auth";
import ModalFornecedor from "@/components/modalFornecedores";

declare global {
  interface Window {
    handleCNPJResponse: (data: any) => void;
  }
}

interface Supplier {
  razaoSocial: string;
  cnpj: string;
  endereco: {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone: string;
  email: string;
  pessoaContato: string;
  condicoesPagamento: string;
  prazoEntrega: string;
}

interface CNPJResponse {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  atividade_principal: Array<{
    text: string;
  }>;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  qsa: Array<{
    nome: string;
  }>;
  error?: string;
}

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  
  if (
    cnpj === '00000000000000' || 
    cnpj === '11111111111111' || 
    cnpj === '22222222222222' ||
    cnpj === '33333333333333' || 
    cnpj === '44444444444444' || 
    cnpj === '55555555555555' ||
    cnpj === '66666666666666' || 
    cnpj === '77777777777777' || 
    cnpj === '88888888888888' ||
    cnpj === '99999999999999'
  ) {
    return false;
  }
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  return resultado === parseInt(digitos.charAt(1));
};

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .substring(0, 15);
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

const SupplierPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    razaoSocial: "",
    cnpj: "",
    endereco: {
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: ""
    },
    telefone: "",
    email: "",
    pessoaContato: "",
    condicoesPagamento: "",
    prazoEntrega: ""
  });

  const fetchCNPJData = (cnpj: string) => {
    const cnpjNumeros = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjNumeros.length !== 14) {
      toast.warning("CNPJ deve conter 14 dígitos");
      return;
    }

    setIsFetchingCNPJ(true);

    const script = document.createElement('script');
    script.src = `https://receitaws.com.br/v1/cnpj/${cnpjNumeros}?callback=handleCNPJResponse`;
    
    window.handleCNPJResponse = (data: CNPJResponse) => {
      document.body.removeChild(script);
      delete window.handleCNPJResponse;
      
      if (data.error) {
        toast.error(data.error);
        setIsFetchingCNPJ(false);
        return;
      }
      
      if (data.nome) {
        setFormData(prev => ({
          ...prev,
          razaoSocial: data.nome,
          cnpj: formatCNPJ(data.cnpj),
          endereco: {
            rua: data.logradouro || "",
            numero: data.numero || "",
            complemento: data.complemento || "",
            bairro: data.bairro || "",
            cidade: data.municipio || "",
            estado: data.uf || "",
            cep: formatCEP(data.cep || "")
          },
          telefone: formatPhone(data.telefone || ""),
          email: data.email || "",
          pessoaContato: data.qsa?.[0]?.nome || ""
        }));
        
        toast.success("Dados do CNPJ preenchidos automaticamente");
      } else {
        toast.warning("CNPJ válido, mas não encontrado na base de dados");
      }
      setIsFetchingCNPJ(false);
    };

    script.onerror = () => {
      document.body.removeChild(script);
      if (window.handleCNPJResponse) {
        delete window.handleCNPJResponse;
      }
      toast.error("Erro ao buscar CNPJ. Tente novamente mais tarde.");
      setIsFetchingCNPJ(false);
    };

    document.body.appendChild(script);
  };

  useEffect(() => {
    return () => {
      if (window.handleCNPJResponse) {
        delete window.handleCNPJResponse;
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchSuppliers();
      } else {
        navigate("/");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const fetchSuppliers = async () => {
    try {
      const suppliersSnapshot = await getDocs(collection(db, "fornecedores"));
      const suppliersData = suppliersSnapshot.docs.map(doc => doc.data() as Supplier);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar a lista de fornecedores");
    }
  };
  
  const abrirModal = (fornecedor: Supplier) => {
    setFornecedorSelecionado(fornecedor);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorSelecionado(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData.endereco,
          [child]: value
        }
      });
    } else if (name === "cnpj") {
      const formattedValue = formatCNPJ(value);
      setFormData({
        ...formData,
        [name]: formattedValue
      });

      const cnpjNumeros = formattedValue.replace(/[^\d]/g, '');
      if (cnpjNumeros.length === 14) {
        fetchCNPJData(cnpjNumeros);
      }
    } else if (name === "telefone") {
      setFormData({
        ...formData,
        [name]: formatPhone(value)
      });
    } else if (name === "endereco.cep") {
      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          cep: formatCEP(value)
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSelectChange = (value: string, field: string) => {
    setFormData({
      ...formData,
      endereco: {
        ...formData.endereco,
        [field]: value
      }
    });
  };
  
  const handlePaymentChange = (value: string) => {
    setFormData({
      ...formData,
      condicoesPagamento: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.razaoSocial || !formData.cnpj || !formData.endereco.rua || 
        !formData.endereco.cidade || !formData.endereco.estado || 
        !formData.telefone || !formData.email ||
        !formData.condicoesPagamento || !formData.prazoEntrega) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    if (!validateCNPJ(formData.cnpj)) {
      toast.error("CNPJ inválido");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await addDoc(collection(db, "fornecedores"), {
        ...formData,
        createdAt: new Date()
      });
      
      setSuccess(true);
      toast.success("Fornecedor cadastrado com sucesso");
      fetchSuppliers();
      
      setTimeout(() => {
        setFormData({
          razaoSocial: "",
          cnpj: "",
          endereco: {
            rua: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            cep: ""
          },
          telefone: "",
          email: "",
          pessoaContato: "",
          condicoesPagamento: "",
          prazoEntrega: ""
        });
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
      toast.error("Erro ao cadastrar fornecedor");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      razaoSocial: "",
      cnpj: "",
      endereco: {
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: ""
      },
      telefone: "",
      email: "",
      pessoaContato: "",
      condicoesPagamento: "",
      prazoEntrega: ""
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <AppLayout title="Gerenciamento de Fornecedores">
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 p-2 sm:p-0">
        {/* Formulário de Cadastro */}
        <div className="w-full xl:w-5/12 2xl:w-4/12">
          <Card className="shadow-md">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-xl text-white">Cadastro de Fornecedor</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Preencha os dados do fornecedor</CardDescription>
            </CardHeader>
            
            <CardContent className="px-3 sm:px-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="bg-green-100 rounded-full p-2">
                    <Check size={30} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-green-700">Cadastro realizado!</h3>
                  <p className="text-gray-600 mt-1 text-sm text-center">O fornecedor foi adicionado ao sistema.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Dados Principais</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial" className="text-xs">Razão Social</Label>
                      <Input
                        id="razaoSocial"
                        name="razaoSocial"
                        value={formData.razaoSocial}
                        onChange={handleChange}
                        placeholder="Nome da empresa"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-xs">CNPJ</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cnpj"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleChange}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                          className="text-sm flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const cnpjNumeros = formData.cnpj.replace(/[^\d]/g, '');
                            if (cnpjNumeros.length === 14) {
                              fetchCNPJData(cnpjNumeros);
                            } else {
                              toast.warning("Digite um CNPJ completo (14 dígitos)");
                            }
                          }}
                          disabled={isFetchingCNPJ}
                        >
                          {isFetchingCNPJ ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Digite o CNPJ completo para buscar os dados automaticamente
                      </p>
                    </div>
                    
                    <h3 className="text-sm font-medium text-muted-foreground pt-1">Endereço</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="rua" className="text-xs">Rua</Label>
                        <Input
                          id="rua"
                          name="endereco.rua"
                          value={formData.endereco.rua}
                          onChange={handleChange}
                          placeholder="Nome da rua"
                          className="text-sm h-9"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero" className="text-xs">Número</Label>
                        <Input
                          id="numero"
                          name="endereco.numero"
                          value={formData.endereco.numero}
                          onChange={handleChange}
                          placeholder="123"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="text-xs">Bairro</Label>
                        <Input
                          id="bairro"
                          name="endereco.bairro"
                          value={formData.endereco.bairro}
                          onChange={handleChange}
                          placeholder="Nome do bairro"
                          className="text-sm h-9"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-xs">CEP</Label>
                        <Input
                          id="cep"
                          name="endereco.cep"
                          value={formData.endereco.cep}
                          onChange={handleChange}
                          placeholder="00000-000"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="cidade" className="text-xs">Cidade</Label>
                        <Input
                          id="cidade"
                          name="endereco.cidade"
                          value={formData.endereco.cidade}
                          onChange={handleChange}
                          placeholder="Nome da cidade"
                          className="text-sm h-9"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="estado" className="text-xs">Estado</Label>
                        <Select 
                          onValueChange={(value) => handleSelectChange(value, "estado")}
                          value={formData.endereco.estado}
                        >
                          <SelectTrigger className="text-sm h-9">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="complemento" className="text-xs">Complemento</Label>
                      <Input
                        id="complemento"
                        name="endereco.complemento"
                        value={formData.endereco.complemento}
                        onChange={handleChange}
                        placeholder="Sala, Andar, etc."
                        className="text-sm h-9"
                      />
                    </div>
                    
                    <h3 className="text-sm font-medium text-muted-foreground pt-1">Contato</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="telefone" className="text-xs">Telefone</Label>
                        <Input
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className="text-sm h-9"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="exemplo@empresa.com"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pessoaContato" className="text-xs">Pessoa de Contato</Label>
                      <Input
                        id="pessoaContato"
                        name="pessoaContato"
                        value={formData.pessoaContato}
                        onChange={handleChange}
                        placeholder="Nome completo"
                        className="text-sm h-9"
                      />
                    </div>
                    
                    <h3 className="text-sm font-medium text-muted-foreground pt-1">Informações Comerciais</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="condicoesPagamento" className="text-xs">Condições de Pagamento</Label>
                        <Select 
                          onValueChange={handlePaymentChange}
                          value={formData.condicoesPagamento}
                        >
                          <SelectTrigger className="text-sm h-9">
                            <SelectValue placeholder="Condição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="À vista">À vista</SelectItem>
                            <SelectItem value="7 dias">7 dias</SelectItem>
                            <SelectItem value="15 dias">15 dias</SelectItem>
                            <SelectItem value="21 dias">21 dias</SelectItem>
                            <SelectItem value="30 dias">30 dias</SelectItem>
                            <SelectItem value="45 dias">45 dias</SelectItem>
                            <SelectItem value="60 dias">60 dias</SelectItem>
                            <SelectItem value="90 dias">90 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="prazoEntrega" className="text-xs">Prazo de Entrega (dias)</Label>
                        <Input
                          id="prazoEntrega"
                          name="prazoEntrega"
                          type="number"
                          min="1"
                          value={formData.prazoEntrega}
                          onChange={handleChange}
                          placeholder="Dias"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      className="text-xs h-9 w-full sm:w-auto order-2 sm:order-1"
                    >
                      Limpar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || isFetchingCNPJ} 
                      className="bg-blue-700 hover:bg-blue-800 text-xs h-9 w-full sm:w-auto order-1 sm:order-2"
                    >
                      {isLoading ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de Fornecedores */}
        <div className="w-full xl:w-7/12 2xl:w-8/12">
          <Card className="shadow-md">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-xl text-white">Lista de Fornecedores</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Fornecedores cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
              {/* Mobile: Cards compactos */}
              <div className="block lg:hidden space-y-3">
                {suppliers.length > 0 ? (
                  suppliers.map((supplier, index) => (
                    <div 
                      key={index} 
                      className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-2 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2">
                            {supplier.razaoSocial}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {supplier.cnpj}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => abrirModal(supplier)}
                          className="text-muted-foreground hover:text-primary h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Cidade/UF:</span>
                          <p className="font-medium text-foreground truncate">
                            {supplier.endereco.cidade}/{supplier.endereco.estado}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Telefone:</span>
                          <p className="font-medium text-foreground">{supplier.telefone}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Pagamento:</span>
                          <p className="font-medium text-foreground">{supplier.condicoesPagamento}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Prazo:</span>
                          <p className="font-medium text-foreground">{supplier.prazoEntrega} dias</p>
                        </div>
                      </div>
                      
                      <div className="text-xs pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium text-foreground truncate">{supplier.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum fornecedor cadastrado
                  </div>
                )}
              </div>

              {/* Desktop/Tablet: Table with horizontal scroll */}
              <div className="hidden lg:block">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] text-xs whitespace-nowrap">Razão Social</TableHead>
                        <TableHead className="min-w-[160px] text-xs whitespace-nowrap">CNPJ</TableHead>
                        <TableHead className="min-w-[140px] text-xs whitespace-nowrap">Cidade/Estado</TableHead>
                        <TableHead className="min-w-[130px] text-xs whitespace-nowrap">Telefone</TableHead>
                        <TableHead className="min-w-[200px] text-xs whitespace-nowrap">Email</TableHead>
                        <TableHead className="min-w-[110px] text-xs whitespace-nowrap">Pagamento</TableHead>
                        <TableHead className="min-w-[80px] text-xs whitespace-nowrap">Prazo</TableHead>
                        <TableHead className="text-right min-w-[70px] text-xs whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-xs max-w-[200px] truncate">{supplier.razaoSocial}</TableCell>
                            <TableCell className="text-xs">{supplier.cnpj}</TableCell>
                            <TableCell className="text-xs">{`${supplier.endereco.cidade}/${supplier.endereco.estado}`}</TableCell>
                            <TableCell className="text-xs">{supplier.telefone}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">{supplier.email}</TableCell>
                            <TableCell className="text-xs">{supplier.condicoesPagamento}</TableCell>
                            <TableCell className="text-xs">{supplier.prazoEntrega} dias</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => abrirModal(supplier)}
                                className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                            Nenhum fornecedor cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {modalAberto && fornecedorSelecionado && (
        <ModalFornecedor 
          fornecedor={fornecedorSelecionado} 
          onClose={fecharModal} 
        />
      )}
    </AppLayout>
  );
};

export default SupplierPage;