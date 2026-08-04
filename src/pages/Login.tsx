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
  BarChart4, Users, Zap, ShieldCheck, Package, Wrench, ClipboardList,
  Building2, BookOpen, ArrowRight, Layers, Shield, Clock, Target, Gauge,
  FileCheck
} from "lucide-react";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import { Reveal } from "@/components/Login/Reveal";
import { ModuleSectionBlock } from "@/components/Login/ModuleSectionBlock";
import { moduleSections } from "@/components/Login/modulesData";

// Estatísticas do sistema
const stats = [
  { value: "99.9%", label: "Disponibilidade" },
  { value: "24/7", label: "Suporte ativo" },
  { value: "100%", label: "Dados em tempo real" },
  { value: "+7", label: "Módulos integrados" },
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
  { icon: <FileCheck className="h-5 w-5" />, label: "Qualidade" },
  { icon: <Gauge className="h-5 w-5" />, label: "PCP" },
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
    icon: <Layers className="h-10 w-10 text-cyan-400" />,
    title: "Módulos Integrados",
    description: "Estoque, manutenção, qualidade e administração compartilhando a mesma base de dados."
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
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl py-2 md:py-3 h-14 md:h-20 bg-black/20 border-b border-white/5 w-screen max-w-full">
        <div className="w-full h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="#hero" className="flex items-center gap-2">
              <img 
                src={logoSrc} 
                alt="APEX ERP Logo" 
                className="w-8 h-8 md:w-14 md:h-14 rounded-lg object-scale-down" 
              />
              <div className="flex flex-col justify-center">
                <span className="text-base md:text-2xl font-bold text-white leading-tight">APEX ERP</span>
                <p className="hidden md:block text-xs font-medium text-gray-400">Sistema de Gestão Industrial</p>
              </div>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#hero" className="text-white hover:text-gray-300 transition-colors duration-300">Início</a>
            <a href="#features" className="text-white hover:text-gray-300 transition-colors duration-300">Funcionalidades</a>
            <a href="#modules" className="text-white hover:text-gray-300 transition-colors duration-300">Módulos</a>
            <a href="#modulo-qualidade" className="text-white hover:text-gray-300 transition-colors duration-300">Qualidade</a>
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
            <img
              src={logoSrc}
              alt="APEX ERP Logo"
              className="w-24 h-24 md:w-36 md:h-36 mb-6 object-scale-down animate-fade-in drop-shadow-2xl"
            />
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 animate-fade-in tracking-tight">
              Sistema de Gestão Industrial
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">APEX ERP</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mb-8 animate-fade-up leading-relaxed">
              Gerencie estoque, manutenção, requisições, qualidade e toda a operação industrial em uma única plataforma integrada.
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
        <section className="border-y border-white/5 bg-white/5 backdrop-blur-lg py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <Reveal key={i} direction="up" delay={i * 90} className="flex flex-col gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-blue-400">{stat.value}</span>
                  <span className="text-sm text-gray-400">{stat.label}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Módulos do Sistema */}
        <section className="py-14 border-b border-gray-800/40">
          <div className="container mx-auto px-4">
            <Reveal direction="up">
              <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
                Módulos integrados na plataforma
              </p>
            </Reveal>
            <div className="flex flex-wrap justify-center gap-3">
              {modules.map((mod, i) => (
                <Reveal key={i} direction="up" delay={i * 60}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700/60 bg-gray-900/40 text-gray-300 text-sm hover:border-blue-500/50 hover:text-blue-400 transition-colors backdrop-blur-sm">
                    {mod.icon}
                    <span>{mod.label}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Differentials Section */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Reveal direction="up">
                <h2 className="text-3xl font-bold text-white mb-4">Por que escolher o APEX ERP?</h2>
              </Reveal>
              <Reveal direction="up" delay={120}>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                  Uma plataforma completa desenvolvida para otimizar a gestão industrial com tecnologia de ponta.
                </p>
              </Reveal>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {differentials.map((item, index) => (
                <Reveal key={index} direction="up" delay={index * 90} className="h-full">
                <Card className="h-full bg-white/5 border-white/10 shadow-2xl hover:border-blue-500/40 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl rounded-3xl">
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Seções por módulo */}
        <section id="modules" className="pt-24 pb-4">
          <div className="container mx-auto px-4">
            <div className="text-center mb-4">
              <Reveal direction="up">
                <h2 className="text-3xl font-bold text-white mb-4">Módulos do Sistema</h2>
              </Reveal>
              <Reveal direction="up" delay={120}>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                  Cada módulo do APEX ERP com todas as suas funcionalidades, prontas para operar de forma integrada.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {moduleSections.map((mod, index) => (
          <ModuleSectionBlock
            key={mod.id}
            module={mod}
            index={index}
            onAccess={openLoginModal}
          />
        ))}

        {/* Contact Section */}
        <section id="contact" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Reveal direction="up">
                <h2 className="text-3xl font-bold text-white mb-4">Fale Conosco</h2>
              </Reveal>
              <Reveal direction="up" delay={120}>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                  Estamos à disposição para tirar suas dúvidas sobre o sistema APEX ERP.
                </p>
              </Reveal>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Reveal direction="up" delay={100}>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl">
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
              </Reveal>
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
                <img src={logoSrc} alt="APEX ERP" className="w-10 h-10 rounded-lg" />
                <span className="text-white text-lg font-bold">APEX ERP</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema de gestão industrial completo para otimizar sua operação, do almoxarifado ao controle de qualidade.
              </p>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wide">Navegação</h3>
              <ul className="space-y-2">
                <li><a href="#hero" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">Início</a></li>
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
                  <Layers className="w-4 h-4 text-blue-400" />
                  Módulos integrados
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
                <img src={logoSrc} alt="APEX ERP" className="w-12 h-12 rounded-lg" />
              </div>
              <div className="text-center">
                <DialogTitle className="text-2xl font-bold text-white mb-2">
                  {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
                </DialogTitle>
                <p className="text-gray-400 text-sm">
                  {activeTab === "login" 
                    ? "Entre com suas credenciais para acessar o APEX ERP" 
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
