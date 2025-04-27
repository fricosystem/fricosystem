import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/Login/Auth/LoginForm";
import { RegisterForm } from "@/components/Login/Auth/RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C]/80 backdrop-blur-xl border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-white">
            {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/30">
            <TabsTrigger value="login" className="text-black">Login</TabsTrigger>
            <TabsTrigger value="register" className="text-white">Cadastro</TabsTrigger>
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
  );
}
