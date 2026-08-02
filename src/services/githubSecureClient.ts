/**
 * Cliente seguro do GitHub.
 *
 * O Personal Access Token NUNCA existe no navegador: ele é gravado por uma
 * Cloud Function e usado somente no servidor. O front-end fala com a API do
 * GitHub através do callable `githubProxy`, que injeta o token.
 */
import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from '@/firebase/firebase';

export interface GitHubIntegrationInfo {
  connected: boolean;
  owner?: string;
  repo?: string;
}

export interface CommitEntradaInfo {
  configured: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
}

const callSave = httpsCallable<
  { token: string; owner: string; repo: string },
  GitHubIntegrationInfo
>(firebaseFunctions, 'saveGitHubIntegration');

const callGet = httpsCallable<Record<string, never>, GitHubIntegrationInfo>(
  firebaseFunctions,
  'getGitHubIntegration'
);

const callDelete = httpsCallable<Record<string, never>, GitHubIntegrationInfo>(
  firebaseFunctions,
  'deleteGitHubIntegration'
);

const callProxy = httpsCallable<
  { method: string; url: string; body?: unknown; headers?: Record<string, string> },
  { status: number; ok: boolean; data: unknown }
>(firebaseFunctions, 'githubProxy');

export const saveGitHubIntegration = async (
  token: string,
  owner: string,
  repo: string
): Promise<GitHubIntegrationInfo> => (await callSave({ token, owner, repo })).data;

export const getGitHubIntegration = async (): Promise<GitHubIntegrationInfo> => {
  try {
    return (await callGet({} as Record<string, never>)).data;
  } catch (error) {
    console.error('[GitHub] Falha ao carregar integração:', error);
    return { connected: false };
  }
};

export const deleteGitHubIntegration = async (): Promise<void> => {
  await callDelete({} as Record<string, never>);
};

/**
 * `fetch` compatível com o Octokit que encaminha tudo para o proxy autenticado.
 * Nenhum header Authorization sai do navegador.
 */
export const proxiedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method || 'GET').toUpperCase();

  let body: unknown;
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  const result = await callProxy({ method, url, body });
  const payload = result.data;

  return new Response(payload.data === null ? null : JSON.stringify(payload.data), {
    status: payload.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
