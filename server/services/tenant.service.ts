/**
 * Tenant Service
 * Business logic for tenant operations
 */

import { TenantContext } from '@/lib/types/tenant';
import { TenantRepository } from '../adapters/repositories/tenant.repository';

export class TenantService {
  private tenantRepo: TenantRepository;

  constructor() {
    this.tenantRepo = new TenantRepository();
  }

  /**
   * Get tenant by ID with context validation
   */
  async getTenantById(tenantId: string, context: TenantContext): Promise<any> {
    // Tenancy guard: ensure context matches requested tenant
    if (context.tenantId !== tenantId) {
      throw new Error('Tenant mismatch: cannot access other tenant data');
    }

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    return tenant;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<any> {
    const tenant = await this.tenantRepo.findBySlug(slug);
    if (!tenant) {
      throw new Error(`Tenant not found: ${slug}`);
    }
    return tenant;
  }
}

