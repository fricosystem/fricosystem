import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCcbmL_iL3hRLNZCJAh-jCx0FADlKgzSNk",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "frstockmanager-22c3b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "frstockmanager-22c3b",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "frstockmanager-22c3b.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "962734170221",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:962734170221:web:98ec1604620bb245065f64",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JTJXJETTH1",
};

const app = initializeApp(firebaseConfig);

let appCheck: AppCheck | null = null;
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;

if (typeof window !== "undefined" && appCheckSiteKey) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

const db = getFirestore(app);
const auth = getAuth(app);
const firebaseFunctions = getFunctions(app, "southamerica-east1");

export { db, auth, firebaseFunctions, appCheck };
