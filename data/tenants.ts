import type { Tenant } from '@/lib/types/tenant';

export const tenants: Tenant[] = [
  {
    id: 'demo-tenant',
    name: 'Aurika Flow Demo',
    slug: 'aurika-flow-demo',
    logo: undefined,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-03-01'),
    metadata: {},
  },
];
