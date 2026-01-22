import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders');
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'confirmed';
      case 'processing':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
            <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9z" />
            <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
          </svg>
        </div>
        <h3>No orders yet</h3>
        <p>Start shopping to place your first order!</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">{pagination.total || orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      <div>
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <p className="order-number">Order #{order.trackingNumber}</p>
                <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <span className={`order-status ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="order-items-preview">
              {order.items.slice(0, 4).map((item) => (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.name}
                  className="order-item-thumb"
                  title={item.name}
                />
              ))}
              {order.items.length > 4 && (
                <div
                  className="order-item-thumb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--primary-blue-light)',
                    color: 'var(--primary-blue)',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  +{order.items.length - 4}
                </div>
              )}
            </div>

            <div className="order-footer">
              <p className="order-total">
                Total: <strong>${order.totalAmount.toFixed(2)}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {order.shipment && (
                  <Link
                    to={`/tracking/${order.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Track Order
                  </Link>
                )}
                <Link
                  to={`/orders/${order.id}`}
                  className="btn btn-outline btn-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
