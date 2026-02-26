import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';
import OrderList from '../OrderList/OrderList';

const STATUS_COLORS = {
  PENDING:    { bg: '#FFF3CD', text: '#856404' },
  CONFIRMED:  { bg: '#CCE5FF', text: '#004085' },
  PROCESSING: { bg: '#D4EDDA', text: '#155724' },
  SHIPPED:    { bg: '#D1ECF1', text: '#0C5460' },
  DELIVERED:  { bg: '#D4EDDA', text: '#155724' },
  CANCELLED:  { bg: '#F8D7DA', text: '#721C24' },
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { items, totalElements, loading } = useSelector(s => s.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Summary counts by status
  const summary = items.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', color: '#1a1a2e' }}>Order Dashboard</h1>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard label="Total Orders" value={totalElements} color="#4361ee" />
        {Object.entries(summary).map(([status, count]) => (
          <StatCard
            key={status}
            label={status}
            value={count}
            color={STATUS_COLORS[status]?.text || '#333'}
          />
        ))}
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <OrderList />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', padding: '20px 28px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: '140px',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  );
}
