import type { Page } from '@/lib/types/page';

/**
 * Hardcoded page definitions for Aurika Flow MVP.
 * All pages use projectKey 'engage' to match existing config.
 */
export const pages: Page[] = [
  { id: 'pg-home', name: 'Dashboard', path: '/', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-contacts', name: 'Contacts', path: '/contacts', projectKey: 'engage', moduleKey: 'contacts', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-orders', name: 'Orders', path: '/orders', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-inventory', name: 'Inventory', path: '/inventory', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-purchases', name: 'Purchases', path: '/purchases', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-ledger', name: 'Ledger', path: '/ledger', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-reports', name: 'Reports', path: '/reports', projectKey: 'engage', moduleKey: 'dashboard', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-settings', name: 'Settings', path: '/settings', projectKey: 'engage', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-settings-tags', name: 'Tag Settings', path: '/settings/tags', projectKey: 'engage', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'pg-settings-notifications', name: 'Notification Settings', path: '/settings/notifications', projectKey: 'engage', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
];
