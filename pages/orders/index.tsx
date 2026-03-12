import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function OrdersPage() {
  const router = useRouter();
  const ordersQuery = trpc.order.list.useQuery();
  const contactsQuery = trpc.contact.list.useQuery();
  const productsQuery = trpc.inventory.list.useQuery();
  const createMutation = trpc.order.create.useMutation();
  const pdfQuery = trpc.order.invoicePdf.useQuery(
    { orderId: router.query.pdfId as string },
    { enabled: !!router.query.pdfId }
  );

  const utils = trpc.useContext();

  const orders = ordersQuery.data?.orders ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];
  const products = productsQuery.data?.products ?? [];
  const customers = contacts.filter((c) => c.type === 'customer');

  const createContactMutation = trpc.contact.create.useMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [newContactId, setNewContactId] = useState('');
  const [newItems, setNewItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', notes: '', address: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  // Automatically open 'New Invoice' based on query
  useEffect(() => {
    if (router.query.new === 'true') {
      setShowCreate(true);
      setMobileView('detail');
    }
  }, [router.query.new]);

  const selected = useMemo(() => {
    const id = selectedId ?? orders[0]?.id;
    return orders.find((o) => o.id === id) ?? null;
  }, [orders, selectedId]);

  const contactMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of contacts) m[c.id] = c.name;
    return m;
  }, [contacts]);

  const contactPhoneMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of contacts) if (c.phone) m[c.id] = c.phone;
    return m;
  }, [contacts]);

  const productMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of products) m[p.id] = p.name;
    return m;
  }, [products]);

  const formTotal = useMemo(() => {
    return newItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  }, [newItems, products]);

  const handleCreate = async () => {
    if (!newContactId || newItems.length === 0) return;
    const res = await createMutation.mutateAsync({ contactId: newContactId, items: newItems.filter((i) => i.quantity > 0) });
    await Promise.all([utils.order.list.invalidate(), utils.inventory.list.invalidate(), utils.ledger.list.invalidate()]);
    setShowCreate(false);
    setNewContactId('');
    setNewItems([]);
    setSelectedId(res.order.id);
    setMobileView('detail');
  };

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) return;
    const res = await createContactMutation.mutateAsync({
      name: newContact.name.trim(),
      email: newContact.email.trim() || undefined,
      phone: newContact.phone.trim() || undefined,
      notes: newContact.notes.trim() || undefined,
      address: newContact.address.trim()
        ? { address1: newContact.address.trim() }
        : undefined,
    });
    await utils.contact.list.invalidate();
    setNewContactId(res.contact.id);
    setNewContact({ name: '', email: '', phone: '', notes: '', address: '' });
    setShowNewContact(false);
  };

  const handleDownloadPdf = async (base64Str: string, invoiceNumber: string) => {
    const linkSource = `data:application/pdf;base64,${base64Str}`;
    const downloadLink = document.createElement("a");
    const fileName = `Invoice_${invoiceNumber}.pdf`;
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  };

  return (
    <Layout title="Orders">
      <div className="orders-layout">
        <aside className={`order-list ${mobileView === 'list' ? 'mobile-show' : 'mobile-hide'}`}>
          <Card padding="0">
            <div className="list-header">
              <h3>Orders</h3>
              <Button size="sm" onClick={() => { setShowCreate(true); setMobileView('detail'); }}>+ New Order</Button>
            </div>
            {orders.map((o) => (
              <button
                key={o.id}
                className={`order-row ${selected?.id === o.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(o.id); setShowCreate(false); setMobileView('detail'); }}
              >
                <span className="order-id">{o.id}</span>
                <div className="order-customer-col">
                  <span className="order-customer">{contactMap[o.contactId] ?? o.contactId}</span>
                  {contactPhoneMap[o.contactId] && (
                    <span className="phone-chip">{contactPhoneMap[o.contactId]}</span>
                  )}
                </div>
                <span className="order-total">₹{o.total.toLocaleString('en-IN')}</span>
              </button>
            ))}
          </Card>
        </aside>

        <main className={`order-detail ${mobileView === 'detail' ? 'mobile-show' : 'mobile-hide'}`}>
          {showCreate ? (
            <Card>
              <button className="back-btn" onClick={() => { setShowCreate(false); setMobileView('list'); }}>← Back</button>
              <h3>New Order</h3>
              <label className="field-label">Customer</label>
              <div className="customer-picker">
                <div className="search-wrapper">
                  <input
                    className="field-input"
                    placeholder="Search by name or phone…"
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowSearchResults(true); setNewContactId(''); }}
                    onFocus={() => setShowSearchResults(true)}
                    style={{ marginBottom: 0 }}
                  />
                  {newContactId && (
                    <span className="selected-chip">
                      {contactMap[newContactId]}
                      <button className="chip-clear" onClick={() => { setNewContactId(''); setCustomerSearch(''); }}>×</button>
                    </span>
                  )}
                  {showSearchResults && !newContactId && (
                    <div className="search-results">
                      {filteredCustomers.length === 0 ? (
                        <div className="search-empty">No customers found</div>
                      ) : (
                        filteredCustomers.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            className="search-result-item"
                            onClick={() => { setNewContactId(c.id); setCustomerSearch(c.name); setShowSearchResults(false); }}
                          >
                            <span className="sr-name">{c.name}</span>
                            {c.phone && <span className="sr-phone">{c.phone}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNewContact(!showNewContact)}>
                  {showNewContact ? 'Cancel' : '+ New'}
                </Button>
              </div>

              {showNewContact && (
                <div className="new-contact-form">
                  <label className="field-label">Name *</label>
                  <input className="field-input" placeholder="Customer name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" placeholder="Email address" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                  <label className="field-label">Phone</label>
                  <input className="field-input" type="tel" placeholder="Phone number" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                  <label className="field-label">Address</label>
                  <input className="field-input" placeholder="Address" value={newContact.address} onChange={(e) => setNewContact({ ...newContact, address: e.target.value })} />
                  <label className="field-label">Notes</label>
                  <input className="field-input" placeholder="Notes (optional)" value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })} />
                  <div className="form-actions" style={{ marginTop: '8px' }}>
                    <Button size="sm" onClick={handleCreateContact} disabled={!newContact.name.trim() || createContactMutation.isLoading}>
                      {createContactMutation.isLoading ? 'Adding…' : 'Add Customer'}
                    </Button>
                  </div>
                </div>
              )}
              <label className="field-label">Items</label>
              {newItems.map((item, i) => (
                <div key={i} className="item-row">
                  <select
                    className="field-select"
                    value={item.productId}
                    onChange={(e) => {
                      const copy = [...newItems];
                      copy[i] = { ...copy[i], productId: e.target.value };
                      setNewItems(copy);
                    }}
                  >
                    <option value="">Product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                  </select>
                  <input
                    type="number" min={1} className="field-input"
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) => {
                      const copy = [...newItems];
                      copy[i] = { ...copy[i], quantity: parseInt(e.target.value) || 0 };
                      setNewItems(copy);
                    }}
                  />
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setNewItems([...newItems, { productId: '', quantity: 1 }])}>
                + Add item
              </Button>
              <div className="order-total-preview">
                Total: <strong>₹{formTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="form-actions">
                <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); setMobileView('list'); }}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating…' : 'Create Order'}
                </Button>
              </div>
            </Card>
          ) : selected ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="back-btn" onClick={() => setMobileView('list')}>← Back</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!(pdfQuery.data && router.query.pdfId === selected.id) && (
                    <Button
                      size="sm"
                      onClick={() => router.replace(`/orders?pdfId=${selected.id}`)}
                      variant="outline"
                      disabled={pdfQuery.isLoading && router.query.pdfId === selected.id}
                    >
                      {pdfQuery.isLoading && router.query.pdfId === selected.id ? 'Generating…' : 'Generate Invoice'}
                    </Button>
                  )}
                  {pdfQuery.data && router.query.pdfId === selected.id && (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPdf(pdfQuery.data.pdfBase64, selected.id)}
                    >
                      Download Invoice PDF
                    </Button>
                  )}
                </div>
              </div>
              <h2 className="detail-title">Order {selected.id}</h2>
              <p className="detail-meta">
                Customer: <strong>{contactMap[selected.contactId] ?? selected.contactId}</strong>
                &nbsp;&middot;&nbsp;
                {new Date(selected.createdAt).toLocaleDateString('en-IN')}
              </p>
              <table className="items-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td>{productMap[item.productId] ?? item.productId}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price.toLocaleString('en-IN')}</td>
                      <td>₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="order-total">
                Subtotal: ₹{selected.total.toLocaleString('en-IN')}<br />
                Total (+18% GST): <strong>₹{Math.round(selected.total * 1.18).toLocaleString('en-IN')}</strong>
              </div>

              {pdfQuery.data && router.query.pdfId === selected.id && (
                <div style={{ marginTop: '20px', padding: '12px 14px', background: '#e6fffa', border: '1px solid #319795', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px' }}>✓ Invoice Ready</strong>
                  <Button size="sm" variant="ghost" onClick={() => handleDownloadPdf(pdfQuery.data.pdfBase64, selected.id)}>
                    Save PDF to Device
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card><p className="empty">Select an order or create a new one.</p></Card>
          )}
        </main>
      </div>

      <style jsx>{`
        .orders-layout {
          display: grid; grid-template-columns: 320px 1fr; gap: 16px;
          height: 100%; min-height: 0; margin-top: 12px;
        }
        @media (max-width: 880px) { .orders-layout { grid-template-columns: 1fr; } }
        .order-list { overflow-y: auto; }
        .list-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px 10px; border-bottom: 1px solid rgba(210,216,255,0.25);
        }
        .list-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .order-row {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 10px 16px; border: none; background: none;
          cursor: pointer; text-align: left; border-bottom: 1px solid rgba(210,216,255,0.15);
          font-size: 13px; transition: background 0.15s;
        }
        .order-row:hover { background: rgba(81,98,255,0.04); }
        .order-row.active { background: rgba(81,98,255,0.08); }
        .order-id { font-weight: 600; min-width: 40px; }
        .order-customer-col { flex: 1; margin: 0 8px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .order-customer { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .phone-chip {
          display: inline-block; font-size: 11px; padding: 2px 8px;
          background: rgba(81,98,255,0.08); color: #000;
          border-radius: 12px; width: fit-content; line-height: 1.4;
        }
        .order-total { font-weight: 500; text-align: right; }
        .order-total-preview { text-align: right; font-size: 16px; margin-top: 12px; }
        .order-detail { overflow-y: auto; }
        .detail-title { margin: 0 0 4px; font-size: 18px; mt: 10px; }
        .detail-meta { color: var(--text-secondary); font-size: 13px; margin-bottom: 16px; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
        .items-table th {
          text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px;
          color: var(--text-secondary); border-bottom: 1px solid rgba(210,216,255,0.3);
        }
        .items-table td { padding: 8px 10px; border-bottom: 1px solid rgba(210,216,255,0.12); }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin: 12px 0 4px; }
        .field-select, .field-input {
          display: block; width: 100%; padding: 8px 10px; border: 1px solid rgba(210,216,255,0.4);
          border-radius: 28px; font-size: 13px; background: white; margin-bottom: 6px;
          outline: none; transition: border-color 0.15s;
        }
        .field-select:focus, .field-input:focus {
          border-color: rgba(81,98,255,0.6);
        }
        .item-row { display: flex; gap: 8px; margin-bottom: 4px; }
        .item-row .field-select { flex: 2; }
        .item-row .field-input { flex: 1; }
        .customer-picker { display: flex; gap: 8px; align-items: center; }
        .search-wrapper { flex: 1; position: relative; }
        .selected-chip {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
          padding: 4px 10px; background: rgba(81,98,255,0.08); color: var(--primary-500, #5162ff);
          border-radius: 14px; font-size: 12px; font-weight: 500;
        }
        .chip-clear {
          background: none; border: none; cursor: pointer; font-size: 14px;
          color: var(--text-secondary); padding: 0 2px; line-height: 1;
        }
        .search-results {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
          background: white; border: 1px solid rgba(210,216,255,0.5);
          border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .search-result-item {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 10px 12px; border: none; background: none;
          cursor: pointer; text-align: left; font-size: 13px;
          border-bottom: 1px solid rgba(210,216,255,0.12); transition: background 0.12s;
        }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-item:hover { background: rgba(81,98,255,0.04); }
        .sr-name { font-weight: 500; }
        .sr-phone { font-size: 12px; color: var(--text-tertiary); }
        .search-empty { padding: 10px 12px; font-size: 13px; color: var(--text-tertiary); text-align: center; }
        .customer-picker .field-select { flex: 1; margin-bottom: 0; }
        .new-contact-form {
          margin-top: 8px; padding: 12px; border-radius: 10px;
          background: rgba(81,98,255,0.04); border: 1px solid rgba(210,216,255,0.4);
        }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .empty { color: var(--text-tertiary); text-align: center; padding: 24px 0; }
        .back-btn {
          display: none;
          background: none; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: var(--primary-500, #5162ff);
          padding: 4px 0; margin-bottom: 8px;
        }
        @media (max-width: 767px) {
          .orders-layout { grid-template-columns: 1fr; }
          .mobile-hide { display: none !important; }
          .mobile-show { display: block !important; }
          .back-btn { display: block; }
          .order-row { padding: 12px 16px; min-height: 48px; }
          .field-select, .field-input { min-height: 44px; padding: 10px 12px; }
          .items-table th { font-size: 11px; padding: 6px 8px; }
          .items-table td { padding: 6px 8px; font-size: 12px; }
        }
      `}</style>
    </Layout>
  );
}
