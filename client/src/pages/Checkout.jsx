import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'United States'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.address.trim() || formData.address.length < 5) {
      newErrors.address = 'Please enter a valid address';
    }
    if (!formData.city.trim() || formData.city.length < 2) {
      newErrors.city = 'Please enter a valid city';
    }
    if (!formData.state.trim() || formData.state.length < 2) {
      newErrors.state = 'Please enter a valid state';
    }
    if (!formData.zipCode.trim() || formData.zipCode.length < 3) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Please enter a country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');

    if (!validate()) return;

    if (user.credits < total) {
      setOrderError('Insufficient credits to complete this order');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post('/orders', formData);
      updateCredits(data.remainingCredits);
      await clearCart();
      navigate(`/orders/${data.order.id}`, {
        state: { justOrdered: true }
      });
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No items to checkout</h3>
        <p>Add some items to your cart first</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Complete your order</p>
      </div>

      <div className="cart-container">
        <div>
          <div className="card card-body">
            <h2 style={{ marginBottom: '1.5rem' }}>Shipping Address</h2>

            {orderError && (
              <div className="alert alert-error">{orderError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="address">
                  Street Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Apt 4B"
                />
                {errors.address && (
                  <p className="form-error">{errors.address}</p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="San Francisco"
                  />
                  {errors.city && (
                    <p className="form-error">{errors.city}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="state">
                    State / Province
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="form-input"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="California"
                  />
                  {errors.state && (
                    <p className="form-error">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="zipCode">
                    ZIP / Postal Code
                  </label>
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    className="form-input"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="94102"
                  />
                  {errors.zipCode && (
                    <p className="form-error">{errors.zipCode}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className="form-input"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="United States"
                  />
                  {errors.country && (
                    <p className="form-error">{errors.country}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{item.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Qty: {item.quantity}
                  </p>
                </div>
                <p style={{ fontWeight: '600' }}>${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--success)' }}>Free</span>
          </div>

          <div className="credits-available">
            <p>Paying with Credits</p>
            <span>${user?.credits?.toFixed(2) || '0.00'}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
            Credits will be deducted from your account upon order confirmation
          </p>
        </div>
      </div>
    </div>
  );
}
