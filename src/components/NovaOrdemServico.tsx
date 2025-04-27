import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, getDocs, getFirestore, query, limit } from "firebase/firestore";
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
import { Loader2, Calculator, Search, Save } from "lucide-react";
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

const NovaOrdemServico = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [responsavelPopoverOpen, setResponsavelPopoverOpen] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    hrInicial: "",
    hrFinal: "",
    tempoParada: "",
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
        // Tentar obter pelo menos um documento da coleção
        const q = query(collection(db, "ordens_servicos"), limit(1));
        const querySnapshot = await getDocs(q);
        
        // Se não houver erro, a coleção existe ou foi criada automaticamente
        setCollectionChecked(true);
        console.log("Coleção ordens_servicos verificada ou criada automaticamente");
      } catch (error) {
        console.error("Erro ao verificar coleção:", error);
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
        
        // Filtrar apenas usuários ativos
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

  // Função para lidar com mudanças nos campos de formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com mudanças nos checkboxes de origem de parada
  const handleOrigemChange = (origem: string, checked: boolean) => {
    setOrigemParada(prev => ({
      ...prev,
      [origem]: checked
    }));
  };

  // Função para lidar com mudanças nos selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para cálculo automático do tempo de parada
  const calcularTempoParada = () => {
    if (formData.hrInicial && formData.hrFinal) {
      try {
        const dataInicial = new Date(`2000-01-01T${formData.hrInicial}`);
        const dataFinal = new Date(`2000-01-01T${formData.hrFinal}`);
        
        // Se a hora final for menor que a inicial, assumimos que passou para o dia seguinte
        let diff = dataFinal.getTime() - dataInicial.getTime();
        if (diff < 0) {
          dataFinal.setDate(dataFinal.getDate() + 1);
          diff = dataFinal.getTime() - dataInicial.getTime();
        }
        
        // Converter a diferença para horas e minutos
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Formatar o resultado
        const tempoFormatado = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setFormData(prev => ({
          ...prev,
          tempoParada: tempoFormatado
        }));
      } catch (error) {
        console.error("Erro ao calcular tempo de parada:", error);
      }
    }
  };

  // Effect para calcular tempo sempre que hora inicial ou final mudar
  useEffect(() => {
    calcularTempoParada();
  }, [formData.hrInicial, formData.hrFinal]);

  // Get selected usuário name for display
  const getSelectedUsuarioName = () => {
    const selectedId = formData.responsavelManutencao;
    if (!selectedId) return null;
    
    const selectedUsuario = usuarios.find(u => u.id === selectedId);
    return selectedUsuario ? `${selectedUsuario.nome} (${selectedUsuario.cargo})` : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validação básica
      if (!formData.equipamento || !formData.descricaoMotivo) {
        toast.error("Por favor, preencha os campos obrigatórios");
        setIsSubmitting(false);
        return;
      }
      
      // Dados da ordem de serviço em formato consistente com o componente de listagem
      const ordemData = {
        setor: formData.setor,
        equipamento: formData.equipamento,
        hrInicial: formData.hrInicial,
        hrFinal: formData.hrFinal,
        tempoParada: formData.tempoParada,
        linhaParada: formData.linhaParada,
        descricaoMotivo: formData.descricaoMotivo,
        observacao: formData.observacao,
        origemParada: origemParada, // Objeto com os checkboxes
        responsavelManutencao: formData.responsavelManutencao,
        tipoManutencao: formData.tipoManutencao,
        solucaoAplicada: formData.solucaoAplicada,
        criadoPor: user?.uid || "",
        criadoEm: Timestamp.now(),
        status: "pendente"
      };
      
      // Salvar no Firebase
      await addDoc(collection(db, "ordens_servicos"), ordemData);
      
      toast.success("Ordem de serviço criada com sucesso!");
      
      // Reseta o formulário
      setFormData({
        setor: "",
        equipamento: "",
        hrInicial: "",
        hrFinal: "",
        tempoParada: "",
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

            {/* Equipamento Select */}
            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento*</Label>
              <Select 
                value={formData.equipamento} 
                onValueChange={(value) => handleSelectChange("equipamento", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Linha 1">Linha 1</SelectItem>
                  <SelectItem value="Linha 2">Linha 2</SelectItem>
                  <SelectItem value="Linha 3">Linha 3</SelectItem>
                  <SelectItem value="Dobradeira">Dobradeira</SelectItem>
                  <SelectItem value="Prensa">Prensa</SelectItem>
                  <SelectItem value="Compressor">Compressor</SelectItem>
                </SelectContent>
              </Select>
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
            
            {/* Horários e Tempos */}
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
            
            <div className="space-y-2">
              <Label htmlFor="hrFinal">Hora Final</Label>
              <Input
                id="hrFinal"
                name="hrFinal"
                type="time"
                value={formData.hrFinal}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tempoParada">Tempo de Parada (hh:mm)</Label>
              <div className="flex">
                <Input
                  id="tempoParada"
                  name="tempoParada"
                  value={formData.tempoParada}
                  onChange={handleChange}
                  placeholder="00:00"
                  readOnly
                  className="bg-muted"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="ml-2 px-3"
                  onClick={calcularTempoParada}
                  title="Recalcular tempo de parada"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            className="w-full bg-blue-600 hover:bg-blue-700"
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