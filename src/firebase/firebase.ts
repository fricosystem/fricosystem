import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { firebaseConfig, appCheckSiteKey } from "@/config/env";

const app = initializeApp(firebaseConfig);

let appCheck: AppCheck | null = null;

if (typeof window !== "undefined" && appCheckSiteKey) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (typeof window !== "undefined" && import.meta.env.PROD) {
  console.warn(
    "[APEX SECURITY] App Check desativado: defina VITE_FIREBASE_APP_CHECK_SITE_KEY."
  );
}

const db = getFirestore(app);
const auth = getAuth(app);
const firebaseFunctions = getFunctions(app, "southamerica-east1");

export { db, auth, firebaseFunctions, appCheck };
