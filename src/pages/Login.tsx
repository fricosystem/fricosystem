import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";
import { LoginForm } from "@/components/Login/Auth/LoginForm";
import { RegisterForm } from "@/components/Login/Auth/RegisterForm";
import { UserButton } from "@/components/Login/UserButton";
import { 
  BarChart4, Calendar, Database, FileText, Users,
  Phone, Mail, MessageSquare, Bot, Zap, ShieldCheck, TrendingUp, Package,
  Wrench, ClipboardList, Building2, BookOpen, ArrowRight, CheckCircle2,
  MessageCircle, Search, BarChart2, Layers, Settings, Factory, Truck,
  AlertTriangle, FileCheck, Shield, Clock, Target, Gauge
} from "lucide-react";
import { useThemedLogo } from "@/hooks/useThemedLogo";

// Estatísticas do sistema
const stats = [
  { value: "99.9%", label: "Disponibilidade" },
  { value: "24/7", label: "Suporte ativo" },
  { value: "100%", label: "Dados em tempo real" },
  { value: "256-bit", label: "Criptografia" },
];

// Módulos principais do sistema
const modules = [
  { icon: <Package className="h-5 w-5" />, label: "Estoque" },
  { icon: <Wrench className="h-5 w-5" />, label: "Manutenção" },
  { icon: <ClipboardList className="h-5 w-5" />, label: "Requisições" },
  { icon: <Building2 className="h-5 w-5" />, label: "Fornecedores" },
  { icon: <BookOpen className="h-5 w-5" />, label: "Manuais" },
  { icon: <BarChart4 className="h-5 w-5" />, label: "Relatórios" },
  { icon: <Users className="h-5 w-5" />, label: "Equipes" },
  { icon: <Layers className="h-5 w-5" />, label: "Transferências" },
];

// Capacidades do APEX AI
const aiCapabilities = [
  {
    icon: <Search className="h-6 w-6 text-blue-400" />,
    title: "Consulta Inteligente",
    description: "Pergunte sobre qualquer produto, fornecedor ou equipamento em linguagem natural e receba respostas precisas."
  },
  {
    icon: <BarChart2 className="h-6 w-6 text-blue-400" />,
    title: "Relatórios Automáticos",
    description: "Solicite relatórios completos de estoque, manutenção ou custos instantaneamente via chat."
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-blue-400" />,
    title: "Assistente 24/7",
    description: "Acesse ajuda sobre qualquer funcionalidade do sistema a qualquer momento, direto do chat."
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
    title: "Análise de Dados",
    description: "Identifique produtos em falta, vencimentos próximos e gargalos operacionais automaticamente."
  },
];

// Funcionalidades detalhadas do sistema (páginas reais)
const systemFeatures = [
  {
    category: "Gestão de Estoque",
    icon: <Package className="h-8 w-8 text-emerald-400" />,
    color: "emerald",
    items: [
      { name: "Produtos", path: "/produtos", desc: "Cadastro completo com código, descrição, unidade, preço e localização em depósito" },
      { name: "Notas Fiscais", path: "/notas-fiscais", desc: "Lançamento de entradas via XML ou manual com conferência automática" },
      { name: "Requisições", path: "/requisicoes", desc: "Solicitação de materiais com aprovação multinível e rastreamento" },
      { name: "Inventário", path: "/inventario", desc: "Contagem cíclica com ajustes automáticos e relatórios de divergência" },
    ]
  },
  {
    category: "Manutenção Industrial",
    icon: <Wrench className="h-8 w-8 text-orange-400" />,
    color: "orange",
    items: [
      { name: "Preventiva", path: "/manutencao-preventiva", desc: "Planejamento de manutenções com frequência, tarefas e responsáveis" },
      { name: "Ordens de Serviço", path: "/ordens-servico", desc: "Abertura, acompanhamento e encerramento de OS com histórico completo" },
      { name: "Execução", path: "/execucao-manutencao", desc: "Registro de execução com horas, peças utilizadas e observações" },
      { name: "Parada de Máquina", path: "/parada-maquina", desc: "Registro de paradas com motivo, duração e impacto na produção" },
    ]
  },
  {
    category: "Gestão de Ativos",
    icon: <Factory className="h-8 w-8 text-blue-400" />,
    color: "blue",
    items: [
      { name: "Máquinas", path: "/maquinas", desc: "Cadastro de equipamentos com patrimônio, setor e histórico de manutenção" },
      { name: "Setores", path: "/setores", desc: "Organização da planta por áreas produtivas e centros de custo" },
      { name: "Fornecedores", path: "/gestao-fornecedores", desc: "Gestão de parceiros com contatos, condições e avaliação" },
      { name: "Manuais", path: "/manuais", desc: "Biblioteca digital de manuais técnicos e procedimentos" },
    ]
  },
  {
    category: "Administração",
    icon: <Settings className="h-8 w-8 text-purple-400" />,
    color: "purple",
    items: [
      { name: "Usuários", path: "/gestao-usuarios", desc: "Controle de acesso com perfis, permissões e unidades" },
      { name: "Unidades", path: "/unidades", desc: "Gestão de filiais e plantas industriais" },
      { name: "Centro de Custo", path: "/centro-custo", desc: "Alocação de despesas por área e projeto" },
      { name: "Relatórios", path: "/relatorios", desc: "Dashboards e relatórios gerenciais personalizados" },
    ]
  },
];

// Diferenciais do sistema
const differentials = [
  {
    icon: <Shield className="h-10 w-10 text-emerald-400" />,
    title: "Segurança Avançada",
    description: "Autenticação segura, criptografia de ponta a ponta e controle de acesso por perfil."
  },
  {
    icon: <Zap className="h-10 w-10 text-yellow-400" />,
    title: "Performance",
    description: "Sistema otimizado para resposta rápida mesmo com grande volume de dados."
  },
  {
    icon: <Clock className="h-10 w-10 text-blue-400" />,
    title: "Tempo Real",
    description: "Atualizações instantâneas em todas as telas para tomada de decisão ágil."
  },
  {
    icon: <Target className="h-10 w-10 text-purple-400" />,
    title: "Foco Industrial",
    description: "Desenvolvido especificamente para as necessidades da gestão industrial."
  },
  {
    icon: <Gauge className="h-10 w-10 text-orange-400" />,
    title: "Indicadores",
    description: "KPIs e métricas de desempenho para acompanhamento da operação."
  },
  {
    icon: <Bot className="h-10 w-10 text-cyan-400" />,
    title: "Inteligência Artificial",
    description: "Assistente APEX AI integrado para suporte e consultas inteligentes."
  },
];

const Login = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  
  // Estados do formulário de contato
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Efeito para scroll suave
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.matches('a[href^="#"]')) {
        e.preventDefault();
        const id = target.getAttribute('href');
        if (id) {
          const element = document.querySelector(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (id === '#hero') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const logoSrc = useThemedLogo();

  const openLoginModal = () => {
    setActiveTab("login");
    setAuthModalOpen(true);
  };
  
  const openRegisterModal = () => {
    setActiveTab("register");
    setAuthModalOpen(true);
  };
  
  const handleSuccess = () => {
    setAuthModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Mensagem enviada",
        description: "Agradecemos seu contato. Retornaremos em breve!",
      });
      setName("");
      setEmail("");
      setMessage("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-hidden bg-gradient-to-b from-[#0a1628] via-[#0d1a2d] to-[#060d14] text-white flex flex-col">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md py-2 md:py-3 h-14 md:h-20 bg-[#0a1628]/80 border-b border-gray-800/30 w-screen max-w-full">
        <div className="w-full h-full px-3 md:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="#hero" className="flex items-center gap-2">
              <img 
                src={logoSrc} 
                alt="APEX HUB Logo" 
                className="w-8 h-8 md:w-14 md:h-14 rounded-lg object-scale-down" 
              />
              <div className="flex flex-col justify-center">
                <span className="text-base md:text-2xl font-bold text-white leading-tight">APEX HUB</span>
                <p className="hidden md:block text-xs font-medium text-gray-400">Sistema de Gestão Industrial</p>
              </div>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#hero" className="text-white hover:text-gray-300 transition-colors duration-300">Início</a>
            <a href="#apex-ai" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />APEX AI
            </a>
            <a href="#features" className="text-white hover:text-gray-300 transition-colors duration-300">Funcionalidades</a>
            <a href="#modules" className="text-white hover:text-gray-300 transition-colors duration-300">Módulos</a>
            <a href="#contact" className="text-white hover:text-gray-300 transition-colors duration-300">Contato</a>
          </nav>
          
          <div className="flex items-center space-x-2">
            {user ? (
              <UserButton user={user} />
            ) : (
              <>
                <Button variant="outline" onClick={openLoginModal} className="bg-transparent border-gray-600 text-white hover:bg-white hover:text-black transition-all text-xs md:text-sm h-8 md:h-10 px-3 md:px-4">
                  Entrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm h-8 md:h-10 px-3 md:px-4" onClick={openRegisterModal}>
                  Cadastre-se
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        
        {/* Hero Section */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
          <div className="container mx-auto relative z-10 px-4 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
              Sistema de Gestão Industrial
              <br />
              <span className="text-3xl md:text-4xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">APEX HUB</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mb-8 animate-fade-up leading-relaxed">
              Gerencie estoque, manutenção, requisições e toda a operação industrial em uma única plataforma integrada com inteligência artificial.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={openLoginModal}>
                Acessar Sistema
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-gray-600 text-white hover:bg-white/10" asChild>
                <a href="#features">Conhecer Funcionalidades</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-gray-800/40 bg-[#0d1a2d]/50 backdrop-blur-sm py-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-blue-400">{stat.value}</span>
                  <span className="text-sm text-gray-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Módulos do Sistema */}
        <section className="py-14 border-b border-gray-800/40">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
              Módulos integrados na plataforma
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {modules.map((mod, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700/60 bg-gray-900/40 text-gray-300 text-sm hover:border-blue-500/50 hover:text-blue-400 transition-colors backdrop-blur-sm"
                >
                  {mod.icon}
                  <span>{mod.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APEX AI Section */}
        <section id="apex-ai" className="py-24 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: texto */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/15 border border-blue-500/25 rounded-full mb-6">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Inteligência Artificial</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 text-balance leading-tight">
                  Conheça o <span className="text-blue-400">APEX AI</span>,<br />
                  seu assistente industrial
                </h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  O APEX AI está integrado a todas as funcionalidades do sistema. Consulte produtos, fornecedores, equipamentos e ordens de serviço em linguagem natural e receba respostas precisas em segundos.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Acesso completo aos dados de estoque em tempo real",
                    "Gera relatórios sob demanda via chat",
                    "Identifica produtos com estoque baixo ou vencidos",
                    "Responde sobre fornecedores, equipamentos e manutenção",
                    "Orienta sobre como usar cada funcionalidade do sistema",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={openLoginModal}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-6"
                >
                  Experimentar agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Right: cards de capacidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiCapabilities.map((cap, i) => (
                  <div
                    key={i}
                    className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 hover:border-blue-500/30 hover:bg-gray-900/80 transition-all backdrop-blur-sm group"
                  >
                    <div className="mb-3 p-2 bg-blue-600/10 rounded-lg w-fit group-hover:bg-blue-600/20 transition-colors">
                      {cap.icon}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-2">{cap.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{cap.description}</p>
                  </div>
                ))}

                {/* Mock chat preview */}
                <div className="sm:col-span-2 bg-gray-950/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400 font-medium">APEX AI - online</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <span className="bg-blue-600/80 text-white text-xs px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%]">
                        Quantos rolamentos temos em estoque?
                      </span>
                    </div>
                    <div className="flex justify-start">
                      <span className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[80%]">
                        Encontrei <strong>3 tipos</strong> de rolamentos em estoque: Rolamento 6204 (12 un.), Rolamento 6205 (8 un.) e Rolamento 6304 (5 un.). Total: 25 unidades.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Differentials Section */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Por que escolher o APEX HUB?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Uma plataforma completa desenvolvida para otimizar a gestão industrial com tecnologia de ponta.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {differentials.map((item, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 shadow-lg hover:border-gray-700 transition-all backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-800/50 rounded-xl">
                        {item.icon}
                      </div>
                      <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-400">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* System Features Section */}
        <section id="modules" className="py-24 bg-[#0d1a2d]/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Funcionalidades do Sistema</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Conheça todas as páginas e funcionalidades disponíveis no APEX HUB para gerenciar sua operação industrial.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {systemFeatures.map((category, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 shadow-lg backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-gray-800/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-800/50 rounded-xl">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">{category.category}</CardTitle>
                        <CardDescription className="text-gray-500">{category.items.length} funcionalidades</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {category.items.map((item, i) => (
                        <div 
                          key={i} 
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors group"
                        >
                          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            category.color === 'emerald' ? 'text-emerald-400' :
                            category.color === 'orange' ? 'text-orange-400' :
                            category.color === 'blue' ? 'text-blue-400' :
                            'text-purple-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                              {item.name}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Fale Conosco</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Estamos à disposição para tirar suas dúvidas sobre o sistema APEX HUB.
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-white mb-2 text-sm font-medium">Nome</label>
                        <Input 
                          id="name" 
                          placeholder="Seu nome" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          required 
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-white mb-2 text-sm font-medium">Email</label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500" 
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-white mb-2 text-sm font-medium">Mensagem</label>
                      <Textarea 
                        id="message" 
                        placeholder="Como podemos ajudar?" 
                        rows={5} 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        required 
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 resize-none" 
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar Mensagem"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800/50 bg-[#060d14]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoSrc} alt="APEX HUB" className="w-10 h-10 rounded-lg" />
                <span className="text-white text-lg font-bold">APEX HUB</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema de gestão industrial completo para otimizar sua operação com tecnologia de ponta e inteligência artificial.
              </p>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wide">Navegação</h3>
              <ul className="space-y-2">
                <li><a href="#hero" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">Início</a></li>
                <li><a href="#apex-ai" className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-1.5"><Bot className="w-3 h-3" />APEX AI</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">Funcionalidades</a></li>
                <li><a href="#modules" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">Módulos</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wide">Sistema</h3>
              <ul className="space-y-2">
                <li className="text-gray-400 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Segurança avançada
                </li>
                <li className="text-gray-400 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Alta performance
                </li>
                <li className="text-gray-400 text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  IA integrada
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} APEX HUB. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-[#0d1a2d] to-[#0a1628] backdrop-blur-xl border border-blue-500/20 text-white shadow-2xl">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 mb-6 pt-4">
              <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                <img src={logoSrc} alt="APEX HUB" className="w-12 h-12 rounded-lg" />
              </div>
              <div className="text-center">
                <DialogTitle className="text-2xl font-bold text-white mb-2">
                  {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
                </DialogTitle>
                <p className="text-gray-400 text-sm">
                  {activeTab === "login" 
                    ? "Entre com suas credenciais para acessar o APEX HUB" 
                    : "Preencha os dados para criar sua conta"
                  }
                </p>
              </div>
            </div>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800/50 rounded-lg p-1">
              <TabsTrigger 
                value="login" 
                className="text-gray-300 bg-transparent hover:bg-gray-800/50 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-gray-300 bg-transparent hover:bg-gray-800/50 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-200"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <RegisterForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
