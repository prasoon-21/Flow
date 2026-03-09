export interface TagRecord {
  id: string;
  name: string;
  slug: string;
  scopes: string[];
  category: string | null;
  color: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const tags: TagRecord[] = [
  { id: 't1', name: 'Wholesale', slug: 'wholesale', scopes: ['contact'], category: 'Customer Type', color: '#5162ff', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { id: 't2', name: 'Retail', slug: 'retail', scopes: ['contact'], category: 'Customer Type', color: '#32c98d', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { id: 't3', name: 'Priority', slug: 'priority', scopes: ['contact'], category: 'Status', color: '#ffb74a', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { id: 't4', name: 'Supplier', slug: 'supplier', scopes: ['contact'], category: 'Role', color: '#4d9bff', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { id: 't5', name: 'Electronics', slug: 'electronics', scopes: ['contact'], category: 'Industry', color: '#ff6b6b', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { id: 't6', name: 'Packaging', slug: 'packaging', scopes: ['contact'], category: 'Industry', color: '#a7b0d6', archived: false, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
];
