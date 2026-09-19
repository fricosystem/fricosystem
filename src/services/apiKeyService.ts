/**
 * @deprecated Segredos nao devem ser lidos no frontend.
 * Use Cloud Functions/Secrets Manager no backend.
 */
export const getGroqApiKey = async (): Promise<null> => {
  console.warn("[APEX SECURITY] getGroqApiKey foi desativado no frontend.");
  return null;
};

/**
 * @deprecated Segredos nao devem ser lidos no frontend.
 * Use Cloud Functions/Secrets Manager no backend.
 */
export const getApiKey = async (): Promise<null> => {
  console.warn("[APEX SECURITY] getApiKey foi desativado no frontend.");
  return null;
};
