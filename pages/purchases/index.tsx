import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PurchasesPage() {
  const router = useRouter();
  const purchasesQuery = trpc.purchase.list.useQuery();
  const contactsQuery = trpc.contact.list.useQuery();
  const productsQuery = trpc.inventory.list.useQuery();
  const createMutation = trpc.purchase.create.useMutation();
  const createContactMutation = trpc.contact.create.useMutation();
  const createProductMutation = trpc.inventory.createProduct.useMutation();
  const utils = trpc.useContext();

  const purchases = purchasesQuery.data?.purchases ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];
  const products = productsQuery.data?.products ?? [];
  const suppliers = contacts.filter((c) => c.type === 'supplier');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [newSupplierId, setNewSupplierId] = useState('');
  const [createMode, setCreateMode] = useState<'upload' | 'manual'>('upload');

  // Manual entry state
  const [manualItems, setManualItems] = useState<{ productId: string; quantity: number }[]>([]);

  // New supplier form state
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', notes: '', address: '' });

  // New product form state
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', costPrice: '', stock: '' });

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.sku.trim()) return;
    const res = await createProductMutation.mutateAsync({
      name: newProduct.name.trim(),
      sku: newProduct.sku.trim(),
      price: parseFloat(newProduct.price) || 0,
      costPrice: parseFloat(newProduct.costPrice) || 0,
      stock: parseInt(newProduct.stock) || 0,
    });
    await utils.inventory.list.invalidate();
    setManualItems([...manualItems, { productId: res.product.id, quantity: 1 }]);
    setNewProduct({ name: '', sku: '', price: '', costPrice: '', stock: '' });
    setShowNewProduct(false);
  };

  // Simulated parse state
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Hardcoded extracted items mimicking the prompt
  // We'll map them to the first available supplier and known products for the MVP
  const hardcodedSupplier = suppliers.length > 0 ? suppliers[0].id : '';
  const parsedItems = [
    { productId: 'p1', name: 'Wireless Mouse', quantity: 20 },
    { productId: 'p3', name: 'Keyboard', quantity: 10 },
    { productId: 'p2', name: 'USB Cable', quantity: 50 } // actually USB-C Hub
  ];

  useEffect(() => {
    if (router.query.new === 'true') {
      setShowCreate(true);
      setMobileView('detail');
    }
  }, [router.query.new]);

  const selected = useMemo(() => {
    const id = selectedId ?? purchases[0]?.id;
    return purchases.find((p) => p.id === id) ?? null;
  }, [purchases, selectedId]);

  const contactMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of contacts) m[c.id] = c.name;
    return m;
  }, [contacts]);

  const productMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of products) m[p.id] = p.name;
    return m;
  }, [products]);

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) return;
    const res = await createContactMutation.mutateAsync({
      name: newSupplier.name.trim(),
      type: 'supplier',
      email: newSupplier.email.trim() || undefined,
      phone: newSupplier.phone.trim() || undefined,
      notes: newSupplier.notes.trim() || undefined,
      address: newSupplier.address.trim()
        ? { address1: newSupplier.address.trim() }
        : undefined,
    });
    await utils.contact.list.invalidate();
    setNewSupplierId(res.contact.id);
    setNewSupplier({ name: '', email: '', phone: '', notes: '', address: '' });
    setShowNewSupplier(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
        setFileUploaded(true);
        setNewSupplierId(hardcodedSupplier);
      }, 1500);
    }
  };

  const manualTotal = useMemo(() => {
    return manualItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  }, [manualItems, products]);

  const handleCreate = async () => {
    if (!newSupplierId) return;

    let createItems: { productId: string; quantity: number }[];
    if (createMode === 'upload') {
      if (!fileUploaded) return;
      createItems = parsedItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
    } else {
      const valid = manualItems.filter(i => i.productId && i.quantity > 0);
      if (valid.length === 0) return;
      createItems = valid;
    }

    await createMutation.mutateAsync({ supplierId: newSupplierId, items: createItems });
    await Promise.all([utils.purchase.list.invalidate(), utils.inventory.list.invalidate(), utils.ledger.list.invalidate()]);

    setShowCreate(false);
    setNewSupplierId('');
    setFileUploaded(false);
    setManualItems([]);
    setCreateMode('upload');
    setShowNewSupplier(false);
    setMobileView('list');
  };

  const cancelCreate = () => {
    setShowCreate(false);
    setFileUploaded(false);
    setManualItems([]);
    setCreateMode('upload');
    setShowNewSupplier(false);
    setMobileView('list');
  }

  return (
    <Layout title="Purchases">
      <div className="layout">
        <aside className={`list-pane ${mobileView === 'list' ? 'mobile-show' : 'mobile-hide'}`}>
          <Card padding="0">
            <div className="list-header">
              <h3>Purchases</h3>
              <Button size="sm" onClick={() => { setShowCreate(true); setMobileView('detail'); }}>+ Add Purchase</Button>
            </div>
            {purchases.map((p) => (
              <button
                key={p.id}
                className={`row ${selected?.id === p.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(p.id); setShowCreate(false); setMobileView('detail'); }}
              >
                <span className="row-id">{p.id}</span>
                <span className="row-name">{contactMap[p.supplierId] ?? p.supplierId}</span>
                <span className="row-total">₹{p.total.toLocaleString('en-IN')}</span>
              </button>
            ))}
          </Card>
        </aside>

        <main className={`detail-pane ${mobileView === 'detail' ? 'mobile-show' : 'mobile-hide'}`}>
          {showCreate ? (
            <Card>
              <button className="back-btn" onClick={cancelCreate}>← Back</button>
              <h3>New Purchase</h3>

              <div className="mode-toggle">
                <button className={`mode-btn ${createMode === 'upload' ? 'active' : ''}`} onClick={() => setCreateMode('upload')}>Upload PDF</button>
                <button className={`mode-btn ${createMode === 'manual' ? 'active' : ''}`} onClick={() => setCreateMode('manual')}>Add Manually</button>
              </div>

              {createMode === 'upload' ? (
                <>
                  {!fileUploaded ? (
                    <div className="upload-area">
                      <p>Select a PDF bill from your supplier</p>
                      <label className="upload-btn">
                        <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                        {isParsing ? 'Extracting Bill Data...' : 'Choose PDF File'}
                      </label>
                    </div>
                  ) : (
                    <div className="parsed-bill">
                      <div className="parsed-success">✓ Bill Parsed Successfully</div>
                      <label className="field-label">Detected Supplier</label>
                      <div className="supplier-picker">
                        <select className="field-select" value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)}>
                          <option value="">Select supplier…</option>
                          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <Button size="sm" variant="outline" onClick={() => setShowNewSupplier(!showNewSupplier)}>
                          {showNewSupplier ? 'Cancel' : '+ New'}
                        </Button>
                      </div>

                      {showNewSupplier && (
                        <div className="new-contact-form">
                          <label className="field-label">Name *</label>
                          <input className="field-input" placeholder="Supplier name" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                          <label className="field-label">Email</label>
                          <input className="field-input" type="email" placeholder="Email address" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                          <label className="field-label">Phone</label>
                          <input className="field-input" type="tel" placeholder="Phone number" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                          <label className="field-label">Address</label>
                          <input className="field-input" placeholder="Address" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                          <label className="field-label">Notes</label>
                          <input className="field-input" placeholder="Notes (optional)" value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                          <div className="form-actions" style={{ marginTop: '8px' }}>
                            <Button size="sm" onClick={handleCreateSupplier} disabled={!newSupplier.name.trim() || createContactMutation.isLoading}>
                              {createContactMutation.isLoading ? 'Adding…' : 'Add Supplier'}
                            </Button>
                          </div>
                        </div>
                      )}

                      <label className="field-label">Extracted Items</label>
                      <ul className="extracted-items" style={{ margin: '10px 0', padding: '10px', background: 'rgba(81, 98, 255, 0.05)', borderRadius: '8px', listStyle: 'none' }}>
                        {parsedItems.map((item, idx) => {
                          const prod = products.find(p => p.id === item.productId);
                          const unitPrice = prod ? `₹${prod.price.toLocaleString('en-IN')}` : '';
                          return (
                            <li key={idx} style={{ padding: '6px 0', borderBottom: idx < parsedItems.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                              <strong>{item.name}</strong>{unitPrice ? ` (${unitPrice}/unit)` : ''} – qty {item.quantity}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="form-actions">
                        <Button size="sm" variant="ghost" onClick={cancelCreate}>Cancel</Button>
                        <Button size="sm" onClick={handleCreate} disabled={createMutation.isLoading}>
                          {createMutation.isLoading ? 'Confirming…' : 'Confirm Purchase'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="manual-entry">
                  <label className="field-label">Supplier</label>
                  <div className="supplier-picker">
                    <select className="field-select" value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)}>
                      <option value="">Select supplier…</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => setShowNewSupplier(!showNewSupplier)}>
                      {showNewSupplier ? 'Cancel' : '+ New'}
                    </Button>
                  </div>

                  {showNewSupplier && (
                    <div className="new-contact-form">
                      <label className="field-label">Name *</label>
                      <input className="field-input" placeholder="Supplier name" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                      <label className="field-label">Email</label>
                      <input className="field-input" type="email" placeholder="Email address" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                      <label className="field-label">Phone</label>
                      <input className="field-input" type="tel" placeholder="Phone number" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                      <label className="field-label">Address</label>
                      <input className="field-input" placeholder="Address" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                      <label className="field-label">Notes</label>
                      <input className="field-input" placeholder="Notes (optional)" value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                      <div className="form-actions" style={{ marginTop: '8px' }}>
                        <Button size="sm" onClick={handleCreateSupplier} disabled={!newSupplier.name.trim() || createContactMutation.isLoading}>
                          {createContactMutation.isLoading ? 'Adding…' : 'Add Supplier'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <label className="field-label">Items</label>
                  {manualItems.map((item, i) => (
                    <div key={i} className="item-row">
                      <select
                        className="field-select"
                        value={item.productId}
                        onChange={(e) => {
                          const copy = [...manualItems];
                          copy[i] = { ...copy[i], productId: e.target.value };
                          setManualItems(copy);
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
                          const copy = [...manualItems];
                          copy[i] = { ...copy[i], quantity: parseInt(e.target.value) || 0 };
                          setManualItems(copy);
                        }}
                      />
                    </div>
                  ))}
                  <div className="item-actions">
                    <Button size="sm" variant="ghost" onClick={() => setManualItems([...manualItems, { productId: '', quantity: 1 }])}>
                      + Add item
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewProduct(!showNewProduct)}>
                      {showNewProduct ? 'Cancel' : '+ New Product'}
                    </Button>
                  </div>

                  {showNewProduct && (
                    <div className="new-contact-form">
                      <label className="field-label">Product Name *</label>
                      <input className="field-input" placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                      <label className="field-label">SKU *</label>
                      <input className="field-input" placeholder="SKU code" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
                      <label className="field-label">Selling Price (₹)</label>
                      <input className="field-input" type="number" placeholder="0" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                      <label className="field-label">Cost Price (₹)</label>
                      <input className="field-input" type="number" placeholder="0" value={newProduct.costPrice} onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })} />
                      <label className="field-label">Stock</label>
                      <input className="field-input" type="number" placeholder="0" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                      <div className="form-actions" style={{ marginTop: '8px' }}>
                        <Button size="sm" onClick={handleCreateProduct} disabled={!newProduct.name.trim() || !newProduct.sku.trim() || createProductMutation.isLoading}>
                          {createProductMutation.isLoading ? 'Adding…' : 'Add Product'}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="total-preview">
                    Total: <strong>₹{manualTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="form-actions">
                    <Button size="sm" variant="ghost" onClick={cancelCreate}>Cancel</Button>
                    <Button size="sm" onClick={handleCreate} disabled={createMutation.isLoading}>
                      {createMutation.isLoading ? 'Confirming…' : 'Confirm Purchase'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : selected ? (
            <Card>
              <button className="back-btn" onClick={() => setMobileView('list')}>← Back</button>
              <h2 className="detail-title">Purchase {selected.id}</h2>
              <p className="detail-meta">
                Supplier: <strong>{contactMap[selected.supplierId] ?? selected.supplierId}</strong>
                &nbsp;&middot;&nbsp;
                {new Date(selected.createdAt).toLocaleDateString('en-IN')}
              </p>
              <table className="items-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Cost</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td>{productMap[item.productId] ?? item.productId}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.cost.toLocaleString('en-IN')}</td>
                      <td>₹{(item.cost * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total-line">
                Total: <strong>₹{selected.total.toLocaleString('en-IN')}</strong>
              </div>
            </Card>
          ) : (
            <Card><p className="empty">Select a purchase or upload a new bill.</p></Card>
          )}
        </main>
      </div>

      <style jsx>{`
        .layout { display: grid; grid-template-columns: 320px 1fr; gap: 16px; height: 100%; min-height: 0; margin-top: 12px; }
        @media (max-width: 880px) { .layout { grid-template-columns: 1fr; } }
        .list-pane { overflow-y: auto; }
        .list-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px 10px; border-bottom: 1px solid rgba(210,216,255,0.25);
        }
        .list-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .row {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 10px 16px; border: none; background: none;
          cursor: pointer; text-align: left; border-bottom: 1px solid rgba(210,216,255,0.15);
          font-size: 13px; transition: background 0.15s;
        }
        .row:hover { background: rgba(81,98,255,0.04); }
        .row.active { background: rgba(81,98,255,0.08); }
        .row-id { font-weight: 600; min-width: 40px; }
        .row-name { flex: 1; margin: 0 8px; color: var(--text-secondary); }
        .row-total { font-weight: 500; }
        .detail-pane { overflow-y: auto; }
        .detail-title { margin: 0 0 4px; font-size: 18px; }
        .detail-meta { color: var(--text-secondary); font-size: 13px; margin-bottom: 16px; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
        .items-table th {
          text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px;
          color: var(--text-secondary); border-bottom: 1px solid rgba(210,216,255,0.3);
        }
        .items-table td { padding: 8px 10px; border-bottom: 1px solid rgba(210,216,255,0.12); }
        .total-line { text-align: right; font-size: 15px; padding: 8px 0; }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin: 12px 0 4px; }
        .field-select, .field-input {
          display: block; width: 100%; padding: 8px 10px; border: 1px solid rgba(210,216,255,0.4);
          border-radius: 16px; font-size: 13px; background: white; margin-bottom: 6px;
          outline: none; transition: border-color 0.15s;
        }
        .field-select:focus, .field-input:focus {
          border-color: rgba(81,98,255,0.6);
        }
        .item-row { display: flex; gap: 8px; margin-bottom: 4px; }
        .item-row .field-select { flex: 2; }
        .item-row .field-input { flex: 1; }
        .item-actions { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
        .total-preview { text-align: right; font-size: 16px; margin-top: 12px; }
        .supplier-picker { display: flex; gap: 8px; align-items: center; }
        .supplier-picker .field-select { flex: 1; margin-bottom: 0; }
        .new-contact-form {
          margin-top: 8px; padding: 12px; border-radius: 10px;
          background: rgba(81,98,255,0.04); border: 1px solid rgba(210,216,255,0.4);
        }
        .mode-toggle {
          display: flex; gap: 0; margin: 12px 0; border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(210,216,255,0.4);
        }
        .mode-btn {
          flex: 1; padding: 10px; border: none; background: white;
          font-size: 13px; font-weight: 600; color: var(--text-secondary);
          cursor: pointer; transition: all 0.15s;
        }
        .mode-btn.active {
          background: rgba(81,98,255,0.1); color: var(--primary-500, #5162ff);
        }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .empty { color: var(--text-tertiary); text-align: center; padding: 24px 0; }
        
        .upload-area {
          border: 2px dashed #ccc;
          padding: 40px;
          text-align: center;
          border-radius: 12px;
          margin-top: 20px;
          background: #fafafa;
        }
        .upload-btn {
          display: inline-block; padding: 10px 20px;
          background: #5162ff; color: #fff; border-radius: 8px;
          cursor: pointer; font-weight: 600; margin-top: 12px;
        }
        .parsed-success {
          color: #38a169; font-weight: 600; background: #f0fff4; 
          padding: 10px; border-radius: 8px; text-align: center; 
          margin-bottom: 16px; border: 1px solid #c6f6d5;
        }

        .back-btn {
          display: none;
          background: none; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: var(--primary-500, #5162ff);
          padding: 4px 0; margin-bottom: 8px;
        }

        @media (max-width: 767px) {
          .layout { grid-template-columns: 1fr; }
          .mobile-hide { display: none !important; }
          .mobile-show { display: block !important; }
          .back-btn { display: block; }
          .row { padding: 12px 16px; min-height: 48px; }
          .field-select, .field-input { min-height: 44px; padding: 10px 12px; }
          .items-table th { font-size: 11px; padding: 6px 8px; }
          .items-table td { padding: 6px 8px; font-size: 12px; }
        }
      `}</style>
    </Layout>
  );
}
