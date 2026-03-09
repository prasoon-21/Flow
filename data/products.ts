export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
}

export const products: Product[] = [
  { id: 'p1', name: 'Wireless Mouse', sku: 'WM-001', price: 799, costPrice: 450, stock: 120, category: 'Accessories' },
  { id: 'p2', name: 'USB-C Hub 7-in-1', sku: 'HUB-007', price: 2499, costPrice: 1400, stock: 65, category: 'Accessories' },
  { id: 'p3', name: 'Mechanical Keyboard', sku: 'KB-MK01', price: 3499, costPrice: 2100, stock: 45, category: 'Peripherals' },
  { id: 'p4', name: 'LED Desk Lamp', sku: 'DL-LED1', price: 1299, costPrice: 700, stock: 200, category: 'Lighting' },
  { id: 'p5', name: 'Webcam HD 1080p', sku: 'WC-1080', price: 1999, costPrice: 1100, stock: 80, category: 'Peripherals' },
  { id: 'p6', name: 'Laptop Stand Aluminium', sku: 'LS-ALU1', price: 1899, costPrice: 950, stock: 150, category: 'Accessories' },
];
