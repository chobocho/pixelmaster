import type { ProjectStorage } from './ProjectStorage.js';
import type { ProjectRecord, ProjectSummary } from './ProjectRecord.js';

const DB_NAME = 'pixelmaster';
const DB_VERSION = 1;
const STORE = 'projects';

/**
 * IndexedDB 기반 프로젝트 저장소.
 * 브라우저 환경에서만 동작한다. IDB 의 structured clone 이 Uint8ClampedArray 를 지원한다.
 */
export class IndexedDBProjectStorage implements ProjectStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  async save(record: ProjectRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async load(id: string): Promise<ProjectRecord | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as ProjectRecord | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async list(): Promise<ProjectSummary[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const records = (req.result as ProjectRecord[]) ?? [];
        const items: ProjectSummary[] = records.map((r) => ({
          id: r.id,
          name: r.name,
          size: r.snapshot.size,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
        items.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise !== null) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }
}
