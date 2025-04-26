import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQNeSL_KyO2JjomiZLph5OaqtnhH8ahTk",
  authDomain: "fricoalimentossystem-60cf5.firebaseapp.com",
  projectId: "fricoalimentossystem-60cf5",
  storageBucket: "fricoalimentossystem-60cf5.firebasestorage.app",
  messagingSenderId: "6036191545",
  appId: "1:6036191545:web:ec7236737432ea9165d0e8",
  measurementId: "G-D4YSPJX34M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);