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
        <div className="h-full flex flex-col">
          {!showChat ? (
            <ContactsList
              onSelectContact={handleSelectContact}
              selectedContact={selectedContact}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-background">
                <button
                  onClick={handleBackToContacts}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  ← Voltar para contatos
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {selectedContact && <ChatWindow selectedContact={selectedContact} />}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="h-full flex">
        <div className="w-80 border-r bg-background">
          <ContactsList
            onSelectContact={handleSelectContact}
            selectedContact={selectedContact}
          />
        </div>
        <div className="flex-1 min-w-0">
          {selectedContact ? (
            <ChatWindow selectedContact={selectedContact} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground font-medium">Selecione um contato</p>
                <p className="text-sm text-muted-foreground">Escolha uma conversa para começar a enviar mensagens</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Chat">
      <div className="h-full -m-6 bg-background"> {/* Remove padding e usa toda altura */}
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default ChatComponent;