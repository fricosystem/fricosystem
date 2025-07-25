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
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 rounded-lg shadow-xl text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            {activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-12 p-1 rounded-md">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-gray-700 hover:text-gray-900 transition-colors"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-gray-700 hover:text-gray-900 transition-colors"
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
  );
}