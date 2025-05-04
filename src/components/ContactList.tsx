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
        contact.nome.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
    );
    
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Card className="h-[calc(100vh-50px)] border-r flex flex-col"> {/* Altura total com pequeno espaçamento */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contatos</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 rounded-full"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar contatos"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <CardContent className="p-0 flex-1"> {/* Flex-1 para ocupar o espaço restante */}
        <ScrollArea className="h-full">
          {filteredContacts.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className={`w-full justify-start ${
                    selectedContact?.id === contact.id ? "bg-accent" : ""
                  }`}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex items-center w-full">
                    <div className="relative">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{getInitials(contact.nome)}</AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-1 h-2 w-2 rounded-full ${
                          onlineStatuses[contact.id] === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col text-left flex-grow">
                      <span className="text-sm font-medium">{contact.nome}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </span>
                    </div>
                    {unreadCounts[contact.id] > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto rounded-full h-5 w-5 flex items-center justify-center p-0"
                      >
                        {unreadCounts[contact.id]}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum contato encontrado
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContactsList;