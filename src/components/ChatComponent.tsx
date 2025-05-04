import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User as ContactUser } from "@/services/chatService";
import ContactsList from "@/components/ContactList";
import ChatWindow from "@/components/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import AppLayout from "@/layouts/AppLayout";

const ChatComponent = () => {
  const { user, userData, loading } = useAuth();
  const [selectedContact, setSelectedContact] = useState<ContactUser | null>(null);
  const [showChat, setShowChat] = useState(false);
  const isMobile = useIsMobile();
  
  const handleSelectContact = (contact: ContactUser) => {
    setSelectedContact(contact);
    if (isMobile) {
      setShowChat(true);
    }
  };
  
  const handleBackToContacts = () => {
    setShowChat(false);
  };

  if (loading) {
    return (
      <AppLayout title="Chat">
        <div className="h-full flex items-center justify-center">Carregando...</div>
      </AppLayout>
    );
  }

  if (!user || !userData) {
    return (
      <AppLayout title="Chat">
        <div className="h-full flex items-center justify-center">Usuário não autenticado</div>
      </AppLayout>
    );
  }

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="h-full">
          {!showChat ? (
            <ContactsList
              onSelectContact={handleSelectContact}
              selectedContact={selectedContact}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-2">
                <button
                  onClick={handleBackToContacts}
                  className="text-sm font-semibold mb-2"
                >
                  ← Voltar para contatos
                </button>
              </div>
              <div className="flex-grow">
                {selectedContact && <ChatWindow selectedContact={selectedContact} />}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="h-full grid grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
        <div className="h-full">
          <ContactsList
            onSelectContact={handleSelectContact}
            selectedContact={selectedContact}
          />
        </div>
        <div className="h-full">
          {selectedContact ? (
            <ChatWindow selectedContact={selectedContact} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Selecione um contato para começar a conversar</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Chat">
      <div className="h-[calc(100vh-64px)]"> {/* Ajuste para altura considerando o header */}
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default ChatComponent;