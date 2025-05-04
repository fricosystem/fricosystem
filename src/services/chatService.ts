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
  writeBatch
} from "firebase/firestore";
import { db } from "@/firebase/firebase";

export type User = {
  id: string;
  nome: string;
  email: string;
  online: 'online' | 'offline';
  lastSeen?: Timestamp;
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

// Função melhorada para atualizar status do usuário
export const updateUserOnlineStatus = async (userId: string, status: 'online' | 'offline'): Promise<void> => {
  if (!userId) {
    console.warn("Attempted to update status with empty userId");
    return;
  }

  try {
    const userRef = doc(db, "usuarios", userId);
    const updateData = {
      online: status,
      lastSeen: status === 'offline' ? serverTimestamp() : null
    };

    console.log(`Updating user ${userId} status to ${status}`);
    
    await setDoc(userRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating user status:", error);
    setTimeout(() => {
      updateUserOnlineStatus(userId, status).catch(e => 
        console.error("Retry failed:", e)
      );
    }, 3000);
  }
};

// Função para configurar listeners de status
export const setupUserStatusListeners = (userId: string) => {
  if (typeof window === 'undefined' || !userId) {
    console.warn("Invalid environment or userId for status listeners");
    return () => {};
  }

  let heartbeatInterval: NodeJS.Timeout;
  let lastKnownStatus: 'online' | 'offline' = 'online';
  let lastSuccessfulUpdate = Date.now();
  
  const updateStatus = async (status: 'online' | 'offline') => {
    if (status === lastKnownStatus && Date.now() - lastSuccessfulUpdate < 10000) {
      return;
    }
    
    console.log(`Attempting to set ${userId} status to ${status}`);

    try {
      await updateUserOnlineStatus(userId, status);
      lastKnownStatus = status;
      lastSuccessfulUpdate = Date.now();
      console.log(`Successfully updated ${userId} status to ${status}`);
    } catch (error) {
      console.error(`Failed to update ${userId} status:`, error);
    }
  };

  const startHeartbeat = () => {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => {
      if (document.visibilityState !== 'hidden') {
        try {
          await updateUserOnlineStatus(userId, 'online');
          lastSuccessfulUpdate = Date.now();
        } catch (error) {
          console.error("Heartbeat failed:", error);
        }
      }
    }, 20000);
  };

  const performOfflineUpdate = async () => {
    const offlineData = {
      online: 'offline',
      lastSeen: serverTimestamp()
    };
    
    try {
      const userRef = doc(db, "usuarios", userId);
      await setDoc(userRef, offlineData, { merge: true });
    } catch (error) {
      console.error("Failed offline update:", error);
      if (window.localStorage) {
        window.localStorage.setItem('pendingOfflineStatus', JSON.stringify({
          userId,
          timestamp: Date.now()
        }));
      }
    }
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    performOfflineUpdate();
    const confirmationMessage = "Changes you made may not be saved.";
    event.returnValue = confirmationMessage;
    return confirmationMessage;
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      console.log("Page visibility changed to hidden - setting offline");
      clearInterval(heartbeatInterval);
      updateStatus('offline');
    } else {
      console.log("Page visibility changed to visible - setting online");
      updateStatus('online');
      startHeartbeat();
    }
  };

  const checkPendingOfflineStatus = () => {
    if (window.localStorage) {
      const pendingStatus = window.localStorage.getItem('pendingOfflineStatus');
      if (pendingStatus) {
        try {
          const { userId: pendingUserId, timestamp } = JSON.parse(pendingStatus);
          if (pendingUserId === userId && Date.now() - timestamp < 86400000) {
            updateUserOnlineStatus(userId, 'offline').then(() => {
              window.localStorage.removeItem('pendingOfflineStatus');
            });
          } else {
            window.localStorage.removeItem('pendingOfflineStatus');
          }
        } catch (e) {
          window.localStorage.removeItem('pendingOfflineStatus');
        }
      }
    }
  };

  const handleOnline = () => {
    console.log("Network online - updating status");
    updateStatus('online');
    startHeartbeat();
  };
  
  const handleOffline = () => {
    console.log("Network offline - pausing heartbeat");
    clearInterval(heartbeatInterval);
  };

  checkPendingOfflineStatus();
  
  updateStatus('online');
  startHeartbeat();
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    updateStatus('offline').catch(e => console.error("Cleanup status update failed:", e));
    console.log(`Cleanup complete for user ${userId} status listeners`);
  };
};

export const initializeUserStatus = async (userId: string) => {
  if (!userId) {
    console.warn("Attempted to initialize status with empty userId");
    return () => {};
  }

  try {
    console.log(`Initializing user status for ${userId}`);
    await updateUserOnlineStatus(userId, 'online');
    
    const cleanupListeners = setupUserStatusListeners(userId);
    
    return async () => {
      console.log(`Cleaning up user status for ${userId}`);
      cleanupListeners();
      try {
        await updateUserOnlineStatus(userId, 'offline');
      } catch (error) {
        console.error("Error cleaning up user status:", error);
      }
    };
  } catch (error) {
    console.error("Error initializing user status:", error);
    return () => {};
  }
};

// Restante das funções originais mantidas conforme o primeiro código
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
          online: data.online || 'offline',
          lastSeen: data.lastSeen
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getOrCreateChat = async (user1Id: string, user2Id: string): Promise<string> => {
  try {
    const chatQuery1 = query(
      collection(db, "chat"),
      where("participants", "array-contains", user1Id)
    );
    
    const querySnapshot = await getDocs(chatQuery1);
    let chatId = "";
    
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(user2Id)) {
        chatId = doc.id;
      }
    });
    
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

export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<void> => {
  try {
    await addDoc(collection(db, "chat", chatId, "messages"), {
      sender: senderId,
      text,
      timestamp: serverTimestamp(),
      read: false
    });
    
    await updateDoc(doc(db, "chat", chatId), {
      lastMessage: {
        text,
        timestamp: serverTimestamp()
      }
    });
    
    const chatDoc = await getDoc(doc(db, "chat", chatId));
    const chatData = chatDoc.data();
    
    if (chatData) {
      const recipientId = chatData.participants.find((id: string) => id !== senderId);
      
      if (recipientId) {
        const recipientDoc = await getDoc(doc(db, "usuarios", recipientId));
        const recipientData = recipientDoc.data();
        
        if (recipientData && recipientData.online === "offline") {
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

export const markMessagesAsRead = async (chatId: string, currentUserId: string): Promise<void> => {
  try {
    const messagesQuery = query(
      collection(db, "chat", chatId, "messages"),
      where("read", "==", false)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    const messagesToUpdate = querySnapshot.docs.filter(doc => 
      doc.data().sender !== currentUserId
    );
    
    const batch = writeBatch(db);
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

export const resetUnreadMessagesCount = async (currentUserId: string, contactId: string): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", currentUserId));
    const userData = userDoc.data();
    
    if (userData && userData.unreadMessages && userData.unreadMessages[contactId]) {
      const unreadMessages = { ...userData.unreadMessages };
      unreadMessages[contactId] = 0;
      
      await updateDoc(doc(db, "usuarios", currentUserId), {
        unreadMessages
      });
    }
  } catch (error) {
    console.error("Error resetting unread messages count:", error);
  }
};

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

export const getUnreadMessagesCount = async (currentUserId: string): Promise<Record<string, number>> => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", currentUserId));
    const userData = userDoc.data();
    
    if (userData && userData.unreadMessages) {
      return userData.unreadMessages;
    }
    
    const chatsQuery = query(
      collection(db, "chat"),
      where("participants", "array-contains", currentUserId)
    );
    
    const querySnapshot = await getDocs(chatsQuery);
    const unreadCounts: Record<string, number> = {};
    
    await Promise.all(querySnapshot.docs.map(async (chatDoc) => {
      const chatData = chatDoc.data();
      const otherParticipantId = chatData.participants.find(
        (participantId: string) => participantId !== currentUserId
      );
      
      if (otherParticipantId) {
        const unreadQuery = query(
          collection(db, "chat", chatDoc.id, "messages"),
          where("sender", "==", otherParticipantId),
          where("read", "==", false)
        );
        
        const unreadSnapshot = await getDocs(unreadQuery);
        unreadCounts[otherParticipantId] = unreadSnapshot.size;
      }
    }));
    
    await updateDoc(doc(db, "usuarios", currentUserId), {
      unreadMessages: unreadCounts
    });
    
    return unreadCounts;
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    return {};
  }
};

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
          unreadCounts[otherParticipantId] = unreadSnapshot.size;
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