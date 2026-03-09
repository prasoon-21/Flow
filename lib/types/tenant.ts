/**
 * Core types for multi-tenant system
 */

export type UserRole = 'admin' | 'agent' | 'viewer';

export type ModuleKey =
  | 'dashboard'
  | 'ivr'
  | 'email'
  | 'whatsapp'
  | 'chatbot'
  | 'automations'
  | 'contacts'
  | 'tickets'
  | 'shipping-label';

export type CapabilityKey = string;

export interface CapabilityCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'contains';
  value: unknown;
}

export interface CapabilityDefinition {
  id: CapabilityKey;
  resource: string;
  action: string;
  description?: string;
  condition?: CapabilityCondition;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  modules?: ModuleKey[];
  capabilities?: CapabilityKey[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
  passwordHash?: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: UserRole;
  modules: ModuleKey[];
  capabilities?: CapabilityKey[];
}
