import React, { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { TagPill } from '@/components/ui/TagPill';

export default function ContactsPage() {
  const contactsQuery = trpc.contact.list.useQuery();
  const ledgerQuery = trpc.ledger.list.useQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'activity' | 'ledger'>('activity');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const contacts = contactsQuery.data?.contacts ?? [];
  const allEntries = ledgerQuery.data?.entries ?? [];

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? contacts[0] ?? null,
    [contacts, selectedId],
  );

  const ordersQuery = trpc.order.list.useQuery();
  const purchasesQuery = trpc.purchase.list.useQuery();

  const contactActivity = useMemo(() => {
    if (!selected) return [];
    const items: { id: string; date: Date; label: string; type: string }[] = [];

    for (const o of ordersQuery.data?.orders ?? []) {
      if (o.contactId === selected.id) {
        items.push({ id: o.id, date: new Date(o.createdAt), label: `Order ${o.id} — ₹${o.total.toLocaleString('en-IN')}`, type: 'order' });
      }
    }
    for (const p of purchasesQuery.data?.purchases ?? []) {
      if (p.supplierId === selected.id) {
        items.push({ id: p.id, date: new Date(p.createdAt), label: `Purchase ${p.id} — ₹${p.total.toLocaleString('en-IN')}`, type: 'purchase' });
      }
    }
    for (const e of allEntries) {
      if (e.contactId === selected.id && e.type === 'credit') {
        items.push({ id: e.id, date: new Date(e.date), label: `Payment — ₹${e.amount.toLocaleString('en-IN')}`, type: 'payment' });
      }
    }
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selected, ordersQuery.data?.orders, purchasesQuery.data?.purchases, allEntries]);

  const contactLedger = useMemo(
    () => allEntries.filter((e) => e.contactId === selected?.id),
    [allEntries, selected?.id],
  );

  return (
    <Layout title="Contacts">
      <div className="contacts-layout">
        <aside className={`contacts-list ${mobileView === 'list' ? 'mobile-show' : 'mobile-hide'}`}>
          <Card padding="0">
            <div className="list-header">
              <h3>All Contacts</h3>
            </div>
            {contacts.map((c) => (
              <button
                key={c.id}
                className={`contact-row ${selected?.id === c.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(c.id); setTab('activity'); setMobileView('detail'); }}
              >
                <span className="contact-name">{c.name}</span>
                <TagPill
                  label={c.type === 'supplier' ? 'supplier' : 'customer'}
                  caps="title"
                  variant={c.type === 'supplier' ? 'yellow' : 'green'}
                />
              </button>
            ))}
          </Card>
        </aside>

        <main className={`contact-detail ${mobileView === 'detail' ? 'mobile-show' : 'mobile-hide'}`}>
          {selected ? (
            <Card>
              <button className="back-btn" onClick={() => setMobileView('list')}>← Back</button>
              <div className="detail-header">
                <h2>{selected.name}</h2>
                <TagPill
                  label={selected.type === 'supplier' ? 'supplier' : 'customer'}
                  caps="title"
                  variant={selected.type === 'supplier' ? 'yellow' : 'green'}
                />
              </div>
              <p className="contact-meta">{selected.email} &middot; {selected.phone}</p>
              {selected.notes && <p className="contact-notes">{selected.notes}</p>}

              <div className="tab-bar">
                <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
                  Activity
                </button>
                <button className={`tab ${tab === 'ledger' ? 'active' : ''}`} onClick={() => setTab('ledger')}>
                  Ledger
                </button>
              </div>

              {tab === 'activity' ? (
                <div className="activity-list">
                  {contactActivity.length === 0 && <p className="empty">No activity yet.</p>}
                  {contactActivity.map((a) => (
                    <div key={a.id} className="activity-row">
                      <span className="activity-type">{a.type}</span>
                      <span className="activity-label">{a.label}</span>
                      <span className="activity-date">{a.date.toLocaleDateString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="ledger-table">
                  <thead>
                    <tr><th>Date</th><th>Reference</th><th>Debit(₹)</th><th>Credit(₹)</th><th>Balance(₹)</th></tr>
                  </thead>
                  <tbody>
                    {contactLedger.length === 0 && (
                      <tr><td colSpan={5} className="empty">No ledger entries.</td></tr>
                    )}
                    {(() => {
                      let balance = 0;
                      // sort ascending for balance calculation
                      const sorted = [...contactLedger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      const entriesWithBalance = sorted.map(e => {
                        const debit = e.type === 'debit' ? e.amount : 0;
                        const credit = e.type === 'credit' ? e.amount : 0;
                        balance += debit - credit;
                        return { ...e, debit, credit, balance };
                      });

                      // reverse for display (newest first)
                      return entriesWithBalance.reverse().map((e) => (
                        <tr key={e.id}>
                          <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                          <td>{e.reference}</td>
                          <td className="debit">{e.debit > 0 ? e.debit.toLocaleString('en-IN') : '-'}</td>
                          <td className="credit">{e.credit > 0 ? e.credit.toLocaleString('en-IN') : '-'}</td>
                          <td style={{ fontWeight: 600 }}>{e.balance.toLocaleString('en-IN')}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
            </Card>
          ) : (
            <Card>
              <p className="empty">Select a contact to view details.</p>
            </Card>
          )}
        </main>
      </div>

      <style jsx>{`
        .contacts-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          height: 100%;
          min-height: 0;
          margin-top: 12px;
        }
        @media (max-width: 880px) {
          .contacts-layout { grid-template-columns: 1fr; }
        }
        .contacts-list { overflow-y: auto; }
        .list-header {
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(210,216,255,0.25);
        }
        .list-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .contact-row {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 12px 16px; border: none; background: none;
          cursor: pointer; text-align: left; border-bottom: 1px solid rgba(210,216,255,0.15);
          transition: background 0.15s;
        }
        .contact-row:hover { background: rgba(81,98,255,0.04); }
        .contact-row.active { background: rgba(81,98,255,0.08); }
        .contact-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .contact-detail { overflow-y: auto; }
        .detail-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .detail-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
        .contact-meta { color: var(--text-secondary); font-size: 13px; margin: 4px 0 8px; }
        .contact-notes { color: var(--text-tertiary); font-size: 13px; margin-bottom: 12px; }
        .tab-bar {
          display: flex; gap: 0; border-bottom: 1px solid rgba(210,216,255,0.25);
          margin-bottom: 12px;
        }
        .tab {
          padding: 8px 18px; border: none; background: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: var(--text-secondary);
          border-bottom: 2px solid transparent; transition: all 0.15s;
        }
        .tab.active { color: var(--primary-500); border-bottom-color: var(--primary-500); }
        .activity-list { display: flex; flex-direction: column; gap: 6px; }
        .activity-row {
          display: flex; align-items: center; gap: 10px; padding: 8px 0;
          border-bottom: 1px solid rgba(210,216,255,0.12); font-size: 13px;
        }
        .activity-type {
          text-transform: capitalize; font-weight: 500; min-width: 70px;
          color: var(--text-secondary);
        }
        .activity-label { flex: 1; color: var(--text-primary); }
        .activity-date { color: var(--text-tertiary); font-size: 12px; }
        .ledger-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ledger-table th {
          text-align: left; padding: 8px 10px; font-weight: 600;
          border-bottom: 1px solid rgba(210,216,255,0.3); color: var(--text-secondary); font-size: 12px;
        }
        .ledger-table td { padding: 8px 10px; border-bottom: 1px solid rgba(210,216,255,0.12); }
        .credit { color: #16a34a; }
        .debit { color: #dc2626; }
        .empty { color: var(--text-tertiary); text-align: center; padding: 24px 0; }

        .back-btn {
          display: none;
          background: none; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: var(--primary-500, #5162ff);
          padding: 4px 0; margin-bottom: 8px;
        }

        @media (max-width: 767px) {
          .contacts-layout { grid-template-columns: 1fr; }
          .mobile-hide { display: none !important; }
          .mobile-show { display: block !important; }
          .back-btn { display: block; }
          .contact-row { padding: 14px 16px; min-height: 48px; }
          .activity-row { padding: 10px 0; }
          .ledger-table th { font-size: 11px; padding: 6px 8px; }
          .ledger-table td { padding: 6px 8px; font-size: 12px; }
        }
      `}</style>
    </Layout>
  );
}
