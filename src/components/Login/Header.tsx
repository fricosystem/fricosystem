import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/Login/Auth/AuthModal";
import { UserButton } from "./UserButton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("login");
  const [user] = useAuthState(auth);
  
  const openLoginModal = () => {
    setModalTab("login");
    setAuthModalOpen(true);
  };
  
  const openRegisterModal = () => {
    setModalTab("register");
    setAuthModalOpen(true);
  };
  
  return <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md py-2 md:py-3 h-20 bg-black/[0.40] rounded-none w-screen max-w-full">
      <div className="w-full px-2 md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 pl-1">
          <img src="/Uploads/IconeFrico3D.png" alt="Fricó Alimentos Logo" className="w-16 h-16 rounded-lg object-scale-down" />
          <div>
          <span className="text-2xl font-bold text-white">Nexus Hub</span>
          <h1 className="text-sm font-extrabold text-frico-500">Fricó Alimentos</h1>
            
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-white hover:text-gray-300 transition-colors">Funcionalidades</a>
          <a href="#solutions" className="text-white hover:text-gray-300 transition-colors">Soluções</a>
          <a href="#testimonials" className="text-white hover:text-gray-300 transition-colors">Depoimentos</a>
          <a href="#contact" className="text-white hover:text-gray-300 transition-colors">Contato</a>
        </nav>
        
        <div className="flex items-center space-x-2">
          {user ? <UserButton user={user} /> : <>
              <Button variant="outline" onClick={openLoginModal} className="bg-white border-white text-black hover:bg-black hover:text-white mx-[18px]">Entrar</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openRegisterModal}>
                Cadastre-se
              </Button>
            </>}
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={modalTab} />
    </header>;
}