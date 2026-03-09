import React from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';

export default function InventoryPage() {
  const productsQuery = trpc.inventory.list.useQuery();
  const products = productsQuery.data?.products ?? [];

  return (
    <Layout title="Inventory">
      {/* Desktop table view */}
      <div className="desktop-view">
        <Card>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Stock</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="name">{p.name}</td>
                  <td className="sku">{p.sku}</td>
                  <td>₹{p.price.toLocaleString('en-IN')}</td>
                  <td>₹{p.costPrice.toLocaleString('en-IN')}</td>
                  <td>{p.stock}</td>
                  <td>₹{(p.costPrice * p.stock).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile card view */}
      <div className="mobile-view">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="m-product-head">
              <span className="m-product-name">{p.name}</span>
              <span className="m-product-sku">{p.sku}</span>
            </div>
            <div className="m-product-grid">
              <div className="m-product-stat">
                <span className="m-stat-label">Price</span>
                <span className="m-stat-value">₹{p.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="m-product-stat">
                <span className="m-stat-label">Cost</span>
                <span className="m-stat-value">₹{p.costPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="m-product-stat">
                <span className="m-stat-label">Stock</span>
                <span className="m-stat-value">{p.stock}</span>
              </div>
              <div className="m-product-stat">
                <span className="m-stat-label">Value</span>
                <span className="m-stat-value">₹{(p.costPrice * p.stock).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <style jsx>{`
        .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .inv-table th {
          text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px;
          color: var(--text-secondary); border-bottom: 1px solid rgba(210,216,255,0.3);
        }
        .inv-table td {
          padding: 10px 12px; border-bottom: 1px solid rgba(210,216,255,0.12);
        }
        .name { font-weight: 500; color: var(--text-primary); }
        .sku { color: var(--text-tertiary); font-family: monospace; font-size: 12px; }

        .mobile-view { display: none; }

        .m-product-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .m-product-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .m-product-sku { font-size: 12px; color: var(--text-tertiary); font-family: monospace; }
        .m-product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .m-product-stat { display: flex; flex-direction: column; }
        .m-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); }
        .m-stat-value { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-top: 2px; }

        @media (max-width: 767px) {
          .desktop-view { display: none; }
          .mobile-view {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </Layout>
  );
}
