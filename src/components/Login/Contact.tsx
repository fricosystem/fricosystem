import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
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
    <section id="contact" className="py-24 bg-black">
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
                <Input 
                  id="name"
                  placeholder="Seu nome" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-white mb-2">Email</label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="Digite seu melhor email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-white mb-2">Mensagem</label>
                <Textarea 
                  id="message"
                  placeholder="Como podemos ajudar?"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-frico-600 hover:bg-frico-700"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
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
                    <a 
                      href="https://wa.me/556235100100?text=%20"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-frico-500 hover:underline"
                    >
                      Enviar mensagem
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-frico-500 mt-1 mr-3" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <a 
                      href="mailto:contato@frico.ind.br"
                      className="text-frico-500 hover:underline"
                    >
                      contato@frico.ind.br
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl h-64 overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15263.353856551582!2d-49.47381462032724!3d-16.6535792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935e673e31c193bb%3A0x52922e18e6cd4b00!2sFric%C3%B3%20Alimentos!5e0!3m2!1spt-BR!2sbr!4v1713888339927!5m2!1spt-BR!2sbr&map_style=night" 
              width="100%" 
              height="100%" 
              style={{border: 0}} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da Fricó Alimentos"
              className="rounded-lg"
            ></iframe>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
