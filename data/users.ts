import type { User } from '@/lib/types/tenant';

/**
 * Hardcoded demo users for Aurika Flow MVP.
 * Password for all users: demo123
 */
export const users: User[] = [
  {
    id: 'demo-admin',
    email: 'admin@aurikaflow.demo',
    name: 'Demo Admin',
    role: 'admin',
    modules: ['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'automations', 'contacts', 'tickets', 'shipping-label'],
    capabilities: [],
    tenantId: 'demo-tenant',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-03-01'),
    passwordHash: '$2a$10$9uyMRdE9s8J8b8zDyA40suqs8w/gUAct.iCcY69fsT6EibyN50Zey',
  },
  {
    id: 'demo-agent',
    email: 'agent@aurikaflow.demo',
    name: 'Demo Agent',
    role: 'agent',
    modules: ['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'contacts', 'tickets', 'shipping-label'],
    capabilities: [],
    tenantId: 'demo-tenant',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-03-01'),
    passwordHash: '$2a$10$9uyMRdE9s8J8b8zDyA40suqs8w/gUAct.iCcY69fsT6EibyN50Zey',
  },
];
