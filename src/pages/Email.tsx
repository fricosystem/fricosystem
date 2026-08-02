import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Send, Mail, Inbox, ArrowUp, Eye, Clock } from "lucide-react";
interface EmailData {
  id: string;
  remetente: string;
  remetenteNome: string;
  destinatario: string;
  assunto: string;
  mensagem: string;
  status: string;
  criadoEm: any;
  lido: boolean;
}
const Email = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailsSent, setEmailsSent] = useState<EmailData[]>([]);
  const [emailsReceived, setEmailsReceived] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [activeTab, setActiveTab] = useState("received");
  const [rightPanelMode, setRightPanelMode] = useState<"compose" | "view" | null>(null);
  const [formData, setFormData] = useState({
    destinatario: "",
    assunto: "",
    mensagem: ""
  });
  useEffect(() => {
    if (!user?.email) return;

    // Buscar emails enviados - removendo orderBy para evitar problema de índice
    const sentQuery = query(collection(db, "emails"), where("remetente", "==", user.email));

    // Buscar emails recebidos - removendo orderBy para evitar problema de índice
    const receivedQuery = query(collection(db, "emails"), where("destinatario", "==", user.email));
    const unsubscribeSent = onSnapshot(sentQuery, snapshot => {
      const emails = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailData[];
      // Ordenar localmente por criadoEm
      const sortedEmails = emails.sort((a, b) => {
        if (!a.criadoEm || !b.criadoEm) return 0;
        const dateA = a.criadoEm.toDate ? a.criadoEm.toDate() : new Date(a.criadoEm);
        const dateB = b.criadoEm.toDate ? b.criadoEm.toDate() : new Date(b.criadoEm);
        return dateB.getTime() - dateA.getTime();
      });
      setEmailsSent(sortedEmails);
    });
    const unsubscribeReceived = onSnapshot(receivedQuery, snapshot => {
      const emails = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailData[];
      // Ordenar localmente por criadoEm
      const sortedEmails = emails.sort((a, b) => {
        if (!a.criadoEm || !b.criadoEm) return 0;
        const dateA = a.criadoEm.toDate ? a.criadoEm.toDate() : new Date(a.criadoEm);
        const dateB = b.criadoEm.toDate ? b.criadoEm.toDate() : new Date(b.criadoEm);
        return dateB.getTime() - dateA.getTime();
      });
      setEmailsReceived(sortedEmails);
    });
    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destinatario || !formData.assunto || !formData.mensagem) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos antes de enviar o email.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "emails"), {
        remetente: user?.email || "unknown",
        remetenteNome: user?.displayName || user?.email || "Usuário",
        destinatario: formData.destinatario,
        assunto: formData.assunto,
        mensagem: formData.mensagem,
        status: "enviado",
        criadoEm: serverTimestamp(),
        lido: false
      });
      toast({
        title: "Email enviado com sucesso!",
        description: "Seu email foi salvo e enviado para o destinatário."
      });
      setFormData({
        destinatario: "",
        assunto: "",
        mensagem: ""
      });
      setRightPanelMode(null);
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Ocorreu um erro ao tentar enviar o email. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const EmailListItem = ({
    email,
    onClick
  }: {
    email: EmailData;
    onClick: () => void;
  }) => <div className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-medium text-sm truncate">
            {activeTab === "received" ? email.remetenteNome : email.destinatario}
          </span>
          {!email.lido && activeTab === "received" && <Badge variant="secondary" className="text-xs shrink-0">Novo</Badge>}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(email.criadoEm)}
        </span>
      </div>
      <h4 className="font-medium text-sm mb-1 truncate">{email.assunto}</h4>
      <p className="text-xs text-muted-foreground truncate">{email.mensagem}</p>
    </div>;
  const EmailViewer = ({
    email
  }: {
    email: EmailData;
  }) => <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          Visualizando Email
        </div>
        <CardTitle className="text-lg">{email.assunto}</CardTitle>
        <CardDescription>
          <div className="space-y-1">
            <p><strong>De:</strong> {email.remetenteNome} ({email.remetente})</p>
            <p><strong>Para:</strong> {email.destinatario}</p>
            <p><strong>Data:</strong> {formatDate(email.criadoEm)}</p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{email.mensagem}</p>
        </div>
      </CardContent>
    </Card>;
  return <AppLayout title="Email">
      <div className="h-full flex flex-col -m-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-background">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Email</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus emails enviados e recebidos</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Lista de emails - lado esquerdo */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r flex flex-col max-h-96 lg:max-h-none">
            {/* Header com botão Novo Email e tabs */}
            <div className="p-4 border-b bg-background/50">
              <Button onClick={() => {
              setRightPanelMode("compose");
              setSelectedEmail(null);
            }} className="w-full mb-4">
                <Send className="h-4 w-4 mr-2" />
                Novo Email
              </Button>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="received" className="flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Recebidos ({emailsReceived.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    Enviados ({emailsSent.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Lista de emails */}
            <ScrollArea className="flex-1">
              {activeTab === "received" && <>
                  {emailsReceived.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      Nenhum email recebido
                    </div> : emailsReceived.map(email => <EmailListItem key={email.id} email={email} onClick={() => {
                setSelectedEmail(email);
                setRightPanelMode("view");
              }} />)}
                </>}
              
              {activeTab === "sent" && <>
                  {emailsSent.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      Nenhum email enviado
                    </div> : emailsSent.map(email => <EmailListItem key={email.id} email={email} onClick={() => {
                setSelectedEmail(email);
                setRightPanelMode("view");
              }} />)}
                </>}
            </ScrollArea>
          </div>

          {/* Painel direito - visualização ou composição */}
          <div className="flex-1 p-4 lg:p-6 bg-background/30">
            {rightPanelMode === "compose" && <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Novo Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <form onSubmit={handleSubmit} className="h-full flex flex-col space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="destinatario">Destinatário *</Label>
                      <Input id="destinatario" name="destinatario" type="email" placeholder="exemplo@email.com (use ; para separar múltiplos emails)" value={formData.destinatario} onChange={handleInputChange} required />
                      <p className="text-xs text-muted-foreground">
                        Para selecionar usuários cadastrados e anexar arquivos, conecte ao Supabase
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assunto">Assunto *</Label>
                      <Input id="assunto" name="assunto" type="text" placeholder="Digite o assunto do email" value={formData.assunto} onChange={handleInputChange} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="anexos">Anexos</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center text-muted-foreground">
                        <p className="text-sm">Upload de arquivos disponível após conectar ao Supabase</p>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label htmlFor="mensagem">Mensagem *</Label>
                      <Textarea id="mensagem" name="mensagem" placeholder="Digite sua mensagem aqui..." value={formData.mensagem} onChange={handleInputChange} required className="resize-none flex-1" />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                            Enviando...
                          </> : <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Email
                          </>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>}

            {rightPanelMode === "view" && selectedEmail && <EmailViewer email={selectedEmail} />}

            {!rightPanelMode && <Card className="h-full flex items-center justify-center">
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    <Mail className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Selecione um email para visualizar</p>
                    <p className="text-sm">ou clique em "Novo Email" para compor uma mensagem</p>
                  </div>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>
    </AppLayout>;
};
export default Email;