import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const justOrdered = location.state?.justOrdered;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state">
        <h3>Order not found</h3>
        <p>The order you're looking for doesn't exist.</p>
        <Link to="/orders" className="btn btn-primary">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      {justOrdered && (
        <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
          <strong>Order placed successfully!</strong> Thank you for your order. You can track its progress below.
        </div>
      )}

      <Link to="/orders" className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Order #{order.trackingNumber}</h1>
            <p className="page-subtitle">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <span className={`order-status ${order.status}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {order.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        <div>
          <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Order Items</h2>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius)',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.itemId}`}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                  </Link>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {item.category}
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Qty: {item.quantity} x ${item.priceAtPurchase.toFixed(2)}
                  </p>
                </div>
                <p style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
                  ${item.subtotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {order.shipment && (
            <div className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Shipment Status</h2>
                <Link to={`/tracking/${order.id}`} className="btn btn-primary btn-sm">
                  Track on Map
                </Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--primary-blue-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-blue)'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: '600' }}>{order.shipment.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Carrier: {order.shipment.carrier}
                  </p>
                </div>
              </div>
              {order.shipment.estimatedDelivery && (
                <p style={{ fontSize: '0.875rem' }}>
                  <strong>Estimated Delivery:</strong> {formatDate(order.shipment.estimatedDelivery)}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--success)' }}>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Shipping Address</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
