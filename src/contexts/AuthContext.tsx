// AuthContext.tsx
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

// Defina o tipo para os dados do usuário
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
  online: string; // Adicionado campo online
  unidade: string;
  fornecedorCnpj: string;
}

// Defina a interface para o contexto
interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
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

  // Função para atualizar o status online
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
        // Adiciona event listener para detectar fechamento do navegador
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Buscar dados adicionais do usuário no Firestore
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUserData(userData);
            
            // Atualiza para online ao fazer login
            await updateDoc(userDocRef, {
              online: 'online',
              ultimo_login: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        // Remove event listener se não houver usuário logado
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
  }, [auth, db, user]);

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
        online: "online" // Define como online ao criar conta
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async function signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(db, "usuarios", userCredential.user.uid);
      await updateDoc(userDocRef, {
        ultimo_login: serverTimestamp(),
        online: 'online' // Atualiza para online ao fazer login
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (user) {
        await updateOnlineStatus('offline'); // Atualiza para offline antes de fazer logout
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