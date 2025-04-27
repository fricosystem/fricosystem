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
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  tema: string;
  data_registro: Timestamp;
  ultimo_login: Timestamp;
  imagem_perfil: string;
  ativo: string;
  centro_de_custo: string;
}

// Defina a interface para o contexto
interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string, cpf: string, cargo: string, imagemPerfil?: string, centroDeCusto?: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Crie o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Buscar dados adicionais do usuário no Firestore
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  // Função para criar um novo usuário
  async function signUp(email: string, password: string, displayName: string, cpf: string, cargo: string, imagemPerfil: string = "", centroDeCusto: string = ""): Promise<User> {
    try {
      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar o nome de exibição no Auth
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Criar documento do usuário no Firestore
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
        centro_de_custo: centroDeCusto
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // Função para login
  async function signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Atualizar o último login no Firestore
      const userDocRef = doc(db, "usuarios", userCredential.user.uid);
      await updateDoc(userDocRef, {
        ultimo_login: serverTimestamp()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // Função para logout
  async function logout(): Promise<void> {
    return signOut(auth);
  }

  const value: AuthContextType = {
    user,
    userData,
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