import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { TagPill } from '@/components/ui/TagPill';

export default function LedgerPage() {
  const entriesQuery = trpc.ledger.list.useQuery();
  const balancesQuery = trpc.ledger.balances.useQuery();

  const entries = entriesQuery.data?.entries ?? [];
  const balances = balancesQuery.data?.balances ?? [];

  const [tab, setTab] = useState<'transactions' | 'balances'>('transactions');

  return (
    <Layout title="Ledger">
      <div className="tabs">
        <button className={`tab ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
          Transactions
        </button>
        <button className={`tab ${tab === 'balances' ? 'active' : ''}`} onClick={() => setTab('balances')}>
          Balances
        </button>
      </div>

      {tab === 'transactions' ? (
        <>
          {/* Desktop table */}
          <div className="desktop-view">
            <Card>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Contact</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td>{e.contactName}</td>
                      <td>{e.reference}</td>
                      <td>
                        <TagPill label={e.type} />
                      </td>
                      <td className={`amount ${e.type}`}>
                        {e.type === 'debit' ? '-' : '+'}₹{e.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={5} className="empty">No ledger entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
          {/* Mobile card view */}
          <div className="mobile-view">
            {entries.length === 0 && <Card><p className="empty">No ledger entries yet.</p></Card>}
            {entries.map((e) => (
              <Card key={e.id}>
                <div className="m-txn-row">
                  <div className="m-txn-left">
                    <span className="m-txn-contact">{e.contactName}</span>
                    <span className="m-txn-ref">{e.reference} &middot; {new Date(e.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="m-txn-right">
                    <span className={`m-txn-amount ${e.type}`}>
                      {e.type === 'debit' ? '-' : '+'}₹{e.amount.toLocaleString('en-IN')}
                    </span>
                    <TagPill label={e.type} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Desktop table */}
          <div className="desktop-view">
            <Card>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((b) => (
                    <tr key={b.contactId}>
                      <td>{b.contactName}</td>
                      <td className={`amount ${b.balance >= 0 ? 'debit' : 'credit'}`} style={{ textAlign: 'right' }}>
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
          {/* Mobile card view */}
          <div className="mobile-view">
            {balances.length === 0 && <Card><p className="empty">No balances yet.</p></Card>}
            {balances.map((b) => (
              <Card key={b.contactId}>
                <div className="m-txn-row">
                  <span className="m-txn-contact">{b.contactName}</span>
                  <span className={`m-txn-amount ${b.balance >= 0 ? 'debit' : 'credit'}`}>
                    {b.balance >= 0 ? '' : '-'}₹{Math.abs(b.balance).toLocaleString('en-IN')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .tabs {
          display: flex; gap: 4px; margin-bottom: 16px;
        }
        .tab {
          padding: 8px 18px; border: none; background: rgba(210,216,255,0.12);
          border-radius: 8px 8px 0 0; cursor: pointer; font-size: 13px; font-weight: 600;
          color: var(--text-secondary); transition: background 0.15s;
        }
        .tab.active { background: rgba(81,98,255,0.1); color: var(--brand); }
        .tab:hover { background: rgba(81,98,255,0.06); }
        .ledger-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ledger-table th {
          text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px;
          color: var(--text-secondary); border-bottom: 1px solid rgba(210,216,255,0.3);
        }
        .ledger-table td { padding: 10px 12px; border-bottom: 1px solid rgba(210,216,255,0.12); }
        .amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
        .amount.debit { color: #e53e3e; }
        .amount.credit { color: #38a169; }
        .empty { text-align: center; padding: 24px 0; color: var(--text-tertiary); }

        .mobile-view { display: none; }
        .m-txn-row { display: flex; justify-content: space-between; align-items: center; }
        .m-txn-left { display: flex; flex-direction: column; gap: 2px; }
        .m-txn-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .m-txn-contact { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .m-txn-ref { font-size: 12px; color: var(--text-tertiary); }
        .m-txn-amount { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .m-txn-amount.debit { color: #e53e3e; }
        .m-txn-amount.credit { color: #38a169; }

        @media (max-width: 767px) {
          .desktop-view { display: none; }
          .mobile-view { display: flex; flex-direction: column; gap: 8px; }
          .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .tab { min-height: 44px; padding: 10px 20px; font-size: 14px; }
        }
      `}</style>
    </Layout>
  );
}
