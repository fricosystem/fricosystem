// Offline storage usando localStorage como fallback seguro

interface OfflineAction {
  id: string;
  collection: string;
  docId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface CachedData {
  id: string;
  collection: string;
  data: any;
  lastUpdated: number;
}

const PENDING_ACTIONS_KEY = 'offline_pending_actions';
const CACHED_DATA_KEY = 'offline_cached_data';

// Helper para ler do localStorage
function getStoredActions(): OfflineAction[] {
  try {
    const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredActions(actions: OfflineAction[]): void {
  try {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
  } catch (e) {
    console.error('Erro ao salvar ações offline:', e);
  }
}

function getStoredCache(): CachedData[] {
  try {
    const stored = localStorage.getItem(CACHED_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredCache(cache: CachedData[]): void {
  try {
    localStorage.setItem(CACHED_DATA_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Erro ao salvar cache:', e);
  }
}

// Gerar ID único
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Adicionar ação pendente
export async function addPendingAction(
  collection: string,
  docId: string,
  action: 'create' | 'update' | 'delete',
  data: any
): Promise<string> {
  const id = generateOfflineId();
  const actions = getStoredActions();
  
  actions.push({
    id,
    collection,
    docId,
    action,
    data,
    timestamp: Date.now(),
    synced: false,
  });
  
  setStoredActions(actions);
  return id;
}

// Obter ações pendentes não sincronizadas
export async function getPendingActions(): Promise<OfflineAction[]> {
  return getStoredActions().filter(action => !action.synced);
}

// Marcar ação como sincronizada
export async function markActionSynced(id: string): Promise<void> {
  const actions = getStoredActions();
  const index = actions.findIndex(a => a.id === id);
  if (index !== -1) {
    actions[index].synced = true;
    setStoredActions(actions);
  }
}

// Remover ação
export async function removeAction(id: string): Promise<void> {
  const actions = getStoredActions();
  setStoredActions(actions.filter(a => a.id !== id));
}

// Limpar ações sincronizadas antigas (mais de 7 dias)
export async function cleanOldSyncedActions(): Promise<void> {
  const actions = getStoredActions();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  setStoredActions(
    actions.filter(action => !action.synced || action.timestamp >= sevenDaysAgo)
  );
}

// Cache de dados
export async function cacheData(collection: string, docId: string, data: any): Promise<void> {
  const cache = getStoredCache();
  const id = `${collection}_${docId}`;
  const existingIndex = cache.findIndex(c => c.id === id);
  
  const newItem: CachedData = {
    id,
    collection,
    data,
    lastUpdated: Date.now(),
  };
  
  if (existingIndex !== -1) {
    cache[existingIndex] = newItem;
  } else {
    cache.push(newItem);
  }
  
  setStoredCache(cache);
}

// Obter dados em cache
export async function getCachedData(collection: string, docId: string): Promise<any | null> {
  const cache = getStoredCache();
  const cached = cache.find(c => c.id === `${collection}_${docId}`);
  return cached?.data || null;
}

// Obter todos os dados em cache de uma coleção
export async function getCachedCollection(collection: string): Promise<any[]> {
  const cache = getStoredCache();
  return cache.filter(c => c.collection === collection).map(c => c.data);
}

// Limpar cache de uma coleção
export async function clearCachedCollection(collection: string): Promise<void> {
  const cache = getStoredCache();
  setStoredCache(cache.filter(c => c.collection !== collection));
}

// Cache em lote
export async function cacheBatchData(collection: string, items: { id: string; data: any }[]): Promise<void> {
  const cache = getStoredCache();
  
  for (const item of items) {
    const id = `${collection}_${item.id}`;
    const existingIndex = cache.findIndex(c => c.id === id);
    
    const newItem: CachedData = {
      id,
      collection,
      data: item.data,
      lastUpdated: Date.now(),
    };
    
    if (existingIndex !== -1) {
      cache[existingIndex] = newItem;
    } else {
      cache.push(newItem);
    }
  }
  
  setStoredCache(cache);
}
