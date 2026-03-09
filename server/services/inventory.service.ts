import * as productRepo from '@/server/repositories/product.repository';
import type { Product } from '@/data/products';

export function listProducts(): Product[] {
  return productRepo.list();
}

export function getProduct(id: string): Product | undefined {
  return productRepo.getById(id);
}

export function createProduct(data: Omit<Product, 'id'>): Product {
  return productRepo.create(data);
}

export function updateStock(productId: string, delta: number): Product {
  const product = productRepo.getById(productId);
  if (!product) throw new Error(`Product ${productId} not found`);
  return productRepo.update(productId, { stock: product.stock + delta });
}
