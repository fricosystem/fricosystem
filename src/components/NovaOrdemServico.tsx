import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, getDocs, getFirestore, query, limit, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calculator, Search, Save, Plus, Minus, X } from "lucide-react";
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: string;
}

interface Produto {
  id: string;
  codigo: string;
  codigo_estoque: string;
  codigo_material: string;
  data_vencimento: string;
  deposito: string;
  detalhes: string;
  imagem: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  unidade_de_medida: string;
  valor_unitario: number;
}

interface Equipamento {
  id: string;
  patrimonio: string;
  equipamento: string;
  setor: string;
  tag: string;
}

interface ProdutoSelecionado extends Produto {
  quantidadeSelecionada: number;
}

const NovaOrdemServico = () => {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [responsavelPopoverOpen, setResponsavelPopoverOpen] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [produtosPopoverOpen, setProdutosPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    hrInicial: "",
    linhaParada: "",
    descricaoMotivo: "",
    observacao: "",
    responsavelManutencao: "",
    tipoManutencao: "",
    solucaoAplicada: "",
  });

  // Estado para as origens de parada como checkboxes
  const [origemParada, setOrigemParada] = useState({
    automatizacao: false,
    terceiros: false,
    eletrica: false,
    mecanica: false,
    outro: false
  });

  // Verificar se a coleção existe e criar se necessário
  useEffect(() => {
    const checkCollection = async () => {
      try {
        const q = query(collection(db, "ordens_servicos"), limit(1));
        const querySnapshot = await getDocs(q);
        setCollectionChecked(true);
      } catch (error) {
        toast.error("Erro ao verificar estrutura do banco de dados");
      }
    };

    if (!collectionChecked) {
      checkCollection();
    }
  }, [collectionChecked]);

  // Carregar usuários do Firebase
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const usuariosRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usuariosRef);
        
        const usuariosData: Usuario[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || "",
            email: data.email || "",
            ativo: data.ativo || "",
          });
        });
        
        const usuariosAtivos = usuariosData.filter(u => u.ativo === "sim");
        setUsuarios(usuariosAtivos);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast.error("Não foi possível carregar a lista de usuários.");
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Carregar equipamentos do Firebase
  useEffect(() => {
    const fetchEquipamentos = async () => {
      try {
        setLoadingEquipamentos(true);
        const equipamentosRef = collection(db, "equipamentos");
        const querySnapshot = await getDocs(equipamentosRef);
        
        const equipamentosData: Equipamento[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          equipamentosData.push({
            id: doc.id,
            patrimonio: data.patrimonio || "",
            equipamento: data.equipamento || "",
            setor: data.setor || "",
            tag: data.tag || "",
          });
        });
        
        setEquipamentos(equipamentosData);
      } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
        toast.error("Não foi possível carregar a lista de equipamentos.");
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    fetchEquipamentos();
  }, []);

  // Carregar produtos do Firebase
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const produtosRef = collection(db, "produtos");
        const querySnapshot = await getDocs(produtosRef);
        
        const produtosData: Produto[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          produtosData.push({
            id: doc.id,
            codigo: data.codigo || "",
            codigo_estoque: data.codigo_estoque || "",
            codigo_material: data.codigo_material || "",
            data_vencimento: data.data_vencimento || "",
            deposito: data.deposito || "",
            detalhes: data.detalhes || "",
            imagem: data.imagem || "",
            nome: data.nome || "",
            quantidade: data.quantidade || 0,
            quantidade_minima: data.quantidade_minima || 0,
            unidade: data.unidade || "",
            unidade_de_medida: data.unidade_de_medida || "",
            valor_unitario: data.valor_unitario || 0,
          });
        });
        
        setProdutos(produtosData);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error("Não foi possível carregar a lista de produtos.");
      }
    };

    fetchProdutos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrigemChange = (origem: string, checked: boolean) => {
    setOrigemParada(prev => ({
      ...prev,
      [origem]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getSelectedUsuarioName = () => {
    const selectedId = formData.responsavelManutencao;
    if (!selectedId) return null;
    
    const selectedUsuario = usuarios.find(u => u.id === selectedId);
    return selectedUsuario ? `${selectedUsuario.nome} (${selectedUsuario.cargo})` : null;
  };

  const adicionarProduto = (produto: Produto) => {
    setProdutosSelecionados(prev => {
      const existe = prev.find(p => p.id === produto.id);
      if (existe) {
        return prev.map(p => 
          p.id === produto.id 
            ? { ...p, quantidadeSelecionada: Math.min(p.quantidadeSelecionada + 1, p.quantidade) }
            : p
        );
      }
      return [...prev, { ...produto, quantidadeSelecionada: 1 }];
    });
    setProdutosPopoverOpen(false);
    setSearchTerm("");
  };

  const removerProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => prev.filter(p => p.id !== produtoId));
  };

  const aumentarQuantidade = (produtoId: string) => {
    setProdutosSelecionados(prev =>
      prev.map(p =>
        p.id === produtoId
          ? { ...p, quantidadeSelecionada: Math.min(p.quantidadeSelecionada + 1, p.quantidade) }
          : p
      )
    );
  };

  const diminuirQuantidade = (produtoId: string) => {
    setProdutosSelecionados(prev =>
      prev.map(p =>
        p.id === produtoId
          ? { ...p, quantidadeSelecionada: Math.max(1, p.quantidadeSelecionada - 1) }
          : p
      )
    );
  };

  const calcularValorTotal = () => {
    return produtosSelecionados.reduce(
      (total, produto) => total + (produto.valor_unitario * produto.quantidadeSelecionada),
      0
    ).toFixed(2);
  };

  const produtosDisponiveis = produtos.filter(
    produto =>
      produto.quantidade > 0 &&
      !produtosSelecionados.some(p => p.id === produto.id) &&
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.equipamento || !formData.descricaoMotivo) {
        toast.error("Por favor, preencha os campos obrigatórios");
        setIsSubmitting(false);
        return;
      }
      
      const batch = writeBatch(db);
      
      const ordemData = {
        setor: formData.setor,
        equipamento: formData.equipamento,
        hrInicial: formData.hrInicial,
        linhaParada: formData.linhaParada,
        descricaoMotivo: formData.descricaoMotivo,
        observacao: formData.observacao,
        origemParada: origemParada,
        responsavelManutencao: formData.responsavelManutencao,
        tipoManutencao: formData.tipoManutencao,
        solucaoAplicada: formData.solucaoAplicada,
        produtosUtilizados: produtosSelecionados.map(p => ({
          produtoId: p.id,
          nome: p.nome,
          quantidade: p.quantidadeSelecionada,
          valorUnitario: p.valor_unitario,
          valorTotal: p.valor_unitario * p.quantidadeSelecionada
        })),
        valorTotalProdutos: parseFloat(calcularValorTotal()),
        criadoPor: user?.uid || "",
        criadoEm: Timestamp.now(),
        status: "pendente"
      };
      
      const ordemRef = doc(collection(db, "ordens_servicos"));
      batch.set(ordemRef, ordemData);
      
      produtosSelecionados.forEach(produto => {
        const produtoRef = doc(db, "produtos", produto.id);
        batch.update(produtoRef, {
          quantidade: produto.quantidade - produto.quantidadeSelecionada
        });
      });

      // Salvar relatórios para cada produto utilizado
      produtosSelecionados.forEach(produto => {
        const relatorioData = {
          requisicao_id: ordemRef.id,
          produto_id: produto.id,
          codigo_material: produto.codigo_material || produto.codigo,
          nome_produto: produto.nome,
          quantidade: produto.quantidadeSelecionada,
          valor_unitario: produto.valor_unitario,
          valor_total: produto.valor_unitario * produto.quantidadeSelecionada,
          status: 'saida',
          tipo: 'Ordem de Serviço',
          solicitante: {
            id: userData?.id || user?.uid || 'system',
            nome: userData?.nome || 'Sistema',
            cargo: userData?.cargo || 'Administrador'
          },
          usuario: {
            id: userData?.id || user?.uid || 'system',
            nome: userData?.nome || 'Sistema',
            email: userData?.email || user?.email || 'sistema@empresa.com'
          },
          deposito: produto.deposito || formData.setor,
          prateleira: "Ordem de Serviço",
          centro_de_custo: formData.setor,
          unidade: produto.unidade || produto.unidade_de_medida || 'UN',
          data_saida: Timestamp.fromDate(new Date()),
          data_registro: Timestamp.fromDate(new Date()),
          equipamento: formData.equipamento,
          setor: formData.setor,
          descricao_motivo: formData.descricaoMotivo,
          responsavel_manutencao: formData.responsavelManutencao
        };

        const relatorioRef = doc(collection(db, "relatorios"));
        batch.set(relatorioRef, relatorioData);
      });
      
      await batch.commit();
      
      toast.success("Ordem de serviço criada com sucesso!");
      
      setFormData({
        setor: "",
        equipamento: "",
        hrInicial: "",
        linhaParada: "",
        descricaoMotivo: "",
        observacao: "",
        responsavelManutencao: "",
        tipoManutencao: "",
        solucaoAplicada: "",
      });
      
      setOrigemParada({
        automatizacao: false,
        terceiros: false,
        eletrica: false,
        mecanica: false,
        outro: false
      });
      
      setProdutosSelecionados([]);
      
    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
      toast.error("Erro ao criar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Nova Ordem de Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setor */}
            <div className="space-y-2">
              <Label htmlFor="setor">Setor*</Label>
              <Select 
                value={formData.setor} 
                onValueChange={(value) => handleSelectChange("setor", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Administração">Administração</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipamento Select com busca */}
            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !formData.equipamento && "text-muted-foreground"
                    )}
                    disabled={loadingEquipamentos}
                  >
                    {loadingEquipamentos
                      ? "Carregando equipamentos..."
                      : formData.equipamento
                        ? equipamentos.find(e => e.equipamento === formData.equipamento)?.patrimonio + " - " + formData.equipamento
                        : "Selecione o equipamento"}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar equipamento..." className="h-9" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                      <CommandGroup>
                        {equipamentos.map((equipamento) => (
                          <CommandItem
                            key={equipamento.id}
                            value={`${equipamento.patrimonio} ${equipamento.equipamento} ${equipamento.setor}`}
                            onSelect={() => {
                              setFormData(prev => ({
                                ...prev,
                                equipamento: equipamento.equipamento,
                                setor: equipamento.setor
                              }));
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.equipamento === equipamento.equipamento
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{equipamento.patrimonio} - {equipamento.equipamento}</span>
                              <span className="text-xs text-muted-foreground">
                                Setor: {equipamento.setor}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Linha Parada */}
            <div className="space-y-2">
              <Label htmlFor="linhaParada">Linha Parada</Label>
              <Input
                id="linhaParada"
                name="linhaParada"
                value={formData.linhaParada}
                onChange={handleChange}
                placeholder="Informe a linha parada (opcional)"
              />
            </div>
            
            {/* Tipo de Manutenção */}
            <div className="space-y-2">
              <Label htmlFor="tipoManutencao">Tipo de Manutenção*</Label>
              <Select 
                value={formData.tipoManutencao} 
                onValueChange={(value) => handleSelectChange("tipoManutencao", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Preditiva">Preditiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Hora Inicial */}
            <div className="space-y-2">
              <Label htmlFor="hrInicial">Hora Inicial</Label>
              <Input
                id="hrInicial"
                name="hrInicial"
                type="time"
                value={formData.hrInicial}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {/* Produtos Utilizados */}
          <div className="space-y-2">
            <Label>Produtos Utilizados</Label>
            <Popover 
              open={produtosPopoverOpen} 
              onOpenChange={setProdutosPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full md:w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar produto..." 
                    className="h-9" 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Nenhum produto encontrado ou todos já foram selecionados.</CommandEmpty>
                    <CommandGroup>
                      {produtosDisponiveis.map((produto) => (
                        <CommandItem
                          key={produto.id}
                          value={`${produto.nome} ${produto.codigo}`}
                          onSelect={() => adicionarProduto(produto)}
                        >
                          <div className="flex flex-col">
                            <span>{produto.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              Código: {produto.codigo} • Estoque: {produto.quantidade} {produto.unidade}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Lista de produtos selecionados */}
            {produtosSelecionados.length > 0 && (
              <div className="mt-4 space-y-3">
                {produtosSelecionados.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{produto.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {produto.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {produto.unidade}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => diminuirQuantidade(produto.id)}
                        disabled={produto.quantidadeSelecionada <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-center min-w-[40px]">
                        {produto.quantidadeSelecionada}
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => aumentarQuantidade(produto.id)}
                        disabled={produto.quantidadeSelecionada >= produto.quantidade}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => removerProduto(produto.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Valor total */}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-lg font-semibold">
                    Total: {new Number(calcularValorTotal()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Responsável pela Manutenção com busca */}
          <div className="space-y-2">
            <Label htmlFor="responsavelManutencao">Responsável pela Manutenção*</Label>
            <Popover 
              open={responsavelPopoverOpen} 
              onOpenChange={setResponsavelPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !formData.responsavelManutencao && "text-muted-foreground"
                  )}
                  disabled={loadingUsuarios}
                >
                  {loadingUsuarios
                    ? "Carregando usuários..."
                    : formData.responsavelManutencao
                      ? getSelectedUsuarioName()
                      : "Selecione o responsável"}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full md:w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar usuário..." className="h-9" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                    <CommandGroup>
                      {usuarios.map((usuario) => (
                        <CommandItem
                          key={usuario.id}
                          value={`${usuario.nome} ${usuario.cargo} ${usuario.email}`}
                          onSelect={() => {
                            setFormData(prev => ({
                              ...prev,
                              responsavelManutencao: usuario.id
                            }));
                            setResponsavelPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.responsavelManutencao === usuario.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{usuario.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {usuario.cargo} • {usuario.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Descrição do Motivo */}
          <div className="space-y-2">
            <Label htmlFor="descricaoMotivo">Descrição do Motivo*</Label>
            <Textarea
              id="descricaoMotivo"
              name="descricaoMotivo"
              value={formData.descricaoMotivo}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva detalhadamente o problema encontrado"
            />
          </div>
          
          {/* Solução Aplicada */}
          <div className="space-y-2">
            <Label htmlFor="solucaoAplicada">Solução Aplicada</Label>
            <Textarea
              id="solucaoAplicada"
              name="solucaoAplicada"
              value={formData.solucaoAplicada}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva a solução aplicada"
            />
          </div>
          
          {/* Origem da Parada (checkboxes) */}
          <div className="space-y-2">
            <Label>Origem da Parada</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="automatizacao" 
                  checked={origemParada.automatizacao}
                  onCheckedChange={(checked) => handleOrigemChange("automatizacao", checked as boolean)}
                />
                <Label htmlFor="automatizacao">Automatização</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terceiros" 
                  checked={origemParada.terceiros}
                  onCheckedChange={(checked) => handleOrigemChange("terceiros", checked as boolean)}
                />
                <Label htmlFor="terceiros">Terceiros</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="eletrica" 
                  checked={origemParada.eletrica}
                  onCheckedChange={(checked) => handleOrigemChange("eletrica", checked as boolean)}
                />
                <Label htmlFor="eletrica">Elétrica</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mecanica" 
                  checked={origemParada.mecanica}
                  onCheckedChange={(checked) => handleOrigemChange("mecanica", checked as boolean)}
                />
                <Label htmlFor="mecanica">Mecânica</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="outro" 
                  checked={origemParada.outro}
                  onCheckedChange={(checked) => handleOrigemChange("outro", checked as boolean)}
                />
                <Label htmlFor="outro">Outro</Label>
              </div>
            </div>
          </div>
          
          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              rows={3}
              placeholder="Observações adicionais"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ordem de Serviço
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NovaOrdemServico;