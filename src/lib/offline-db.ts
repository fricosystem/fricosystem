import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'apex-cq-offline';
const STORE_NAME = 'forms-data';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveFormDataOffline = async (data: any) => {
  const db = await initDB();
  return db.add(STORE_NAME, {
    ...data,
    timestamp: new Date().toISOString(),
    synced: false
  });
};

export const getOfflineForms = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const clearSyncedForms = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const all = await store.getAll();
  for (const item of all) {
    if (item.synced) {
      await store.delete(item.id);
    }
  }
  await tx.done;
};
