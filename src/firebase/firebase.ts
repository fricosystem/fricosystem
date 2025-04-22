import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-OL3yyv2OXWnCueDMClXPChr5SE3d2ME",
  authDomain: "fricoalimentos-83200.firebaseapp.com",
  projectId: "fricoalimentos-83200",
  storageBucket: "fricoalimentos-83200.firebasestorage.app",
  messagingSenderId: "1094840381104",
  appId: "1:1094840381104:web:ca9ab3c1ed2f773109d575",
  measurementId: "G-T7F349Q7MP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);