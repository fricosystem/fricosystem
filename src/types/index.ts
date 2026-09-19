export interface Usuario {
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
    online?: boolean;
    ultimo_login?: Date;
  }
  
  export interface Mensagem {
    id: string;
    senderId: string;
    receiverId: string;
    text?: string;
    attachment?: {
      url: string;
      type: string;
      name: string;
    };
    createdAt: Date;
    read: boolean;
  }
  
  export interface Email {
    id: string;
    from: {
      id: string;
      name: string;
      email: string;
    };
    to: {
      id: string;
      name: string;
      email: string;
    }[];
    subject: string;
    body: string;
    attachments?: {
      url: string;
      type: string;
      name: string;
    }[];
    createdAt: Date;
    read: boolean;
  }
  