/**
 * Configuração central de ambiente.
 *
 * Todas as chaves públicas do front-end vêm de variáveis `VITE_*`.
 * Em desenvolvimento elas são lidas do arquivo `.env` (não versionado);
 * em produção, das Environment Variables da Vercel.
 *
 * NUNCA coloque segredos de servidor aqui (Groq, tokens GitHub, API secrets).
 * Qualquer variável com prefixo VITE_ vai para o bundle público.
 */

type EnvRecord = Record<string, string | undefined>;

const env = import.meta.env as unknown as EnvRecord;

const missing: string[] = [];

function readEnv(key: string, required = true): string {
  const value = (env[key] ?? "").trim();
  if (!value && required) {
    missing.push(key);
  }
  return value;
}

/* -------------------------------------------------------------- Firebase */
export const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", false) || undefined,
};

export const appCheckSiteKey = readEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY", false);

/* ------------------------------------------------------------ Cloudinary */
const presetProdutos = readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_PRODUTOS");

export const cloudinaryConfig = {
  cloudName: readEnv("VITE_CLOUDINARY_CLOUD_NAME"),
  apiKey: readEnv("VITE_CLOUDINARY_API_KEY", false),
  uploadPresetProdutos: presetProdutos,
  uploadPresetPerfil: readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_PERFIL"),
  uploadPresetManuais:
    readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_MANUAIS", false) || presetProdutos,
};

/* -------------------------------------------------------------- Supabase */
export const supabaseConfig = {
  url: readEnv("VITE_SUPABASE_URL", false),
  anonKey: readEnv("VITE_SUPABASE_ANON_KEY", false),
};

export const hasSupabaseConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

/* -------------------------------------------------------- Validação final */
if (missing.length > 0) {
  const message =
    `[APEX CONFIG] Variáveis de ambiente ausentes: ${missing.join(", ")}. ` +
    "Defina-as no arquivo .env (local) ou nas Environment Variables da Vercel. " +
    "Use .env.example como referência.";

  if (import.meta.env.DEV) {
    console.error(message);
  } else {
    throw new Error(message);
  }
}
