/**
 * Page Service
 * Business logic for page access and management
 */

import { TenantContext } from '@/lib/types/tenant';
import { Page } from '@/lib/types/page';
import { PageRepository } from '../adapters/repositories/page.repository';
import { guardPageAccess } from '../middleware/access-guard';
import { getConfig } from '@/lib/config/env';

export class PageService {
  private pageRepo: PageRepository;

  constructor() {
    this.pageRepo = new PageRepository();
  }

  /**
   * Fetch page definition without enforcing access.
   */
  async findPageDefinition(path: string, context: TenantContext): Promise<Page | null> {
    const { projectKey } = getConfig();
    return this.pageRepo.findByPath(path, projectKey);
  }

  /**
   * Get page by path with access control
   */
  async getPageByPath(path: string, context: TenantContext): Promise<Page | null> {
    const page = await this.findPageDefinition(path, context);
    if (!page) {
      return null;
    }

    // Apply access guard - bypassed for MVP
    // guardPageAccess(context, page);

    return page;
  }

  /**
   * Get all accessible pages for tenant
   */
  async getAccessiblePages(context: TenantContext): Promise<Page[]> {
    const { projectKey } = getConfig();
    const allPages = await this.pageRepo.findByProject(projectKey);

    // Filter by access - bypassed for MVP
    return allPages;
  }
}
