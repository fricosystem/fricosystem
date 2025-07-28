import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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

  const updateOnlineStatus = async (status: string) => {
    if (user) {
      try {
        const userDocRef = doc(db, "usuarios", user.uid);
        await updateDoc(userDocRef, {
          online: status
        });
      } catch (error) {
        console.error("Erro ao atualizar status online:", error);
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      updateOnlineStatus('offline');
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        window.addEventListener('beforeunload', handleBeforeUnload);
        
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
              await updateDoc(userDocRef, {
                online: 'online',
                ultimo_login: serverTimestamp()
              });
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        setUserData(null);
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
        await updateOnlineStatus('offline');
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