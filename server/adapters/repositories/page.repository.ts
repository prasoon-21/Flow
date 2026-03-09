/**
 * Page Repository — in-memory stub backed by data/pages.ts
 */

import { BaseRepository } from '../firestore';
import { Page } from '@/lib/types/page';
import { pages } from '@/data/pages';

export class PageRepository extends BaseRepository<Page> {
  constructor() {
    super('pages');
  }

  async findById(id: string): Promise<Page | null> {
    return pages.find((p) => p.id === id) ?? null;
  }

  async findByPath(path: string, projectKey: string): Promise<Page | null> {
    return pages.find((p) => p.path === path && p.projectKey === projectKey) ?? null;
  }

  async findByProject(projectKey: string): Promise<Page[]> {
    return pages.filter((p) => p.projectKey === projectKey);
  }
}
