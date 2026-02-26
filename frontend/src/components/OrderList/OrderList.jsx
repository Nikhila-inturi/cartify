import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, updateOrderStatus, cancelOrder } from '../../store/slices/ordersSlice';

const STATUS_BADGE = {
  PENDING:    { bg: '#FFF3CD', color: '#856404' },
  CONFIRMED:  { bg: '#CCE5FF', color: '#004085' },
  PROCESSING: { bg: '#D4EDDA', color: '#155724' },
  SHIPPED:    { bg: '#D1ECF1', color: '#0C5460' },
  DELIVERED:  { bg: '#D4EDDA', color: '#155724' },
  CANCELLED:  { bg: '#F8D7DA', color: '#721C24' },
};

export default function OrderList() {
  const dispatch = useDispatch();
  const { items, totalPages, currentPage, loading } = useSelector(s => s.orders);
  const [expandedId, setExpandedId] = useState(null);

  const handlePageChange = (page) => {
    dispatch(fetchOrders({ page, size: 20 }));
  };

  const handleStatusUpdate = (id, status) => {
    dispatch(updateOrderStatus({ id, status }));
  };

  const handleCancel = (id) => {
    if (window.confirm('Cancel this order?')) dispatch(cancelOrder(id));
  };

  if (items.length === 0 && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <p style={{ fontSize: '18px' }}>No orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff',
                      borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
            {['Order #', 'Customer', 'Status', 'Total', 'Date', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px',
                                   fontWeight: '600', color: '#495057', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((order, idx) => (
            <React.Fragment key={order.id}>
              <tr
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                style={{ borderBottom: '1px solid #f1f3f5', cursor: 'pointer',
                         background: idx % 2 === 0 ? '#fff' : '#fafafa',
                         transition: 'background 0.15s' }}
              >
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#4361ee' }}>
                  {order.orderNumber}
                </td>
                <td style={{ padding: '12px 16px', color: '#495057' }}>
                  <div>{order.customerId}</div>
                  <div style={{ fontSize: '12px', color: '#adb5bd' }}>{order.customerEmail}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={order.status} />
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                  ${Number(order.totalAmount).toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', color: '#868e96', fontSize: '13px' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <ActionButtons
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    onCancel={handleCancel}
                  />
                </td>
              </tr>
              {expandedId === order.id && order.items && (
                <tr>
                  <td colSpan={6} style={{ padding: '0 16px 16px', background: '#f8f9fa' }}>
                    <OrderItems items={order.items} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              style={{
                padding: '8px 14px', borderRadius: '6px', border: '1px solid #dee2e6',
                background: currentPage === i ? '#4361ee' : '#fff',
                color: currentPage === i ? '#fff' : '#495057',
                cursor: 'pointer', fontWeight: currentPage === i ? '600' : '400'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_BADGE[status] || { bg: '#e9ecef', color: '#495057' };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
    }}>
      {status}
    </span>
  );
}

function ActionButtons({ order, onStatusUpdate, onCancel }) {
  const NEXT_STATUS = {
    PENDING: 'CONFIRMED', CONFIRMED: 'PROCESSING',
    PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED'
  };
  const next = NEXT_STATUS[order.status];
  const canCancel = !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {next && (
        <button
          onClick={() => onStatusUpdate(order.id, next)}
          style={{ padding: '4px 10px', borderRadius: '5px', border: 'none',
                   background: '#4361ee', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
        >
          → {next}
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => onCancel(order.id)}
          style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid #dc3545',
                   background: '#fff', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function OrderItems({ items }) {
  return (
    <div style={{ marginTop: '8px' }}>
      <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Order Items:</p>
      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#868e96' }}>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Product</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Unit Price</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '4px 8px' }}>{item.productName}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>${Number(item.unitPrice).toFixed(2)}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '600' }}>${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
