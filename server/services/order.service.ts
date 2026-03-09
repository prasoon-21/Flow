import * as orderRepo from '@/server/repositories/order.repository';
import * as inventoryService from './inventory.service';
import * as ledgerService from './ledger.service';
import * as contactRepo from '@/server/repositories/contact.repository';
import type { Order, OrderItem } from '@/data/orders';

export function listOrders(): Order[] {
  return orderRepo.list();
}

export function getOrder(id: string): (Order & { contactName: string }) | undefined {
  const order = orderRepo.getById(id);
  if (!order) return undefined;
  const contact = contactRepo.getById(order.contactId);
  return { ...order, contactName: contact?.name ?? 'Unknown' };
}

export interface CreateOrderInput {
  contactId: string;
  items: { productId: string; quantity: number }[];
}

export function createOrder(input: CreateOrderInput): Order {
  const resolvedItems: OrderItem[] = input.items.map((item) => {
    const product = inventoryService.getProduct(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    return { productId: item.productId, quantity: item.quantity, price: product.price };
  });

  const total = resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const order = orderRepo.create({
    contactId: input.contactId,
    items: resolvedItems,
    total,
    status: 'created',
  });

  // Reduce inventory stock
  for (const item of resolvedItems) {
    inventoryService.updateStock(item.productId, -item.quantity);
  }

  // Add ledger debit entry
  const contact = contactRepo.getById(input.contactId);
  ledgerService.addEntry({
    contactId: input.contactId,
    contactName: contact?.name ?? 'Unknown',
    type: 'debit',
    amount: total,
    reference: `Order ${order.id}`,
    date: new Date(),
  });

  return order;
}
