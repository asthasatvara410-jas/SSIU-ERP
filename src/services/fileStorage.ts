// src/services/fileStorage.ts

const DB_NAME = 'ERPDocumentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface StoredFile {
  id: string; // e.g. "idb://file-123"
  name: string;
  type: string;
  data: ArrayBuffer;
  size: number;
  uploadedAt: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const fileStorage = {
  /**
   * Reads a File object and saves it to IndexedDB
   * Returns a unique ID URI prefixed with 'idb://'
   */
  async saveFile(file: File): Promise<string> {
    const db = await openDB();
    const id = `idb://${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const arrayBuffer = await file.arrayBuffer();

    const storedFile: StoredFile = {
      id,
      name: file.name,
      type: file.type,
      data: arrayBuffer,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(storedFile);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Saves raw ArrayBuffer to IndexedDB
   * Returns a unique ID URI prefixed with 'idb://'
   */
  async saveBuffer(name: string, type: string, buffer: ArrayBuffer): Promise<string> {
    if (typeof indexedDB === 'undefined') {
      return `idb://${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const db = await openDB();
    const id = `idb://${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const storedFile: StoredFile = {
      id,
      name,
      type,
      data: buffer,
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(storedFile);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Retrieves a file from IndexedDB as a Blob
   */
  async getFile(id: string): Promise<{ blob: Blob, name: string } | null> {
    if (!id.startsWith('idb://')) return null;

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredFile;
        if (result) {
          const blob = new Blob([result.data], { type: result.type });
          resolve({ blob, name: result.name });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Deletes a file from IndexedDB
   */
  async deleteFile(id: string): Promise<void> {
    if (!id.startsWith('idb://')) return; // Ignore mock URLs

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Helper to trigger a download of a file by its ID
   */
  async downloadFile(id: string, fallbackName?: string) {
    if (id.startsWith('idb://')) {
      const file = await this.getFile(id);
      if (file) {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name || fallbackName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('File not found in local storage.');
      }
    } else {
      // Mock URLs (e.g. from seed data)
      window.open(id, '_blank');
    }
  },

  /**
   * Helper to view a file by its ID in a new tab
   */
  async viewFile(id: string) {
    if (id.startsWith('idb://')) {
      const file = await this.getFile(id);
      if (file) {
        const url = URL.createObjectURL(file.blob);
        window.open(url, '_blank');
      } else {
        alert('File not found in local storage.');
      }
    } else {
      // Mock URLs
      window.open(id, '_blank');
    }
  }
};
