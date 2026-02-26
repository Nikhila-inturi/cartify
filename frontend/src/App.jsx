import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Dashboard from './components/Dashboard/Dashboard';
import OrderForm from './components/OrderForm/OrderForm';

export default function App() {
  const [view, setView] = useState('dashboard');

  const navStyle = {
    background: '#1a1a2e', color: '#fff', padding: '0 24px',
    display: 'flex', alignItems: 'center', gap: '32px', height: '56px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  };
  const linkStyle = (active) => ({
    color: active ? '#4cc9f0' : '#adb5bd', cursor: 'pointer',
    fontWeight: active ? '600' : '400', fontSize: '14px',
    textDecoration: 'none', padding: '4px 0',
    borderBottom: active ? '2px solid #4cc9f0' : '2px solid transparent'
  });

  return (
    <Provider store={store}>
      <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
        <nav style={navStyle}>
          <span style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' }}>
            🛒 Order Management
          </span>
          <span style={linkStyle(view === 'dashboard')} onClick={() => setView('dashboard')}>
            Dashboard
          </span>
          <span style={linkStyle(view === 'create')} onClick={() => setView('create')}>
            New Order
          </span>
        </nav>

        <main style={{ padding: '32px 24px' }}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'create' && (
            <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff',
                          borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <OrderForm onSuccess={() => setView('dashboard')} />
            </div>
          )}
        </main>
      </div>
    </Provider>
  );
}
