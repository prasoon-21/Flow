import React from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Link from 'next/link';

export default function Dashboard() {
  const overviewQuery = trpc.dashboard.getOverview.useQuery(undefined, { staleTime: 60_000 });
  const d = overviewQuery.data;

  const todaysSales = d ? `₹${d.revenue.toLocaleString('en-IN')}` : '—';
  const outstanding = d ? `₹${d.outstandingPayments.toLocaleString('en-IN')}` : '—';
  const lowStockCount = d ? d.lowStock.length : 0;

  return (
    <Layout title="Dashboard">
      <div className="analytics-grid">
        <Card>
          <span className="metric-label">Today&apos;s Sales</span>
          <span className="metric-value">{todaysSales}</span>
        </Card>
        <Card>
          <span className="metric-label">Outstanding Payments</span>
          <span className="metric-value">{outstanding}</span>
        </Card>
        <Card>
          <span className="metric-label">Low Stock Products</span>
          <span className="metric-value">{lowStockCount}</span>
        </Card>
      </div>

      <div className="action-row">
        <Link href="/orders?new=true">
          <Button size="lg">+ New Order</Button>
        </Link>
        <Link href="/purchases?new=true">
          <Button size="lg">+ Add Purchase</Button>
        </Link>
      </div>

      <style jsx>{`
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
        }
        .metric-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-tertiary);
          margin-bottom: 4px;
        }
        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .action-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        @media (max-width: 767px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
