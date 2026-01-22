import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, total, loading, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      await removeFromCart(cartItemId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h3>Your cart is empty</h3>
        <p>Browse our products and add some swag!</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const canCheckout = user && user.credits >= total;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Shopping Cart</h1>
        <p className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      <div className="cart-container">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <Link to={`/products/${item.itemId}`}>
                  <h3>{item.name}</h3>
                </Link>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {item.category}
                </p>
                <p className="cart-item-price">${item.price.toFixed(2)} each</p>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= Math.min(10, item.stock)}
                  >
                    +
                  </button>
                </div>
                <p style={{ fontWeight: '600', minWidth: '80px', textAlign: 'right' }}>
                  ${item.subtotal.toFixed(2)}
                </p>
                <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--success)' }}>Free</span>
          </div>

          <div className="credits-available">
            <p>Your Credits</p>
            <span>${user?.credits?.toFixed(2) || '0.00'}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {!canCheckout && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              Insufficient credits. You need ${(total - (user?.credits || 0)).toFixed(2)} more.
            </div>
          )}

          <Link
            to={canCheckout ? '/checkout' : '/credits'}
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
          >
            {canCheckout ? 'Proceed to Checkout' : 'Add Credits'}
          </Link>

          <Link
            to="/products"
            className="btn btn-secondary btn-block"
            style={{ marginTop: '0.5rem' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
