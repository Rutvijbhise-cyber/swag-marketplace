import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await api.get(`/items/${id}`);
        setItem(data.item);
      } catch (err) {
        console.error('Failed to fetch item:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(item.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="empty-state">
        <h3>Product not found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const canAfford = user && user.credits >= item.price * quantity;

  return (
    <div>
      <Link to="/products" className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Products
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div>
          <span className="product-category" style={{ fontSize: '0.875rem' }}>
            {item.category}
          </span>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.name}</h1>
          <p className="product-price" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
            ${item.price.toFixed(2)}
          </p>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            {item.description}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Availability:</strong>{' '}
              <span style={{ color: item.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
              </span>
            </p>
          </div>

          {item.stock > 0 && (
            <>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <div className="quantity-control">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.min(10, item.stock, quantity + 1))}
                    disabled={quantity >= Math.min(10, item.stock)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '1.125rem' }}>
                  <strong>Total:</strong> ${(item.price * quantity).toFixed(2)}
                </p>
                {user && (
                  <p style={{ fontSize: '0.875rem', color: canAfford ? 'var(--success)' : 'var(--error)', marginTop: '0.25rem' }}>
                    {canAfford
                      ? `You have $${user.credits.toFixed(2)} in credits`
                      : `Insufficient credits ($${user.credits.toFixed(2)} available)`}
                  </p>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={adding || added}
                style={{ width: '100%' }}
              >
                {added ? 'Added to Cart!' : adding ? 'Adding...' : 'Add to Cart'}
              </button>

              {added && (
                <Link
                  to="/cart"
                  className="btn btn-secondary btn-lg"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  View Cart
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
