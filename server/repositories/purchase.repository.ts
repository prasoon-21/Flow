import { purchases as seed, Purchase } from '@/data/purchases';

const store: Purchase[] = seed.map((p) => ({ ...p }));
let counter = store.length;

export function list(): Purchase[] {
  return store;
}

export function getById(id: string): Purchase | undefined {
  return store.find((p) => p.id === id);
}

export function create(data: Omit<Purchase, 'id' | 'createdAt'>): Purchase {
  counter++;
  const purchase: Purchase = { ...data, id: `pu${counter}`, createdAt: new Date() };
  store.push(purchase);
  return purchase;
}
