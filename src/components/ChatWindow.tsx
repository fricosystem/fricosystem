import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Message, 
  User, 
  getOrCreateChat, 
  sendMessage, 
  markMessagesAsRead, 
  subscribeToMessages, 
  subscribeToUserStatus,
  resetUnreadMessagesCount
} from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Check, CheckCheck } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface ChatWindowProps {
  selectedContact: User | null;
}

const ChatWindow = ({ selectedContact }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [contactStatus, setContactStatus] = useState<string>("offline");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || !selectedContact) return;
      
      try {
        // Get or create chat between current user and selected contact
        const id = await getOrCreateChat(user.uid, selectedContact.id);
        setChatId(id);
        
        // Subscribe to the contact's online status
        const unsubscribeStatus = subscribeToUserStatus(
          selectedContact.id,
          (status) => setContactStatus(status)
        );
        
        // Reset unread messages count for this contact
        await resetUnreadMessagesCount(user.uid, selectedContact.id);
        
        return () => {
          unsubscribeStatus();
        };
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };
    
    initializeChat();
  }, [user, selectedContact]);
  
  useEffect(() => {
    if (!chatId || !user || !selectedContact) return;
    
    // Subscribe to messages
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      
      // Mark messages from the other user as read
      markMessagesAsRead(chatId, user.uid);
      
      // Reset unread count for this contact
      resetUnreadMessagesCount(user.uid, selectedContact.id);
    });
    
    return () => {
      unsubscribe();
    };
  }, [chatId, user, selectedContact]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !chatId) return;
    
    try {
      await sendMessage(chatId, user.uid, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate();
    return new Date(date).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!selectedContact) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione um contato para iniciar uma conversa</p>
      </div>
    );
  }
  
  return (
    <Card className="h-[calc(100vh-150px)] border-r flex flex-col">
      {/* Cabeçalho fixo */}
      <CardHeader className="border-b p-4 flex-none">
        <div className="flex items-center">
          <div className="relative">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback>{getInitials(selectedContact.nome)}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${
              contactStatus === "online" ? "bg-green-500" : "bg-gray-400"
            }`} />
          </div>
          <div>
            <h2 className="font-semibold">{selectedContact.nome}</h2>
            <p className="text-xs text-muted-foreground px-[5px]">
              {contactStatus === "online" ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </CardHeader>
  
      {/* Área de mensagens com scroll */}
      <CardContent className="p-4 overflow-y-auto flex-1 min-h-0">
        <div className="space-y-4 h-full">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isSentByMe = user && message.sender === user.uid;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isSentByMe
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                        : "bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm"
                    } px-4 py-2 relative`}
                  >
                    <p>{message.text}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${isSentByMe ? "justify-end" : "justify-start"}`}>
                      <span className="opacity-70">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {isSentByMe && (
                        <span className="ml-1">
                          {message.read ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhuma mensagem ainda. Inicie uma conversa!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
  
      {/* Rodapé fixo */}
      <CardFooter className="p-4 flex-none border-t">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ChatWindow;
