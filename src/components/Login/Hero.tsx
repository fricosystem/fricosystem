import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AuthModal } from "@/components/Login/Auth/AuthModal";

export function Hero() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-frico-950/10 via-black to-black"></div>
      </div>
      
      <div className="container mx-auto relative z-10 px-4 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
          Bem vindo ao <span className="text-frico-500">Nexus Hub</span>
          <br />
          <span className="text-3xl md:text-4xl">Fricó Alimentos</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mb-8 animate-fade-up">
          Transformando a gestão corporativa com soluções integradas para estoque, 
          finanças, recursos humanos e mais. Alcance a excelência operacional com o Nexus Hub.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{animationDelay: "0.2s"}}>
          <Button 
            size="lg" 
            className="bg-frico-600 hover:bg-frico-700 text-white px-8"
            onClick={() => setAuthModalOpen(true)}
          >
            Comece Agora
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="bg-white border-white text-black hover:bg-black hover:text-white"
            asChild
          >
            <a href="#features">Saiba Mais</a>
          </Button>
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab="register"
      />
    </section>
  );
}