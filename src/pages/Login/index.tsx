import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { UserButton } from "./components/UserButton";
import { 
  BarChart4, Calendar, Clipboard, CreditCard, Database, FileText, Users,
  Phone, Mail, MessageSquare 
} from "lucide-react";

// Dados das seções
const features = [
  {
    title: "Gestão de Estoque",
    description: "Controle total sobre o inventário com rastreamento em tempo real, previsão inteligente de demanda e alertas automatizados de reposição.",
    icon: <Database className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Gestão Financeira",
    description: "Acompanhamento detalhado de receitas e despesas, relatórios personalizados e integrado com processos contábeis.",
    icon: <CreditCard className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Recursos Humanos",
    description: "Administração completa de colaboradores, folha de pagamento, recrutamento, treinamentos e avaliações de desempenho.",
    icon: <Users className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Planejamento Estratégico",
    description: "Tenha controle total sobre sua operação: alinhe o planejamento estratégico com indicadores de estoque e garanta uma gestão eficiente.",
    icon: <BarChart4 className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Gestão de Documentos",
    description: "Organize, armazene e compartilhe documentos com segurança, mantendo todo o controle organizacional.",
    icon: <FileText className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Calendário Corporativo",
    description: "Sincronização de eventos, reuniões e deadlines para toda a equipe com notificações inteligentes.",
    icon: <Calendar className="h-10 w-10 text-frico-500" />
  }
];

const solutions = [
  {
    title: "Otimize seu Controle de Estoque",
    description: "Reduza custos operacionais e evite perdas com um sistema preciso que mantém seus níveis de estoque sempre ideais, através de previsões baseadas em dados históricos e sazonalidade.",
    imageSrc: "/images/inventory.jpg",
    reverse: false,
    quote: "A excelência no controle de estoque é o primeiro passo para uma operação eficiente."
  },
  {
    title: "Gerencie suas Finanças com Precisão",
    description: "Tenha visibilidade completa sobre a saúde financeira da sua empresa, com dashboards personalizados que destacam oportunidades de crescimento e pontos de atenção em tempo real.",
    imageSrc: "/images/dashboard.jpg",
    reverse: true,
    quote: "Informações financeiras precisas são a base para decisões estratégicas acertadas."
  },
  {
    title: "Potencialize sua Gestão de Pessoas",
    description: "Centralize todo o ciclo de vida do colaborador, desde o recrutamento até avaliações de desempenho, promovendo uma cultura organizacional forte e alinhada com seus objetivos.",
    imageSrc: "/images/recursos-humanos.jpg",
    reverse: false,
    quote: "Pessoas motivadas e bem gerenciadas são o maior ativo de qualquer organização."
  }
];

const testimonials = [
  {
    name: "Carlos Silva",
    position: "Diretor de Operações",
    company: "Distribuidora Nacional",
    content: "O sistema Nexus Hub transformou completamente nossa gestão de estoque. Reduzimos perdas em 35% e aumentamos a eficiência logística em tempo recorde.",
    initials: "CS"
  },
  {
    name: "Ana Ferreira",
    position: "CFO",
    company: "Grupo Alimentício Brasil",
    content: "A visibilidade que temos agora sobre nossos indicadores financeiros é incomparável. As decisões estratégicas organizacionais se tornaram muito mais assertivas e ágeis.",
    initials: "AF"
  },
  {
    name: "Roberto Gomes",
    position: "Gerente de RH",
    company: "Indústria Alimentar SA",
    content: "O módulo de recursos humanos simplificou processos que antes eram extremamente burocráticos. Nossa equipe está mais produtiva e satisfeita.",
    initials: "RG"
  }
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
    <div className="min-h-screen w-screen max-w-full overflow-x-hidden bg-gradient-to-b from-black via-[#0a1118] to-[#060d14] text-white flex flex-col">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md py-2 md:py-3 h-20 bg-black/20 w-screen max-w-full">
        <div className="w-full px-2 md:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 pl-1">
            <a href="#hero" className="flex items-center gap-2">
              <img 
                src="https://res.cloudinary.com/diomtgcvb/image/upload/q_100,f_png/v1758851478/IconeFrico3D_oasnj7.png" 
                alt="Fricó Alimentos Logo" 
                className="w-16 h-16 rounded-lg object-scale-down" 
              />
              <div>
                <span className="text-2xl font-bold text-white">APEX HUB</span>
                <h1 className="text-sm font-extrabold text-frico-500">ERP</h1>
              </div>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#hero" className="text-white hover:text-gray-300 transition-colors duration-300">Início</a>
            <a href="#features" className="text-white hover:text-gray-300 transition-colors duration-300">Funcionalidades</a>
            <a href="#solutions" className="text-white hover:text-gray-300 transition-colors duration-300">Soluções</a>
            <a href="#testimonials" className="text-white hover:text-gray-300 transition-colors duration-300">Depoimentos</a>
            <a href="#contact" className="text-white hover:text-gray-300 transition-colors duration-300">Contato</a>
          </nav>
          
          <div className="flex items-center space-x-2">
            {user ? (
              <UserButton user={user} />
            ) : (
              <>
                <Button variant="outline" onClick={openLoginModal} className="bg-white border-white text-black hover:bg-black hover:text-white mx-[18px]">
                  Entrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openRegisterModal}>
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
              Bem vindo ao <span>Gerenciador industrial</span>
              <br />
              <span className="text-3xl md:text-4xl text-frico-500">APEX HUB</span>
            </h1>
            
            <p className="text-xl text-gray-500 max-w-2xl mb-8 animate-fade-up">
              O APEX HUB transforma a gestão corporativa com soluções integradas para estoque, finanças, recursos humanos e muito mais. Fazemos com que a empresa alcançe a excelência operacional.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="outline" size="lg" className="bg-white border-white text-black hover:bg-black hover:text-white" asChild>
                <a href="#features">Saiba Mais</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 text-xl">
          <div className="container mx-auto px-4 text-xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Funcionalidades Integradas</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-xl">
                Nossa plataforma centraliza todas as operações essenciais da empresa em um único lugar, 
                proporcionando facilidade, eficiência e acertividade em cada processo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 shadow-lg hover:shadow-frico-900/10 transition-shadow backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-center mb-4">{feature.icon}</div>
                    <CardTitle className="text-center text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-400 text-center">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Nossas Soluções</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-xl">
                O APEX HUB foi desenvolvido para atender as necessidades específicas da empresa, 
                trazendo soluções integradas para levar a eficiência operacional a um novo patamar.
              </p>
            </div>
            
            <div className="space-y-24">
              {solutions.map((solution, index) => (
                <div key={index} className={`flex flex-col ${solution.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}>
                  <div className="lg:w-1/2">
                    <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-xl group">
                      <div className="absolute inset-0 rounded-xl p-0.5 bg-transparent group-hover:bg-[conic-gradient(from_var(--shimmer-angle),#00ff87_0%,#7e3af2_20%,#ffffff_40%,#0084ff_60%,#00ff87_80%,#7e3af2_100%)] bg-[length:400%_400%] animate-[shimmer_3s_linear_infinite]">
                        <div className="relative h-full w-full rounded-xl bg-gray-900 overflow-hidden">
                          <img src={solution.imageSrc} alt={solution.title} className="w-full h-full object-cover transition-all duration-500 ease-in-out transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-frico-800/20 transition-all duration-300 group-hover:bg-frico-800/10"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:w-1/2">
                    <h3 className="text-2xl font-bold text-white mb-4">{solution.title}</h3>
                    <p className="text-gray-400 mb-6">{solution.description}</p>
                    <blockquote className="border-l-4 border-frico-600 pl-4 italic mb-6 text-gray-300">"{solution.quote}"</blockquote>
                    <Button className="bg-frico-600 hover:bg-frico-700">Saiba Mais</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">O que nossos clientes dizem</h2>
              <p className="text-gray-200 max-w-2xl mx-auto text-xl">
                Empresas de todos os portes já experimentaram o poder de transformação 
                do Nexus Hub em suas operações diárias.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 shadow-lg backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center mb-4">
                      <Avatar className="h-16 w-16 mb-4">
                        <AvatarFallback className="bg-frico-700 text-white text-xl">{testimonial.initials}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{testimonial.name}</p>
                        <p className="text-frico-500">{testimonial.position}</p>
                        <p className="text-gray-500 text-sm">{testimonial.company}</p>
                      </div>
                    </div>
                    <p className="text-cyan-400 italic text-center">"{testimonial.content}"</p>
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
              <p className="text-gray-400 max-w-2xl mx-auto text-xl">
                Estamos à disposição para tirar suas dúvidas e apresentar as melhores soluções para sua empresa.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-white mb-2">Nome</label>
                    <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="bg-gray-900/50 border-gray-800 text-white backdrop-blur-sm" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-white mb-2">Email</label>
                    <Input id="email" type="email" placeholder="Digite seu melhor email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-gray-900/50 border-gray-800 text-white backdrop-blur-sm" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-white mb-2">Mensagem</label>
                    <Textarea id="message" placeholder="Como podemos ajudar?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required className="bg-gray-900/50 border-gray-800 text-white backdrop-blur-sm" />
                  </div>
                  <Button type="submit" className="w-full bg-frico-600 hover:bg-frico-700" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </div>
              
              <div className="space-y-8">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-4">Informações de Contato</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-frico-500 mt-1 mr-3" />
                      <div>
                        <p className="text-white font-medium">Telefone</p>
                        <p className="text-gray-400">+55 (62) 3510-0100</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-frico-500 mt-1 mr-3" />
                      <div>
                        <p className="text-white font-medium">WhatsApp</p>
                        <a href="https://wa.me/556235100100?text=%20" target="_blank" rel="noopener noreferrer" className="text-frico-500 hover:underline">Enviar mensagem</a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-frico-500 mt-1 mr-3" />
                      <div>
                        <p className="text-white font-medium">Email</p>
                        <a href="mailto:contato@frico.ind.br" className="text-frico-500 hover:underline">contato@frico.ind.br</a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl h-64 overflow-hidden backdrop-blur-sm">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15263.353856551582!2d-49.47381462032724!3d-16.6535792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935e673e31c193bb%3A0x52922e18e6cd4b00!2sFric%C3%B3%20Alimentos!5e0!3m2!1spt-BR!2sbr!4v1713888339927!5m2!1spt-BR!2sbr&map_style=night" 
                    width="100%" height="100%" style={{border: 0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localização da Fricó Alimentos" className="rounded-lg"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">APEX HUB</h3>
              <p className="text-gray-400 mb-4">
                Soluções corporativas integradas para maximizar a eficiência operacional da sua empresa no setor alimentício.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-frico-500 transition-colors">Funcionalidades</a></li>
                <li><a href="#solutions" className="text-gray-400 hover:text-frico-500 transition-colors">Soluções</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-frico-500 transition-colors">Depoimentos</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-frico-500 transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Contato</h3>
              <ul className="space-y-2">
                <li className="text-gray-400"><span className="font-medium text-gray-300">Telefone:</span> +55 (62) 3510-0100</li>
                <li><a href="https://wa.me/556235100100?text=%20" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-frico-500 transition-colors"><span className="font-medium text-gray-300">WhatsApp:</span> Enviar mensagem</a></li>
                <li className="text-gray-400"><span className="font-medium text-gray-300">Email:</span> contato@fricoalimentos.com.br</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Desenvolvido por</h3>
              <p className="text-gray-400 mb-2">Bruno Moreira de Assis</p>
              <a href="https://wa.me/5562993046419?text=%20%20" target="_blank" rel="noopener noreferrer" className="text-frico-500 hover:underline">Contato do Desenvolvedor</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} APEX HUB. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C]/90 backdrop-blur-xl border border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-white">
              {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary/10 rounded-lg p-1">
              <TabsTrigger value="login" className="text-white bg-transparent hover:bg-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-white bg-transparent hover:bg-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <RegisterForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;