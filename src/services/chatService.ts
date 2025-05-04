  import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    onSnapshot, 
    orderBy, 
    serverTimestamp, 
    updateDoc, 
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
    writeBatch  // Adicione esta importação
  } from "firebase/firestore";

  import { db } from "@/firebase/firebase";
  
  export type User = {
    id: string;
    nome: string;
    email: string;
    online: string;
    unreadMessages?: Record<string, number>;
  };
  
  export type Message = {
    id: string;
    sender: string;
    text: string;
    timestamp: Timestamp;
    read: boolean;
  };
  
  export type Chat = {
    id: string;
    participants: string[];
    lastMessage?: {
      text: string;
      timestamp: Timestamp;
    };
  };
  
  // Get all users except the current user
  export const getUsers = async (currentUserId: string): Promise<User[]> => {
    try {
      const usersCollection = collection(db, "usuarios");
      const querySnapshot = await getDocs(usersCollection);
      
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentUserId) {
          users.push({
            id: doc.id,
            nome: data.nome,
            email: data.email,
            online: data.online
          });
        }
      });
      
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };
  
  // Get or create chat between two users
  export const getOrCreateChat = async (user1Id: string, user2Id: string): Promise<string> => {
    try {
      // Check if chat already exists
      const chatQuery1 = query(
        collection(db, "chat"),
        where("participants", "array-contains", user1Id)
      );
      
      const querySnapshot = await getDocs(chatQuery1);
      let chatId = "";
      
      // Find chat with both participants
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(user2Id)) {
          chatId = doc.id;
        }
      });
      
      // Create new chat if it doesn't exist
      if (!chatId) {
        const chatRef = await addDoc(collection(db, "chat"), {
          participants: [user1Id, user2Id],
          createdAt: serverTimestamp()
        });
        chatId = chatRef.id;
      }
      
      return chatId;
    } catch (error) {
      console.error("Error getting or creating chat:", error);
      throw error;
    }
  };
  
  // Send a message
  export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<void> => {
    try {
      // Add message to messages subcollection
      await addDoc(collection(db, "chat", chatId, "messages"), {
        sender: senderId,
        text,
        timestamp: serverTimestamp(),
        read: false
      });
      
      // Update last message in chat document
      await updateDoc(doc(db, "chat", chatId), {
        lastMessage: {
          text,
          timestamp: serverTimestamp()
        }
      });
      
      // Get chat participants
      const chatDoc = await getDoc(doc(db, "chat", chatId));
      const chatData = chatDoc.data();
      
      if (chatData) {
        // Find the recipient (the other participant)
        const recipientId = chatData.participants.find((id: string) => id !== senderId);
        
        if (recipientId) {
          // Check if recipient is offline
          const recipientDoc = await getDoc(doc(db, "usuarios", recipientId));
          const recipientData = recipientDoc.data();
          
          if (recipientData && recipientData.online === "offline") {
            // Update unread messages count in the recipient's user document
            const unreadMessages = recipientData.unreadMessages || {};
            
            await updateDoc(doc(db, "usuarios", recipientId), {
              unreadMessages: {
                ...unreadMessages,
                [senderId]: (unreadMessages[senderId] || 0) + 1
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };
  
  // Mark messages as read
  export const markMessagesAsRead = async (chatId: string, currentUserId: string): Promise<void> => {
    try {
      // Primeiro obtenha todas as mensagens não lidas
      const messagesQuery = query(
        collection(db, "chat", chatId, "messages"),
        where("read", "==", false)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      // Filtre localmente as mensagens do remetente que não seja o usuário atual
      const messagesToUpdate = querySnapshot.docs.filter(doc => 
        doc.data().sender !== currentUserId
      );
      
      // Atualize em lote
      const batch = writeBatch(db);  // Agora esta função está disponível
      messagesToUpdate.forEach((doc) => {
        const messageRef = doc.ref;
        batch.update(messageRef, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  };
  
  // Reset unread messages count for a specific contact
  export const resetUnreadMessagesCount = async (currentUserId: string, contactId: string): Promise<void> => {
    try {
      // Get current user document
      const userDoc = await getDoc(doc(db, "usuarios", currentUserId));
      const userData = userDoc.data();
      
      if (userData && userData.unreadMessages && userData.unreadMessages[contactId]) {
        // Create a copy of unread messages object
        const unreadMessages = { ...userData.unreadMessages };
        
        // Reset count for this contact
        unreadMessages[contactId] = 0;
        
        // Update user document
        await updateDoc(doc(db, "usuarios", currentUserId), {
          unreadMessages
        });
      }
    } catch (error) {
      console.error("Error resetting unread messages count:", error);
    }
  };
  
  // Listen for messages in a chat
  export const subscribeToMessages = (
    chatId: string, 
    callback: (messages: Message[]) => void
  ) => {
    const messagesQuery = query(
      collection(db, "chat", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      callback(messages);
    });
  };
  
  // Listen for user online status
  export const subscribeToUserStatus = (
    userId: string,
    callback: (online: string) => void
  ) => {
    const userRef = doc(db, "usuarios", userId);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().online);
      } else {
        callback("offline");
      }
    });
  };
  
  // Subscribe to user document to get unread message counts
  export const subscribeToUserUnreadMessages = (
    userId: string,
    callback: (unreadCounts: Record<string, number>) => void
  ) => {
    const userRef = doc(db, "usuarios", userId);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.unreadMessages) {
          callback(userData.unreadMessages);
        } else {
          callback({});
        }
      } else {
        callback({});
      }
    });
  };
  
  // Get unread messages count for a specific user
  export const getUnreadMessagesCount = async (currentUserId: string): Promise<Record<string, number>> => {
    try {
      // First check if there are stored unread counts in the user document
      const userDoc = await getDoc(doc(db, "usuarios", currentUserId));
      const userData = userDoc.data();
      
      if (userData && userData.unreadMessages) {
        return userData.unreadMessages;
      }
      
      // If no stored counts, calculate from messages
      const chatsQuery = query(
        collection(db, "chat"),
        where("participants", "array-contains", currentUserId)
      );
      
      const querySnapshot = await getDocs(chatsQuery);
      const unreadCounts: Record<string, number> = {};
      
      // For each chat, count unread messages
      await Promise.all(querySnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        
        // Find the other participant in the chat
        const otherParticipantId = chatData.participants.find(
          (participantId: string) => participantId !== currentUserId
        );
        
        if (otherParticipantId) {
          // Query unread messages from other participants
          const unreadQuery = query(
            collection(db, "chat", chatDoc.id, "messages"),
            where("sender", "==", otherParticipantId),
            where("read", "==", false)
          );
          
          const unreadSnapshot = await getDocs(unreadQuery);
          unreadCounts[otherParticipantId] = unreadSnapshot.size;
        }
      }));
      
      // Update the user document with calculated counts
      await updateDoc(doc(db, "usuarios", currentUserId), {
        unreadMessages: unreadCounts
      });
      
      return unreadCounts;
    } catch (error) {
      console.error("Error getting unread messages count:", error);
      return {};
    }
  };
  
  // Subscribe to unread messages count
  export const subscribeToUnreadMessages = (
    currentUserId: string,
    callback: (unreadCounts: Record<string, number>) => void
  ) => {
    const chatsQuery = query(
      collection(db, "chat"),
      where("participants", "array-contains", currentUserId)
    );
  
    return onSnapshot(chatsQuery, (snapshot) => {
      const messageListeners: (() => void)[] = [];
      const unreadCounts: Record<string, number> = {};
  
      snapshot.docs.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
  
        const otherParticipantId = chatData.participants.find(
          (id: string) => id !== currentUserId
        );
  
        if (otherParticipantId) {
          const unreadQuery = query(
            collection(db, "chat", chatId, "messages"),
            where("sender", "==", otherParticipantId),
            where("read", "==", false)
          );
  
          const unsubscribe = onSnapshot(unreadQuery, (unreadSnapshot) => {
            // Atualize apenas a contagem deste participante
            unreadCounts[otherParticipantId] = unreadSnapshot.size;
  
            // Crie uma cópia segura das contagens atuais
            callback({ ...unreadCounts });
          });
  
          messageListeners.push(unsubscribe);
        }
      });
  
      return () => {
        messageListeners.forEach((unsubscribe) => unsubscribe());
      };
    });
  };
  