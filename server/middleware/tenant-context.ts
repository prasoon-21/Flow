/**
 * Tenant Context Middleware
 * Ensures every request carries tenant context
 */

import { TenantContext, UserRole, ModuleKey, CapabilityKey } from '@/lib/types/tenant';
import { resolveUserModules } from '@/lib/access/modules';

/**
 * Extract tenant context from request
 * In production, this would extract from auth token/session
 */
export function getTenantContext(req: any): TenantContext | null {
  // TODO: Replace with actual auth extraction
  // For now, return mock context
  const tenantId = req.headers['x-tenant-id'] || process.env.DEFAULT_TENANT || 'drmorepen';
  const userId = req.headers['x-user-id'] || 'admin-user';
  const userRole = (req.headers['x-user-role'] as UserRole) || 'admin';
  const headerModules = parseHeaderList(req.headers['x-user-modules']).filter(Boolean) as ModuleKey[];
  const headerCapabilities = parseHeaderList(req.headers['x-user-capabilities']).filter(Boolean) as CapabilityKey[];

  return {
    tenantId,
    userId,
    userRole,
    modules: resolveUserModules({ role: userRole, modules: headerModules }),
    capabilities: headerCapabilities,
  };
}

/**
 * Require tenant context - throws if missing
 */
export function requireTenantContext(req: any): TenantContext {
  const context = getTenantContext(req);
  if (!context) {
    throw new Error('Tenant context required');
  }
  return context;
}

function parseHeaderList(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')).split(',').map((v) => v.trim()))
      .flat()
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
