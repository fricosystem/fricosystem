import { Octokit } from '@octokit/rest';
import { saveGitHubConfig, getGitHubConfig, updateGitHubConfig, deleteGitHubConfig } from '@/firebase/firestore';
import { auth } from '@/firebase/firebase';
import { format } from 'date-fns';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha?: string;
  content?: string;
  children?: FileNode[];
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface CodespaceConfig {
  machine: 'basicLinux32gb' | 'standardLinux32gb' | 'premiumLinux64gb';
  devcontainer_path?: string;
  idle_timeout_minutes?: number;
}

interface Codespace {
  id: number;
  name: string;
  display_name?: string;
  state: 'Available' | 'Unavailable' | 'Created' | 'Starting' | 'Started' | 'Stopping' | 'Stopped' | 'Rebuilding' | 'Exporting' | 'Unknown' | 'Queued' | 'Provisioning' | 'Awaiting' | 'Deleted' | 'Moved' | 'Shutdown' | 'Archived' | 'ShuttingDown' | 'Failed' | 'Updating';
  machine?: {
    name: string;
    display_name: string;
    operating_system: string;
    storage_in_bytes: number;
    memory_in_bytes: number;
    cpus: number;
  };
  web_url?: string;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
  repository?: {
    full_name: string;
  };
}

interface StoredGitHubConfig extends GitHubConfig {
  id: string;
  createdAt: any;
  updatedAt: any;
}

class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;
  private configId: string | null = null;
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (!this.initialized) {
      await this.loadConfig();
      this.initialized = true;
    }
  }

  public async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  private async loadConfig(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('Usuário não autenticado. Configure do GitHub requer autenticação.');
        return false;
      }

      const storedConfig = await getGitHubConfig(user.uid);
      if (storedConfig) {
        this.config = {
          token: storedConfig.token,
          owner: storedConfig.owner,
          repo: storedConfig.repo
        };
        this.configId = storedConfig.id;
        this.octokit = new Octokit({ auth: storedConfig.token });
        return true;
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do GitHub:', error);
    }
    return false;
  }

  public async forceReloadConfig(): Promise<boolean> {
    this.octokit = null;
    this.config = null;
    this.configId = null;
    this.initialized = false;
    await this.init();
    return this.isConfigured();
  }

  public async hasExistingConfig(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const storedConfig = await getGitHubConfig(user.uid);
      return storedConfig !== null;
    } catch (error) {
      console.error('Erro ao verificar configuração existente do GitHub:', error);
      return false;
    }
  }

  public isConfigured(): boolean {
    return this.octokit !== null && this.config !== null;
  }

  public async configure(token: string, owner: string, repo: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login para configurar o GitHub.');
    }

    this.config = { token, owner, repo };
    this.octokit = new Octokit({ auth: token });
    
    try {
      if (this.configId) {
        // Atualiza configuração existente
        await updateGitHubConfig(this.configId, this.config);
      } else {
        // Cria nova configuração
        this.configId = await saveGitHubConfig(user.uid, this.config);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração do GitHub:', error);
      throw new Error('Falha ao salvar configuração do GitHub no banco de dados.');
    }
  }

  public getConfig(): GitHubConfig | null {
    return this.config;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.octokit || !this.config) return false;

    try {
      await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  public async getRepositoryTree(path: string = ''): Promise<FileNode[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if (Array.isArray(data)) {
        const files: FileNode[] = [];
        
        // Primeiro adiciona diretórios
        for (const item of data.filter(item => item.type === 'dir')) {
          files.push({
            name: item.name,
            path: item.path,
            type: 'dir',
            sha: item.sha,
          });
        }

        // Depois adiciona arquivos
        for (const item of data.filter(item => item.type === 'file')) {
          files.push({
            name: item.name,
            path: item.path,
            type: 'file',
            sha: item.sha,
          });
        }

        return files;
      } else {
        // Se não é array, é um arquivo único
        return [{
          name: data.name,
          path: data.path,
          type: 'file',
          sha: data.sha,
          content: 'content' in data && data.content ? decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))) : undefined,
        }];
      }
    } catch (error) {
      console.error('Erro ao buscar árvore do repositório:', error);
      throw error;
    }
  }

  public async getFileContent(path: string): Promise<string> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if ('content' in data && data.content) {
        // Decodificação correta para UTF-8 - método mais simples e confiável
        const base64Content = data.content.replace(/\s/g, '');
        const decodedContent = decodeURIComponent(escape(atob(base64Content)));
        return decodedContent;
      }
      throw new Error('Arquivo não encontrado ou não é um arquivo texto');
    } catch (error) {
      console.error('Erro ao buscar conteúdo do arquivo:', error);
      throw error;
    }
  }

  public async updateFile(path: string, content: string, message: string): Promise<boolean> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      // Primeiro, tenta buscar o arquivo existente para obter o SHA
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path,
        });
        
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (error) {
        // Arquivo não existe, será criado
        console.log('Criando novo arquivo:', path);
      }

      // Adiciona timestamp ao commit
      const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
      const commitMessage = `${message} - ${timestamp}`;

      // Codificação correta para UTF-8 - método mais simples e confiável
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message: commitMessage,
        content: encodedContent,
        sha, // SHA é obrigatório para atualizações, opcional para criações
      });

      // Log de sucesso para debug
      console.log(`Arquivo ${path} atualizado com sucesso:`, {
        commit: response.data.commit?.sha,
        url: response.data.content?.html_url,
        message: commitMessage
      });

      return true;
    } catch (error) {
      console.error('Erro detalhado ao atualizar arquivo:', {
        path,
        error: error instanceof Error ? error.message : error,
        details: error
      });
      throw error;
    }
  }

  public async createFile(path: string, content: string, message: string): Promise<boolean> {
    return this.updateFile(path, content, message);
  }

  public async deleteFile(path: string, message: string): Promise<boolean> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      // Busca o SHA do arquivo
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if ('sha' in data) {
        // Adiciona timestamp ao commit
        const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
        const commitMessage = `${message} - ${timestamp}`;

        await this.octokit.rest.repos.deleteFile({
          owner: this.config.owner,
          repo: this.config.repo,
          path,
          message: commitMessage,
          sha: data.sha,
        });
        return true;
      }
      throw new Error('Arquivo não encontrado');
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  public async getCommitHistory(limit: number = 10) {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: limit,
      });

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Desconhecido',
        date: commit.commit.author?.date || new Date().toISOString(),
        url: commit.html_url,
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico de commits:', error);
      throw error;
    }
  }

  // ============= CODESPACES METHODS =============

  public async listCodespaces(): Promise<Codespace[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      // Lista codespaces do usuário autenticado relacionados ao repositório
      const { data } = await this.octokit.rest.codespaces.listForAuthenticatedUser();
      
      // Filtra apenas os codespaces do repositório atual
      const repoCodespaces = data.codespaces.filter(
        (cs: any) => cs.repository.full_name === `${this.config!.owner}/${this.config!.repo}`
      );

      return repoCodespaces;
    } catch (error) {
      console.error('Erro ao listar Codespaces:', error);
      throw error;
    }
  }

  public async createCodespace(config: CodespaceConfig = { machine: 'basicLinux32gb' }): Promise<Codespace> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      // Cria codespace usando a API rest genérica
      const response = await this.octokit.request('POST /repos/{owner}/{repo}/codespaces', {
        owner: this.config.owner,
        repo: this.config.repo,
        machine: config.machine,
        devcontainer_path: config.devcontainer_path,
        idle_timeout_minutes: config.idle_timeout_minutes || 30,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar Codespace:', error);
      throw error;
    }
  }

  public async startCodespace(codespaceName: string): Promise<Codespace> {
    if (!this.octokit) {
      throw new Error('GitHub não configurado');
    }

    try {
      const response = await this.octokit.request('POST /codespaces/{codespace_name}/start', {
        codespace_name: codespaceName,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar Codespace:', error);
      throw error;
    }
  }

  public async stopCodespace(codespaceName: string): Promise<Codespace> {
    if (!this.octokit) {
      throw new Error('GitHub não configurado');
    }

    try {
      const response = await this.octokit.request('POST /codespaces/{codespace_name}/stop', {
        codespace_name: codespaceName,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao parar Codespace:', error);
      throw error;
    }
  }

  public async deleteCodespace(codespaceName: string): Promise<void> {
    if (!this.octokit) {
      throw new Error('GitHub não configurado');
    }

    try {
      await this.octokit.request('DELETE /codespaces/{codespace_name}', {
        codespace_name: codespaceName,
      });
    } catch (error) {
      console.error('Erro ao deletar Codespace:', error);
      throw error;
    }
  }

  public async getCodespace(codespaceName: string): Promise<Codespace> {
    if (!this.octokit) {
      throw new Error('GitHub não configurado');
    }

    try {
      const response = await this.octokit.request('GET /codespaces/{codespace_name}', {
        codespace_name: codespaceName,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar Codespace:', error);
      throw error;
    }
  }

  public getCodespaceEmbedUrl(webUrl: string): string {
    // Converte a URL web do Codespace para URL de embed
    return webUrl.replace('github.dev', 'github.dev');
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.configId && auth.currentUser) {
        await deleteGitHubConfig(this.configId);
      }
    } catch (error) {
      console.error('Erro ao remover configuração do GitHub:', error);
    }
    
    this.octokit = null;
    this.config = null;
    this.configId = null;
  }
}

export const githubService = new GitHubService();
export type { FileNode, GitHubConfig, StoredGitHubConfig, Codespace, CodespaceConfig };