/**
 * Dashboard Router — Aurika Flow overview with hardcoded summary data
 */

import { router, protectedProcedure } from '../trpc';
import { orders } from '@/data/orders';
import { products } from '@/data/products';
import { purchases } from '@/data/purchases';
import { ledger } from '@/data/ledger';
import { contacts } from '@/data/contacts';

export const dashboardRouter = router({
  getOverview: protectedProcedure.query(async () => {
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPurchases = purchases.length;
    const purchaseSpend = purchases.reduce((sum, p) => sum + p.total, 0);
    const debits = ledger.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    const credits = ledger.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
    const outstanding = debits - credits;
    const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
    const totalProducts = products.length;
    const totalContacts = contacts.length;
    const grossMargin = revenue - orders.reduce((sum, o) => {
      return sum + o.items.reduce((is, item) => {
        const prod = products.find((p) => p.id === item.productId);
        return is + (prod?.costPrice ?? 0) * item.quantity;
      }, 0);
    }, 0);

    // Recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        contactName: contacts.find((c) => c.id === o.contactId)?.name ?? o.contactId,
        total: o.total,
        date: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      }));

    // Top products by quantity sold
    const soldMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const p = products.find((pr) => pr.id === item.productId);
        const name = p?.name ?? item.productId;
        if (!soldMap[item.productId]) soldMap[item.productId] = { name, qty: 0, revenue: 0 };
        soldMap[item.productId].qty += item.quantity;
        soldMap[item.productId].revenue += item.price * item.quantity;
      }
    }
    const topProducts = Object.values(soldMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Low stock products (stock < 80)
    const lowStock = products
      .filter((p) => p.stock < 80)
      .sort((a, b) => a.stock - b.stock)
      .map((p) => ({ name: p.name, sku: p.sku, stock: p.stock }));

    // Recent ledger entries (last 5)
    const recentLedger = [...ledger]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        contactName: e.contactName,
        type: e.type,
        amount: e.amount,
        reference: e.reference,
        date: e.date,
      }));

    return {
      totalOrders,
      revenue: Math.round(revenue),
      totalPurchases,
      purchaseSpend: Math.round(purchaseSpend),
      outstandingPayments: Math.round(outstanding),
      inventoryValue: Math.round(inventoryValue),
      totalProducts,
      totalContacts,
      grossMargin: Math.round(grossMargin),
      recentOrders,
      topProducts,
      lowStock,
      recentLedger,
    };
  }),
});
