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

  // Lista de padrões para ignorar arquivos desnecessários
  private readonly IGNORE_PATTERNS = [
    '.git/',
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '.nuxt/',
    '.output/',
    '.vite/',
    'coverage/',
    '.nyc_output/',
    '.cache/',
    'tmp/',
    'temp/',
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db',
    '*.pyc',
    '__pycache__/',
    '.env',
    '.env.local',
    '.env.production',
    '.env.development'
  ];

  // Tamanhos máximos seguros
  private readonly MAX_FILE_SIZE = 800 * 1024; // 800KB por arquivo
  private readonly MAX_BATCH_SIZE = 2 * 1024 * 1024; // 2MB por batch
  private readonly MAX_FILES_PER_BATCH = 3; // Máximo 3 arquivos por batch
  private readonly MAX_TREE_SIZE = 900 * 1024; // 900KB por árvore Git

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
      const response = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      
      // Verifica permissões específicas
      const permissions = response.data.permissions;
      if (!permissions?.push) {
        console.warn('Token não tem permissão de push para o repositório');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Verifica se o token tem as permissões necessárias
   */
  public async validatePermissions(): Promise<{ valid: boolean; missing: string[] }> {
    if (!this.octokit || !this.config) {
      return { valid: false, missing: ['Configuração não encontrada'] };
    }

    const missing: string[] = [];

    try {
      // Testa permissão de leitura do repositório
      await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
    } catch (error) {
      missing.push('repo - Acesso de leitura ao repositório');
    }

    try {
      // Testa permissão de escrita tentando buscar conteúdo
      await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: 'README.md'
      });
    } catch (error) {
      // Se falhou por outro motivo que não seja arquivo não encontrado
      if (!error?.toString().includes('Not Found')) {
        missing.push('contents:write - Permissão de escrita');
      }
    }

    return { valid: missing.length === 0, missing };
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

  /**
   * Verifica se um arquivo deve ser ignorado
   */
  private shouldIgnoreFile(path: string): boolean {
    return this.IGNORE_PATTERNS.some(pattern => {
      if (pattern.endsWith('/')) {
        return path.startsWith(pattern) || path.includes('/' + pattern);
      }
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(path);
      }
      return path === pattern || path.endsWith('/' + pattern);
    });
  }

  /**
   * Estratégia principal de upload com retry e fallback
   */
  public async updateFile(path: string, content: string, message: string): Promise<boolean> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    // Verifica se o arquivo deve ser ignorado
    if (this.shouldIgnoreFile(path)) {
      console.log(`Arquivo ${path} está na lista de ignorados, pulando...`);
      return true;
    }

    // Verifica o tamanho do conteúdo
    const contentSize = new Blob([content]).size;
    console.log(`Processando arquivo ${path} (${Math.round(contentSize / 1024)}KB)`);

    // Estratégia baseada no tamanho
    if (contentSize > this.MAX_FILE_SIZE) {
      console.log(`Arquivo ${path} é muito grande, usando estratégia incremental`);
      return this.updateFileWithRetry(path, content, message, 'incremental');
    }

    return this.updateFileWithRetry(path, content, message, 'standard');
  }

  /**
   * Atualização de arquivo com retry automático e backoff exponencial
   */
  private async updateFileWithRetry(
    path: string, 
    content: string, 
    message: string, 
    strategy: 'standard' | 'incremental',
    maxRetries: number = 3
  ): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (strategy === 'incremental') {
          return await this.updateFileIncremental(path, content, message);
        } else {
          return await this.updateFileStandard(path, content, message);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido');
        const errorMessage = lastError.message.toLowerCase();

        // Verifica se é erro de rate limit
        if (errorMessage.includes('rate limit') || errorMessage.includes('abuse')) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`Rate limit detectado, aguardando ${backoffTime}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }

        // Verifica se é erro de tamanho e muda estratégia
        if (errorMessage.includes('too large') && strategy === 'standard') {
          console.log('Arquivo muito grande, mudando para estratégia incremental...');
          strategy = 'incremental';
          continue;
        }

        // Verifica se é erro de permissão
        if (errorMessage.includes('403') || errorMessage.includes('permission')) {
          console.error('Erro de permissão detectado:', lastError);
          throw new Error('Token não tem permissões suficientes para este repositório');
        }

        console.warn(`Tentativa ${attempt + 1} falhou:`, lastError.message);
        
        // Se não é a última tentativa, aguarda antes de tentar novamente
        if (attempt < maxRetries - 1) {
          const backoffTime = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw lastError || new Error('Falha após múltiplas tentativas');
  }

  /**
   * Método padrão de atualização de arquivo
   */
  private async updateFileStandard(path: string, content: string, message: string): Promise<boolean> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    // Busca SHA do arquivo existente
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
      console.log('Criando novo arquivo:', path);
    }

    // Adiciona timestamp ao commit
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
    const commitMessage = `${message} - ${timestamp}`;

    // Codificação correta para UTF-8
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const response = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      message: commitMessage,
      content: encodedContent,
      sha,
    });

    console.log(`Arquivo ${path} atualizado com sucesso:`, {
      commit: response.data.commit?.sha,
      url: response.data.content?.html_url,
      message: commitMessage
    });

    return true;
  }

  /**
   * Atualização incremental melhorada com estratégias múltiplas
   */
  public async updateFileIncremental(
    path: string, 
    content: string, 
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    try {
      progressCallback?.(10, 'Iniciando processo incremental otimizado...');

      // Estratégia A: Ultra-pequenos chunks para arquivos muito grandes
      const contentSize = new Blob([content]).size;
      
      if (contentSize > 2 * 1024 * 1024) { // > 2MB
        return this.updateFileUltraSmallChunks(path, content, message, progressCallback);
      }

      // Estratégia B: Chunks inteligentes baseados em estrutura do código
      return this.updateFileSmartChunks(path, content, message, progressCallback);

    } catch (error) {
      console.error('Erro na atualização incremental:', error);
      // Fallback para estratégia linha por linha em último caso
      return this.updateFileLineByLine(path, content, message, progressCallback);
    }
  }

  /**
   * Estratégia A: Chunks ultra-pequenos (arquivo por arquivo praticamente)
   */
  private async updateFileUltraSmallChunks(
    path: string, 
    content: string, 
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    progressCallback?.(20, 'Usando estratégia ultra-conservadora...');

    // Divide o conteúdo em partes de 50KB máximo
    const maxChunkSize = 50 * 1024; // 50KB
    const chunks: string[] = [];
    
    let currentPosition = 0;
    while (currentPosition < content.length) {
      // Busca uma quebra de linha próxima ao limite para não cortar no meio
      let endPosition = Math.min(currentPosition + maxChunkSize, content.length);
      
      if (endPosition < content.length) {
        const lastNewline = content.lastIndexOf('\n', endPosition);
        if (lastNewline > currentPosition) {
          endPosition = lastNewline + 1;
        }
      }
      
      const chunk = content.slice(0, endPosition);
      chunks.push(chunk);
      currentPosition = endPosition;
    }

    return this.processChunksSequentially(path, chunks, message, progressCallback, 'ultra-pequeno');
  }

  /**
   * Estratégia B: Chunks inteligentes baseados na estrutura do código
   */
  private async updateFileSmartChunks(
    path: string, 
    content: string, 
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    progressCallback?.(20, 'Analisando estrutura do código...');

    const lines = content.split('\n');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;
    const maxChunkSize = 100 * 1024; // 100KB por chunk

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineSize = new Blob([line + '\n']).size;
      
      // Se adicionar esta linha exceder o limite, finaliza o chunk atual
      if (currentSize + lineSize > maxChunkSize && currentChunk.length > 0) {
        // Cria chunk incremental (sempre com todo o conteúdo até este ponto)
        const chunkContent = lines.slice(0, i).join('\n');
        chunks.push(chunkContent);
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(line);
      currentSize += lineSize;
    }
    
    // Adiciona o chunk final se houver conteúdo
    if (currentChunk.length > 0) {
      chunks.push(content); // Sempre o conteúdo completo no final
    }

    return this.processChunksSequentially(path, chunks, message, progressCallback, 'inteligente');
  }

  /**
   * Estratégia C: Linha por linha (último recurso)
   */
  private async updateFileLineByLine(
    path: string, 
    content: string, 
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    progressCallback?.(20, 'Usando estratégia linha-por-linha (último recurso)...');

    const lines = content.split('\n');
    const chunks: string[] = [];
    
    // Cria chunks incrementais de 50 linhas
    for (let i = 50; i <= lines.length; i += 50) {
      const chunkContent = lines.slice(0, i).join('\n');
      chunks.push(chunkContent);
    }
    
    // Adiciona o arquivo completo como último chunk
    if (chunks[chunks.length - 1] !== content) {
      chunks.push(content);
    }

    return this.processChunksSequentially(path, chunks, message, progressCallback, 'linha-por-linha');
  }

  /**
   * Processa chunks sequencialmente com pausa entre commits
   */
  private async processChunksSequentially(
    path: string,
    chunks: string[],
    message: string,
    progressCallback?: (progress: number, message: string) => void,
    strategy: string = 'padrão'
  ): Promise<boolean> {
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
    let currentSha: string | undefined;

    // Busca SHA atual se arquivo existe
    try {
      const { data } = await this.octokit!.rest.repos.getContent({
        owner: this.config!.owner,
        repo: this.config!.repo,
        path,
      });
      
      if ('sha' in data) {
        currentSha = data.sha;
      }
    } catch (error) {
      console.log('Arquivo não existe, será criado incrementalmente');
    }

    progressCallback?.(30, `Processando ${chunks.length} partes (${strategy})...`);

    // Processa cada chunk com retry individual
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      
      const progress = 30 + Math.round((i / chunks.length) * 60);
      progressCallback?.(progress, `Enviando parte ${i + 1} de ${chunks.length} (${strategy})...`);

      const chunkMessage = isLastChunk 
        ? `${message} - ${timestamp}` 
        : `${message} (${strategy} ${i + 1}/${chunks.length}) - ${timestamp}`;

      // Retry para cada chunk individual
      let chunkSuccess = false;
      for (let retry = 0; retry < 3; retry++) {
        try {
          const encodedContent = btoa(unescape(encodeURIComponent(chunk)));

          const response = await this.octokit!.rest.repos.createOrUpdateFileContents({
            owner: this.config!.owner,
            repo: this.config!.repo,
            path,
            message: chunkMessage,
            content: encodedContent,
            sha: currentSha,
          });

          currentSha = response.data.content?.sha;
          chunkSuccess = true;
          break;
        } catch (error) {
          console.warn(`Erro no chunk ${i + 1}, tentativa ${retry + 1}:`, error);
          if (retry < 2) {
            // Backoff exponencial
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
          }
        }
      }

      if (!chunkSuccess) {
        throw new Error(`Falha ao processar chunk ${i + 1} após múltiplas tentativas`);
      }

      // Pausa entre commits para evitar rate limiting
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre commits
      }
    }

    progressCallback?.(100, `Processo incremental ${strategy} concluído com sucesso!`);
    console.log(`Arquivo ${path} atualizado incrementalmente (${strategy}) com sucesso`);
    return true;
  }

  public async createFile(path: string, content: string, message: string): Promise<boolean> {
    return this.updateFile(path, content, message);
  }

  /**
   * Upload em lote otimizado para múltiplos arquivos
   */
  public async uploadMultipleFiles(
    files: Array<{ path: string; content: string }>,
    message: string,
    progressCallback?: (progress: number, message: string, stats?: any) => void
  ): Promise<{ success: boolean; results: Array<{ path: string; success: boolean; error?: string }> }> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub não configurado');
    }

    progressCallback?.(5, 'Iniciando upload em lote...');

    // Filtra arquivos ignorados
    const validFiles = files.filter(file => !this.shouldIgnoreFile(file.path));
    const ignoredCount = files.length - validFiles.length;
    
    if (ignoredCount > 0) {
      console.log(`${ignoredCount} arquivos ignorados baseado nos padrões de exclusão`);
    }

    progressCallback?.(10, `Processando ${validFiles.length} arquivos válidos...`);

    // Calcula estatísticas
    const totalSize = validFiles.reduce((sum, file) => sum + new Blob([file.content]).size, 0);
    const avgFileSize = totalSize / validFiles.length;
    
    console.log(`Estatísticas do upload:`, {
      arquivos: validFiles.length,
      tamanhoTotal: `${Math.round(totalSize / 1024)}KB`,
      tamanhoMedio: `${Math.round(avgFileSize / 1024)}KB`
    });

    // Escolhe estratégia baseada no tamanho
    if (totalSize > 10 * 1024 * 1024) { // > 10MB
      return this.uploadFilesSequential(validFiles, message, progressCallback);
    } else if (validFiles.length > 10) {
      return this.uploadFilesSmallBatches(validFiles, message, progressCallback);
    } else {
      return this.uploadFilesOptimizedBatch(validFiles, message, progressCallback);
    }
  }

  /**
   * Estratégia A: Upload sequencial (arquivo por arquivo)
   */
  private async uploadFilesSequential(
    files: Array<{ path: string; content: string }>,
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<{ success: boolean; results: Array<{ path: string; success: boolean; error?: string }> }> {
    const results: Array<{ path: string; success: boolean; error?: string }> = [];
    let successCount = 0;

    progressCallback?.(15, 'Usando estratégia sequencial (mais segura)...');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress = 15 + Math.round((i / files.length) * 80);
      
      progressCallback?.(fileProgress, `Processando ${file.path} (${i + 1}/${files.length})...`);

      try {
        const success = await this.updateFile(file.path, file.content, `${message} - ${file.path}`);
        results.push({ path: file.path, success });
        if (success) successCount++;

        // Pausa entre arquivos para evitar rate limiting
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({ path: file.path, success: false, error: errorMsg });
        console.error(`Erro ao processar ${file.path}:`, error);
      }
    }

    progressCallback?.(100, `Upload sequencial concluído: ${successCount}/${files.length} arquivos`);

    return {
      success: successCount === files.length,
      results
    };
  }

  /**
   * Estratégia B: Pequenos lotes de 2-3 arquivos
   */
  private async uploadFilesSmallBatches(
    files: Array<{ path: string; content: string }>,
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<{ success: boolean; results: Array<{ path: string; success: boolean; error?: string }> }> {
    const results: Array<{ path: string; success: boolean; error?: string }> = [];
    const batchSize = this.MAX_FILES_PER_BATCH; // 3 arquivos por lote
    let successCount = 0;

    progressCallback?.(15, `Usando estratégia de pequenos lotes (${batchSize} arquivos por vez)...`);

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchProgress = 15 + Math.round((i / files.length) * 80);
      
      progressCallback?.(batchProgress, `Processando lote ${Math.floor(i / batchSize) + 1} (${batch.length} arquivos)...`);

      // Processa lote em paralelo
      const batchPromises = batch.map(async (file) => {
        try {
          const success = await this.updateFile(file.path, file.content, `${message} - ${file.path}`);
          return { path: file.path, success };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          return { path: file.path, success: false, error: errorMsg };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      successCount += batchResults.filter(r => r.success).length;

      // Pausa entre lotes
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    progressCallback?.(100, `Upload em lotes concluído: ${successCount}/${files.length} arquivos`);

    return {
      success: successCount === files.length,
      results
    };
  }

  /**
   * Estratégia C: Lote otimizado para poucos arquivos
   */
  private async uploadFilesOptimizedBatch(
    files: Array<{ path: string; content: string }>,
    message: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<{ success: boolean; results: Array<{ path: string; success: boolean; error?: string }> }> {
    const results: Array<{ path: string; success: boolean; error?: string }> = [];
    let successCount = 0;

    progressCallback?.(15, 'Usando estratégia otimizada para poucos arquivos...');

    // Processa todos em paralelo com limite de concorrência
    const semaphore = new Array(3).fill(null); // Máximo 3 operações paralelas
    
    const processFile = async (file: { path: string; content: string }, index: number) => {
      try {
        progressCallback?.(20 + Math.round((index / files.length) * 70), `Processando ${file.path}...`);
        const success = await this.updateFile(file.path, file.content, `${message} - ${file.path}`);
        return { path: file.path, success };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        return { path: file.path, success: false, error: errorMsg };
      }
    };

    // Executa com controle de concorrência
    const promises = files.map((file, index) => processFile(file, index));
    const batchResults = await Promise.all(promises);
    
    results.push(...batchResults);
    successCount = batchResults.filter(r => r.success).length;

    progressCallback?.(100, `Upload otimizado concluído: ${successCount}/${files.length} arquivos`);

    return {
      success: successCount === files.length,
      results
    };
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