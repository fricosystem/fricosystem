import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCcbmL_iL3hRLNZCJAh-jCx0FADlKgzSNk",
  authDomain: "frstockmanager-22c3b.firebaseapp.com",
  projectId: "frstockmanager-22c3b",
  storageBucket: "frstockmanager-22c3b.firebasestorage.app",
  messagingSenderId: "962734170221",
  appId: "1:962734170221:web:98ec1604620bb245065f64",
  measurementId: "G-JTJXJETTH1"
};

// Inicializa Firebase com Firestore e Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  // Firestore (banco de dados)
export const auth = getAuth(app);     // Autenticação