import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "./UserButton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/Login/Auth/LoginForm";
import { RegisterForm } from "@/components/Login/Auth/RegisterForm";

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [user] = useAuthState(auth);
  
  // Efeito para scroll suave
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.matches('nav a[href^="#"]')) {
        e.preventDefault();
        const id = target.getAttribute('href');
        if (id) {
          const element = document.querySelector(id);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else if (id === '#hero') {
            // Scroll para o topo se for o Hero
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md py-2 md:py-3 h-20 bg-black/[0.02] rounded-none w-screen max-w-full">{/* Removido 'hidden' */}
      <div className="w-full px-2 md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 pl-1">
          <a href="#hero" className="flex items-center gap-2">
            <img 
              src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" 
              className="w-16 h-16 rounded-lg object-scale-down" 
            />
            <div>
              <span className="text-2xl font-bold text-white">FR Stock Manager</span>
              <h1 className="text-sm font-extrabold text-frico-500">Fricó Alimentos</h1>
            </div>
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#hero" className="text-white hover:text-gray-300 transition-colors duration-300">
            Início
          </a>
          <a href="#features" className="text-white hover:text-gray-300 transition-colors duration-300">
            Funcionalidades
          </a>
          <a href="#solutions" className="text-white hover:text-gray-300 transition-colors duration-300">
            Soluções
          </a>
          <a href="#testimonials" className="text-white hover:text-gray-300 transition-colors duration-300">
            Depoimentos
          </a>
          <a href="#contact" className="text-white hover:text-gray-300 transition-colors duration-300">
            Contato
          </a>
        </nav>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <UserButton user={user} />
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={openLoginModal} 
                className="bg-white border-white text-black hover:bg-black hover:text-white mx-[18px]"
              >
                Entrar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={openRegisterModal}
              >
                Cadastre-se
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Autenticação */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C]/[0.02] backdrop-blur-xl border border-red/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-white">
              {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(val) => setActiveTab(val as "login" | "register")} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-primary/10 rounded-lg p-1">
              <TabsTrigger 
                value="login" 
                className="text-white bg-transparent hover:bg-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-white bg-transparent hover:bg-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200"
              >
                Cadastro
              </TabsTrigger>
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
    </header>
  );
}