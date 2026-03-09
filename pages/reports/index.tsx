import React, { useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';

export default function ReportsPage() {
  const ordersQuery = trpc.order.list.useQuery();
  const purchasesQuery = trpc.purchase.list.useQuery();
  const productsQuery = trpc.inventory.list.useQuery();
  const balancesQuery = trpc.ledger.balances.useQuery();

  const orders = ordersQuery.data?.orders ?? [];
  const purchases = purchasesQuery.data?.purchases ?? [];
  const products = productsQuery.data?.products ?? [];
  const balances = balancesQuery.data?.balances ?? [];

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const totalPurchases = useMemo(() => purchases.reduce((s, p) => s + p.total, 0), [purchases]);
  const inventoryValue = useMemo(() => products.reduce((s, p) => s + p.stock * p.costPrice, 0), [products]);
  const outstandingBalance = useMemo(() => balances.reduce((s, b) => s + b.balance, 0), [balances]);

  const topProducts = useMemo(() => {
    const sold: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const p = products.find((pr) => pr.id === item.productId);
        const name = p?.name ?? item.productId;
        if (!sold[item.productId]) sold[item.productId] = { name, qty: 0, revenue: 0 };
        sold[item.productId].qty += item.quantity;
        sold[item.productId].revenue += item.price * item.quantity;
      }
    }
    return Object.values(sold).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, products]);

  return (
    <Layout title="Reports">
      <div className="stats-grid">
        <Card>
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</span>
        </Card>
        <Card>
          <span className="stat-label">Total Purchases</span>
          <span className="stat-value">₹{totalPurchases.toLocaleString('en-IN')}</span>
        </Card>
        <Card>
          <span className="stat-label">Inventory Value</span>
          <span className="stat-value">₹{inventoryValue.toLocaleString('en-IN')}</span>
        </Card>
        <Card>
          <span className="stat-label">Outstanding</span>
          <span className="stat-value">₹{outstandingBalance.toLocaleString('en-IN')}</span>
        </Card>
      </div>

      <div className="report-grid">
        <Card>
          <h3 className="section-title">Top Products by Revenue</h3>
          <table className="report-table">
            <thead>
              <tr><th>Product</th><th>Qty Sold</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.qty}</td>
                  <td className="num">₹{p.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr><td colSpan={3} className="empty">No sales data yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 className="section-title">Balance by Contact</h3>
          <table className="report-table">
            <thead>
              <tr><th>Contact</th><th style={{ textAlign: 'right' }}>Balance</th></tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.contactId}>
                  <td>{b.contactName}</td>
                  <td className={`num ${b.balance >= 0 ? 'debit' : 'credit'}`}>
                    {b.balance >= 0 ? '' : '-'}₹{Math.abs(b.balance).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {balances.length === 0 && (
                <tr><td colSpan={2} className="empty">No balances yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <style jsx>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
        .stat-value { font-size: 22px; font-weight: 700; }
        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 880px) { .report-grid { grid-template-columns: 1fr; } }
        .section-title { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-table th {
          text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px;
          color: var(--text-secondary); border-bottom: 1px solid rgba(210,216,255,0.3);
        }
        .report-table td { padding: 8px 10px; border-bottom: 1px solid rgba(210,216,255,0.12); }
        .num { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
        .num.debit { color: #e53e3e; }
        .num.credit { color: #38a169; }
        .empty { text-align: center; padding: 16px 0; color: var(--text-tertiary); }

        @media (max-width: 767px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
          .stat-label { font-size: 11px; }
          .stat-value { font-size: 18px; }
          .report-grid { grid-template-columns: 1fr; gap: 12px; }
          .report-table th { font-size: 11px; padding: 6px 8px; }
          .report-table td { padding: 6px 8px; font-size: 12px; }
        }
      `}</style>
    </Layout>
  );
}
