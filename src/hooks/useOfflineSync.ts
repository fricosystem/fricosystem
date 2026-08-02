import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { 
  getPendingActions, 
  markActionSynced, 
  removeAction, 
  cleanOldSyncedActions 
} from '@/lib/offlineDB';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';

export function useOfflineSync() {
  const { isOnline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncInProgress = useRef(false);

  // Converter timestamps para Firestore Timestamp
  const convertTimestamps = (data: any): any => {
    if (!data) return data;
    
    const converted = { ...data };
    for (const key of Object.keys(converted)) {
      const value = converted[key];
      if (value && typeof value === 'object') {
        if (value._isOfflineTimestamp) {
          converted[key] = Timestamp.fromDate(new Date(value.value));
        } else if (!Array.isArray(value)) {
          converted[key] = convertTimestamps(value);
        } else if (Array.isArray(value)) {
          converted[key] = value.map(item => 
            typeof item === 'object' ? convertTimestamps(item) : item
          );
        }
      }
    }
    return converted;
  };

  // Sincronizar uma ação individual
  const syncAction = async (action: any): Promise<boolean> => {
    try {
      const collectionRef = collection(db, action.collection);
      const docRef = doc(collectionRef, action.docId);
      const convertedData = convertTimestamps(action.data);

      switch (action.action) {
        case 'create':
          await setDoc(docRef, convertedData);
          break;
        case 'update':
          await updateDoc(docRef, convertedData);
          break;
        case 'delete':
          await deleteDoc(docRef);
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar ação:', error);
      return false;
    }
  };

  // Sincronizar todas as ações pendentes
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const pendingActions = await getPendingActions();
      
      if (pendingActions.length === 0) {
        setIsSyncing(false);
        syncInProgress.current = false;
        return;
      }

      // Ordenar por timestamp para manter ordem de execução
      const sortedActions = pendingActions.sort((a, b) => a.timestamp - b.timestamp);
      
      // Agrupar por docId para evitar duplicatas (manter apenas a última ação)
      const uniqueActions = new Map<string, typeof sortedActions[0]>();
      for (const action of sortedActions) {
        const key = `${action.collection}_${action.docId}`;
        uniqueActions.set(key, action);
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const action of uniqueActions.values()) {
        const success = await syncAction(action);
        
        if (success) {
          // Marcar todas as ações do mesmo documento como sincronizadas
          const relatedActions = sortedActions.filter(
            a => a.collection === action.collection && a.docId === action.docId
          );
          for (const related of relatedActions) {
            await removeAction(related.id);
          }
          syncedCount++;
        } else {
          failedCount++;
        }
      }

      // Limpar ações antigas já sincronizadas
      await cleanOldSyncedActions();

      // Atualizar contagem
      const remaining = await getPendingActions();
      setPendingCount(remaining.length);

      if (syncedCount > 0) {
        toast.success(`${syncedCount} ${syncedCount === 1 ? 'registro sincronizado' : 'registros sincronizados'} com sucesso!`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} ${failedCount === 1 ? 'registro falhou' : 'registros falharam'} ao sincronizar`);
      }

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados offline');
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [isOnline]);

  // Atualizar contagem de pendentes
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingActions();
    setPendingCount(pending.length);
  }, []);

  // Sincronizar quando voltar online
  useEffect(() => {
    const handleBackOnline = () => {
      syncPendingActions();
    };

    window.addEventListener('app-back-online', handleBackOnline);
    return () => window.removeEventListener('app-back-online', handleBackOnline);
  }, [syncPendingActions]);

  // Verificar pendentes ao montar
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Tentar sincronizar ao montar se estiver online
  useEffect(() => {
    if (isOnline) {
      syncPendingActions();
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingActions,
    updatePendingCount,
  };
}
