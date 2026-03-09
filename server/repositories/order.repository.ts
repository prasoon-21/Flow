import { orders as seed, Order } from '@/data/orders';

const store: Order[] = seed.map((o) => ({ ...o }));
let counter = store.length;

export function list(): Order[] {
  return store;
}

export function getById(id: string): Order | undefined {
  return store.find((o) => o.id === id);
}

export function create(data: Omit<Order, 'id' | 'createdAt'>): Order {
  counter++;
  const order: Order = { ...data, id: `o${counter}`, createdAt: new Date() };
  store.push(order);
  return order;
}

export function update(id: string, data: Partial<Order>): Order {
  const idx = store.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error('Order not found');
  store[idx] = { ...store[idx], ...data };
  return store[idx];
}
