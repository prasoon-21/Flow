/**
 * Firestore Adapter Layer (Repository Pattern) — In-memory stub for demo mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Stub — returns a dummy object so files that import it still compile.
 * Active repositories use in-memory data instead of Firestore.
 */
export function getFirestoreInstance(): any {
  throw new Error('Firestore is not available in demo mode. Use in-memory repositories.');
}

/**
 * Base repository class — in-memory stub.
 * Concrete repositories override every method with hardcoded data.
 */
export abstract class BaseRepository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollection(_tenantId?: string): any {
    return null;
  }

  async findById(_id: string): Promise<T | null> {
    return null;
  }

  async findByTenant(_tenantId: string): Promise<T[]> {
    return [];
  }

  async create(_data: Omit<T, 'id'>): Promise<T> {
    throw new Error('Not implemented in demo mode');
  }

  async update(_id: string, _data: Partial<T>): Promise<T> {
    throw new Error('Not implemented in demo mode');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented in demo mode');
  }
}
