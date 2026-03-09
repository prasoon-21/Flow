/**
 * Access Control Guards
 * Page-level access control with role and tenant checks
 */

import { CapabilityKey, ModuleKey, TenantContext } from '@/lib/types/tenant';
import { Page } from '@/lib/types/page';

export interface FeatureConfig {
  modules?: ModuleKey | ModuleKey[];
  requiredCapabilities?: CapabilityKey[];
}

function hasModulePermission(context: TenantContext, modules?: ModuleKey[] | ModuleKey): boolean {
  if (!modules) {
    return true;
  }
  const required = Array.isArray(modules) ? modules : [modules];
  if (!required.length) {
    return true;
  }
  const userModules = context.modules ?? [];
  return required.every((module) => userModules.includes(module));
}

function hasCapabilityPermission(context: TenantContext, capabilities?: CapabilityKey[]): boolean {
  if (!capabilities || capabilities.length === 0) {
    return true;
  }
  const granted = context.capabilities ?? [];
  return capabilities.every((capability) => granted.includes(capability));
}

/**
 * Check if user can access a page
 */
export function canAccessPage(context: TenantContext, page: Page): boolean {
  const requiredModules = page.requiredModules ?? (page.moduleKey ? [page.moduleKey] : []);
  if (requiredModules.length > 0 && !hasModulePermission(context, requiredModules)) {
    return false;
  }

  if (page.requiredCapabilities && !hasCapabilityPermission(context, page.requiredCapabilities)) {
    return false;
  }

  return true;
}

/**
 * Guard middleware for page access
 */
export function guardPageAccess(context: TenantContext, page: Page): void {
  if (!canAccessPage(context, page)) {
    throw new Error(`Access denied to page: ${page.path}`);
  }
}

/**
 * Future: Feature-level access check (placeholder)
 */
export function canAccessFeature(
  context: TenantContext,
  featureId: string,
  featureConfig?: FeatureConfig
): boolean {
  if (!featureConfig) {
    return true;
  }

  if (featureConfig.modules && !hasModulePermission(context, featureConfig.modules)) {
    return false;
  }

  if (featureConfig.requiredCapabilities && !hasCapabilityPermission(context, featureConfig.requiredCapabilities)) {
    return false;
  }

  return true;
}
