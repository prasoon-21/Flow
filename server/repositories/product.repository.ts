import { products as seed, Product } from '@/data/products';

const store: Product[] = seed.map((p) => ({ ...p }));

export function list(): Product[] {
  return store;
}

export function getById(id: string): Product | undefined {
  return store.find((p) => p.id === id);
}

export function create(data: Omit<Product, 'id'>): Product {
  const product: Product = { ...data, id: `p${Date.now()}` };
  store.push(product);
  return product;
}

export function update(id: string, data: Partial<Product>): Product {
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Product not found');
  store[idx] = { ...store[idx], ...data };
  return store[idx];
}
