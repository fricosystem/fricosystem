import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';

interface UserData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cnpj: string;
  cargo: string;
  tema: string;
  data_registro: Timestamp;
  ultimo_login: Timestamp;
  imagem_perfil: string;
  ativo: string;
  centro_de_custo: string;
  online: string;
  unidade: string;
  fornecedorCnpj: string;
  permissoes: string[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{user: User, isActive: boolean}>;
  signUp: (email: string, password: string, displayName: string, cpf: string, cargo: string, imagemPerfil?: string, centroDeCusto?: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => { throw new Error('Function not implemented'); },
  signUp: async () => { throw new Error('Function not implemented'); },
  logout: async () => { throw new Error('Function not implemented'); }
});

interface AuthProviderProps {
  children: ReactNode;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth();
  const db = getFirestore();
  
  // Refs para gerenciar os listeners e intervals
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const statusListenersSetup = useRef<boolean>(false);

  const updateOnlineStatus = async (status: 'online' | 'offline', updateLastLogin: boolean = false) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const updateData: any = { online: status };
      
      if (updateLastLogin || status === 'offline') {
        updateData.ultimo_login = serverTimestamp();
      }
      
      await updateDoc(userDocRef, updateData);
    } catch (error) {
      console.error("❌ AuthContext: Erro ao atualizar status online:", error);
      
      // Backup no localStorage se falhar
      if (typeof window !== 'undefined') {
        const backupData = {
          userId: user.uid,
          status,
          timestamp: Date.now(),
          updateLastLogin
        };
        localStorage.setItem('pendingStatusUpdate', JSON.stringify(backupData));
      }
    }
  };

  // Função para tentar enviar com Navigator.sendBeacon (mais confiável)
  const sendOfflineStatus = (userId: string) => {
    const data = JSON.stringify({
      userId,
      status: 'offline',
      timestamp: Date.now()
    });
    
    try {
      // Tenta usar sendBeacon primeiro (mais confiável para beforeunload)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/offline-status', blob);
      }
    } catch (error) {
      console.warn('sendBeacon failed, usando backup');
    }
    
    // Backup: tenta update normal do Firestore
    updateOnlineStatus('offline', true).catch(() => {
      // Se falhar, salva no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingStatusUpdate', JSON.stringify({
          userId,
          status: 'offline',
          timestamp: Date.now(),
          updateLastLogin: true
        }));
      }
    });
  };

  // Função para configurar os listeners de status
  const setupStatusListeners = (userId: string) => {
    if (statusListenersSetup.current || typeof window === 'undefined') return;
    
    statusListenersSetup.current = true;
    
    // Heartbeat para manter status online
    const startHeartbeat = () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      heartbeatInterval.current = setInterval(() => {
        if (document.visibilityState !== 'hidden') {
          updateOnlineStatus('online');
        }
      }, 30000); // A cada 30 segundos
    };

    // Handler para beforeunload (fechamento de página/navegador)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      sendOfflineStatus(userId);
      // Não mostrar dialog de confirmação para melhor UX
      return undefined;
    };

    // Handler para visibilitychange (troca de aba/minimizar)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        updateOnlineStatus('offline', true);
      } else {
        updateOnlineStatus('online');
        startHeartbeat();
      }
    };

    // Handler para quando volta a ter conexão
    const handleOnline = () => {
      updateOnlineStatus('online');
      startHeartbeat();
    };

    // Handler para quando perde conexão
    const handleOffline = () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };

    // Inicializa como online e começa heartbeat
    updateOnlineStatus('online', true);
    startHeartbeat();
    
    // Registra todos os listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      statusListenersSetup.current = false;
      updateOnlineStatus('offline', true);
    };
  };

  // Função para verificar e processar atualizações pendentes
  const processPendingStatusUpdates = async () => {
    if (typeof window === 'undefined' || !user) return;
    
    const pendingUpdate = localStorage.getItem('pendingStatusUpdate');
    if (pendingUpdate) {
      try {
        const { userId, status, updateLastLogin } = JSON.parse(pendingUpdate);
        if (userId === user.uid) {
          await updateOnlineStatus(status, updateLastLogin);
          localStorage.removeItem('pendingStatusUpdate');
        }
      } catch (error) {
        console.error('Erro ao processar update pendente:', error);
        localStorage.removeItem('pendingStatusUpdate');
      }
    }
  };

  useEffect(() => {
    let cleanupStatusListeners: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            
            setUserData({
              ...userData,
              id: currentUser.uid
            });
            
            if (userData.ativo === "sim") {
              
              // Processa atualizações pendentes primeiro
              await processPendingStatusUpdates();
              
              // Configura listeners de status
              cleanupStatusListeners = setupStatusListeners(currentUser.uid);
            }
          }
        } catch (error) {
          console.error("❌ AuthContext: Erro ao buscar dados do usuário:", error);
        }
      } else {
        // Limpa listeners quando desautenticar
        if (cleanupStatusListeners) {
          cleanupStatusListeners();
          cleanupStatusListeners = null;
        }
        setUserData(null);
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (cleanupStatusListeners) {
        cleanupStatusListeners();
      }
    };
  }, [auth, db]);

  async function signUp(email: string, password: string, displayName: string, cpf: string, cargo: string, imagemPerfil: string = "", centroDeCusto: string = ""): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      const userDocRef = doc(db, "usuarios", userCredential.user.uid);
      
      await setDoc(userDocRef, {
        nome: displayName,
        email: email,
        cpf: cpf,
        cargo: cargo,
        tema: "dark",
        data_registro: serverTimestamp(),
        ultimo_login: serverTimestamp(),
        imagem_perfil: imagemPerfil,
        ativo: "sim",
        centro_de_custo: centroDeCusto,
        online: "online",
        permissoes: ["dashboard"] // Permissões padrão para novos usuários
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async function signIn(email: string, password: string): Promise<{user: User, isActive: boolean}> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }
      
      const userData = userDoc.data() as UserData;
      const isActive = userData.ativo === "sim";
      
      if (isActive) {
        await updateDoc(userDocRef, {
          ultimo_login: serverTimestamp(),
          online: 'online'
        });
      }
      
      return { user, isActive };
    } catch (error) {
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (user) {
        // Limpa heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        
        // Atualiza status para offline e ultimo_login
        await updateOnlineStatus('offline', true);
        
        // Aguarda um pouco para garantir que a atualização foi enviada
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }

  const value: AuthContextType = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}