export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  createdAt: Date;
}

export const purchases: Purchase[] = [
  {
    id: 'pu1', supplierId: 'c3',
    items: [
      { productId: 'p1', quantity: 200, cost: 450 },
      { productId: 'p5', quantity: 100, cost: 1100 },
    ],
    total: 200000, createdAt: new Date('2026-01-15'),
  },
  {
    id: 'pu2', supplierId: 'c5',
    items: [{ productId: 'p6', quantity: 150, cost: 950 }],
    total: 142500, createdAt: new Date('2026-02-28'),
  },
  {
    id: 'pu3', supplierId: 'c3',
    items: [
      { productId: 'p2', quantity: 80, cost: 1400 },
      { productId: 'p3', quantity: 60, cost: 2100 },
    ],
    total: 238000, createdAt: new Date('2026-03-06'),
  },
];
