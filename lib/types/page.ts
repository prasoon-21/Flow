/**
 * Page-level access control types
 */

import { CapabilityKey, ModuleKey } from './tenant';

export interface Page {
  id: string;
  name: string;
  path: string;
  projectKey: string;
  tenantId?: string | null; // Legacy tenancy override (unused when projectKey drives access)
  moduleKey?: ModuleKey; // Module that owns the page
  requiredModules?: ModuleKey[]; // Optional override for multi-module pages
  requiredCapabilities?: CapabilityKey[]; // Future action-level gates
  createdAt: Date;
  updatedAt: Date;
}

export type ChannelType = 'email' | 'whatsapp' | 'chatbot' | 'ivr';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  tenantId: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
