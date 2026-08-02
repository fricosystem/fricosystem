/**
 * Configuração central de ambiente.
 *
 * Todas as chaves aqui são PÚBLICAS por natureza (elas sempre acabam no bundle
 * do navegador). A proteção real é feita pelas Firestore Rules, pelo App Check
 * e pelos upload presets *unsigned* do Cloudinary.
 *
 * Estratégia: cada valor tem um padrão embutido do projeto de desenvolvimento.
 * Se a variável `VITE_*` correspondente existir (arquivo `.env` local ou
 * Environment Variables da Vercel), ela SOBRESCREVE o padrão. Assim o sistema
 * funciona em qualquer ambiente, com ou sem `.env`.
 *
 * NUNCA coloque segredos de servidor aqui (Groq, tokens GitHub, Cloudinary
 * api_secret) — esses ficam no Firebase Secret Manager.
 */

type EnvRecord = Record<string, string | undefined>;

const env = import.meta.env as unknown as EnvRecord;

const invalidEnvironmentValues = new Set([
  "undefined",
  "null",
  "placeholder",
  "your_api_key",
  "your-project-id",
  "seu_valor_aqui",
]);

/**
 * Lê a variável de ambiente e ignora placeholders comuns. Isso evita que uma
 * variável vazia ou de exemplo configurada no provedor de deploy substitua os
 * padrões funcionais do projeto.
 */
function readEnv(key: string, fallback = ""): string {
  const value = (env[key] ?? "").trim();
  const normalizedValue = value.toLowerCase();
  const isPlaceholder =
    invalidEnvironmentValues.has(normalizedValue) ||
    normalizedValue.startsWith("your_") ||
    normalizedValue.startsWith("replace_") ||
    normalizedValue.includes("change-me");

  return value && !isPlaceholder ? value : fallback;
}

/* -------------------------------------------------------------- Firebase */
export const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY", "AIzaSyCcbmL_iL3hRLNZCJAh-jCx0FADlKgzSNk"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN", "frstockmanager-22c3b.firebaseapp.com"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID", "frstockmanager-22c3b"),
  storageBucket: readEnv(
    "VITE_FIREBASE_STORAGE_BUCKET",
    "frstockmanager-22c3b.firebasestorage.app"
  ),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "962734170221"),
  appId: readEnv("VITE_FIREBASE_APP_ID", "1:962734170221:web:98ec1604620bb245065f64"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-JTJXJETTH1") || undefined,
};

/** App Check é opcional: sem site key ele simplesmente não é inicializado. */
export const appCheckSiteKey = readEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY");

/* ------------------------------------------------------------ Cloudinary */
const presetProdutos = readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_PRODUTOS", "UploadProdutos");

export const cloudinaryConfig = {
  cloudName: readEnv("VITE_CLOUDINARY_CLOUD_NAME", "diomtgcvb"),
  /** Chave pública do Cloudinary. O api_secret NUNCA vem para o front-end. */
  apiKey: readEnv("VITE_CLOUDINARY_API_KEY", "857689276165648"),
  uploadPresetProdutos: presetProdutos,
  uploadPresetPerfil: readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_PERFIL", presetProdutos),
  uploadPresetManuais: readEnv("VITE_CLOUDINARY_UPLOAD_PRESET_MANUAIS", presetProdutos),
};

/* -------------------------------------------------------------- Supabase */
export const supabaseConfig = {
  url: readEnv("VITE_SUPABASE_URL"),
  anonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
};

export const hasSupabaseConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

/* -------------------------------------------------------- Diagnóstico ---- */
/**
 * Com os padrões embutidos nunca há variável obrigatória faltando, então o app
 * sempre inicializa. Mantido para compatibilidade com a tela de diagnóstico.
 */
export const missingEnvVars: readonly string[] = [];
export const isEnvConfigured = true;
