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
    <div className="h-full flex flex-col bg-background">
      {/* Header da conversa */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(selectedContact.nome)}
              </AvatarFallback>
            </Avatar>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
              contactStatus === "online" ? "bg-green-500" : "bg-muted-foreground"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground">{selectedContact.nome}</h2>
            <p className="text-xs text-muted-foreground">
              {contactStatus === "online" ? "Online agora" : "Offline"}
            </p>
          </div>
        </div>
      </div>
  
      {/* Área de mensagens */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4 pb-4">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isSentByMe = user && message.sender === user.uid;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[75%] ${isSentByMe ? "flex-row-reverse" : "flex-row"}`}>
                      {!isSentByMe && (
                        <Avatar className="h-6 w-6 mb-1">
                          <AvatarFallback className="text-xs bg-muted">
                            {getInitials(selectedContact.nome)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isSentByMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        } shadow-sm`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className={`flex items-center gap-1 mt-2 text-xs ${
                          isSentByMe ? "justify-end text-primary-foreground/70" : "justify-start text-muted-foreground"
                        }`}>
                          <span>
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
                  </div>
                );
              })
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
                  <p className="text-muted-foreground font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-muted-foreground">Envie a primeira mensagem para iniciar a conversa</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
  
      {/* Input de mensagem */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Escreva uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-muted/50 border-muted focus:bg-background"
            autoComplete="off"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim()}
            className="h-10 w-10"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
