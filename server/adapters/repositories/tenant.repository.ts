/**
 * Tenant Repository — in-memory stub backed by data/tenants.ts
 */

import { BaseRepository } from '../firestore';
import { Tenant } from '@/lib/types/tenant';
import { tenants } from '@/data/tenants';

export class TenantRepository extends BaseRepository<Tenant> {
  constructor() {
    super('tenants');
  }

  async findById(id: string): Promise<Tenant | null> {
    return tenants.find((t) => t.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return tenants.find((t) => t.slug === slug) ?? null;
  }
}

