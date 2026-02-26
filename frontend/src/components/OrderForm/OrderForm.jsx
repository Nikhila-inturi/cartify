import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createOrder } from '../../store/slices/ordersSlice';

const emptyItem = { productId: '', productName: '', quantity: 1, unitPrice: '' };

export default function OrderForm({ onSuccess }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    customerId: '',
    customerEmail: '',
    shippingAddress: '',
    items: [{ ...emptyItem }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const updateItem = (index, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce((sum, item) =>
    sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(createOrder({
        ...form,
        items: form.items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), quantity: parseInt(i.quantity) }))
      })).unwrap();
      onSuccess?.();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px',
    border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600', color: '#495057' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px' }}>Create New Order</h2>

      {error && (
        <div style={{ background: '#F8D7DA', color: '#721C24', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Customer ID</label>
          <input style={inputStyle} required value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Customer Email</label>
          <input style={inputStyle} type="email" required value={form.customerEmail}
            onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Shipping Address</label>
        <input style={inputStyle} required value={form.shippingAddress}
          onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>Order Items</h3>
          <button type="button" onClick={addItem}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #4361ee',
                     background: '#fff', color: '#4361ee', cursor: 'pointer', fontSize: '13px' }}>
            + Add Item
          </button>
        </div>

        {form.items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr auto',
                                gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
            <div>
              {i === 0 && <label style={labelStyle}>Product ID</label>}
              <input style={inputStyle} required placeholder="prod-001" value={item.productId}
                onChange={e => updateItem(i, 'productId', e.target.value)} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Product Name</label>}
              <input style={inputStyle} required placeholder="Widget A" value={item.productName}
                onChange={e => updateItem(i, 'productName', e.target.value)} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Qty</label>}
              <input style={inputStyle} type="number" min="1" required value={item.quantity}
                onChange={e => updateItem(i, 'quantity', e.target.value)} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Unit Price ($)</label>}
              <input style={inputStyle} type="number" step="0.01" min="0.01" required value={item.unitPrice}
                onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>&nbsp;</label>}
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: 'none',
                           background: '#F8D7DA', color: '#721C24', cursor: 'pointer' }}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '16px', color: '#1a1a2e' }}>
          Total: ${total.toFixed(2)}
        </div>
      </div>

      <button type="submit" disabled={submitting}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                 background: submitting ? '#adb5bd' : '#4361ee', color: '#fff',
                 fontSize: '15px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer' }}>
        {submitting ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  );
}
