import * as purchaseRepo from '@/server/repositories/purchase.repository';
import * as inventoryService from './inventory.service';
import * as ledgerService from './ledger.service';
import * as contactRepo from '@/server/repositories/contact.repository';
import type { Purchase, PurchaseItem } from '@/data/purchases';

export function listPurchases(): Purchase[] {
  return purchaseRepo.list();
}

export function getPurchase(id: string): (Purchase & { supplierName: string }) | undefined {
  const purchase = purchaseRepo.getById(id);
  if (!purchase) return undefined;
  const contact = contactRepo.getById(purchase.supplierId);
  return { ...purchase, supplierName: contact?.name ?? 'Unknown' };
}

export interface CreatePurchaseInput {
  supplierId: string;
  items: { productId: string; quantity: number }[];
}

export function createPurchase(input: CreatePurchaseInput): Purchase {
  const resolvedItems: PurchaseItem[] = input.items.map((item) => {
    const product = inventoryService.getProduct(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    return { productId: item.productId, quantity: item.quantity, cost: product.costPrice };
  });

  const total = resolvedItems.reduce((s, i) => s + i.cost * i.quantity, 0);

  const purchase = purchaseRepo.create({
    supplierId: input.supplierId,
    items: resolvedItems,
    total,
  });

  // Increase inventory stock
  for (const item of resolvedItems) {
    inventoryService.updateStock(item.productId, item.quantity);
  }

  // Add ledger credit entry
  const contact = contactRepo.getById(input.supplierId);
  ledgerService.addEntry({
    contactId: input.supplierId,
    contactName: contact?.name ?? 'Unknown',
    type: 'credit',
    amount: total,
    reference: `Purchase ${purchase.id}`,
    date: new Date(),
  });

  return purchase;
}
