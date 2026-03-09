export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  contactId: string;
  items: OrderItem[];
  total: number;
  status: 'created';
  createdAt: Date;
}

export const orders: Order[] = [
  {
    id: 'o1', contactId: 'c1',
    items: [
      { productId: 'p1', quantity: 50, price: 799 },
      { productId: 'p3', quantity: 20, price: 3499 },
    ],
    total: 109930, status: 'created', createdAt: new Date('2026-02-10'),
  },
  {
    id: 'o2', contactId: 'c2',
    items: [{ productId: 'p4', quantity: 100, price: 1299 }],
    total: 129900, status: 'created', createdAt: new Date('2026-02-25'),
  },
  {
    id: 'o3', contactId: 'c4',
    items: [
      { productId: 'p2', quantity: 10, price: 2499 },
      { productId: 'p6', quantity: 10, price: 1899 },
    ],
    total: 43980, status: 'created', createdAt: new Date('2026-03-01'),
  },
  {
    id: 'o4', contactId: 'c6',
    items: [{ productId: 'p5', quantity: 30, price: 1999 }],
    total: 59970, status: 'created', createdAt: new Date('2026-03-05'),
  },
  {
    id: 'o5', contactId: 'c1',
    items: [
      { productId: 'p4', quantity: 40, price: 1299 },
      { productId: 'p1', quantity: 30, price: 799 },
    ],
    total: 75930, status: 'created', createdAt: new Date('2026-03-07'),
  },
];
