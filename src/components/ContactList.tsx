import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUsers, 
  User, 
  subscribeToUserStatus, 
  subscribeToUnreadMessages,
  subscribeToUserUnreadMessages
} from "@/services/chatService";
import { Sun, Moon, LogOut, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ScrollArea } from "./ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactsListProps {
  onSelectContact: (contact: User) => void;
  selectedContact: User | null;
}

const ContactsList = ({ onSelectContact, selectedContact }: ContactsListProps) => {
  const [contacts, setContacts] = useState<User[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return;
      
      const users = await getUsers(user.uid);
      setContacts(users);
      setFilteredContacts(users);
      
      const unsubscribeStatuses = users.map((user) => {
        return subscribeToUserStatus(user.id, (status) => {
          setOnlineStatuses(prev => ({
            ...prev,
            [user.id]: status
          }));
        });
      });
      
      const unsubscribeUnread = subscribeToUnreadMessages(
        user.uid,
        (counts) => {
          setUnreadCounts(counts);
        }
      );
      
      const unsubscribeUserUnread = subscribeToUserUnreadMessages(
        user.uid,
        (counts) => {
          setUnreadCounts(prev => ({
            ...prev,
            ...counts
          }));
        }
      );
      
      return () => {
        unsubscribeStatuses.forEach(unsubscribe => unsubscribe());
        unsubscribeUnread();
        unsubscribeUserUnread();
      };
    };
    
    loadContacts();
  }, [user]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredContacts(contacts);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(
      (contact) =>
        (contact.nome?.toLowerCase().includes(query)) ||
        (contact.email?.toLowerCase().includes(query))
    );
    
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);
  
  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return "??";
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header da lista de contatos */}
      <div className="p-4 border-b bg-background">
        <h2 className="text-lg font-semibold mb-3">Mensagens</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar contatos..."
            className="pl-9 border-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lista de contatos com scroll */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {filteredContacts.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className={`w-full justify-start p-3 h-auto ${
                    selectedContact?.id === contact.id 
                      ? "bg-primary/10 text-primary border-l-2 border-primary" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex items-center w-full gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(contact.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                          onlineStatuses[contact.id] === "online"
                            ? "bg-green-500"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{contact.nome || 'Usuário sem nome'}</p>
                        {unreadCounts[contact.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-2 rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {unreadCounts[contact.id] > 99 ? "99+" : unreadCounts[contact.id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {contact.email || 'Email não disponível'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {onlineStatuses[contact.id] === "online" 
                            ? "Online agora"
                            : `Offline ${contact.ultimo_login ? '• último acesso ' + formatDistanceToNow(contact.ultimo_login.toDate(), { locale: ptBR }) + ' atrás' : ''}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default ContactsList;