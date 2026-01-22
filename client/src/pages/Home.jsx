import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="hero">
        <h1>Welcome to SwagMarket</h1>
        <p>
          Your one-stop shop for company swag. New employees receive $40 in credits
          to pick their favorite items and have them shipped directly to their door.
        </p>
        <div className="hero-actions">
          {user ? (
            <>
              <Link to="/products" className="btn btn-primary btn-lg">
                Browse Products
              </Link>
              <Link to="/orders" className="btn btn-secondary btn-lg">
                View Orders
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>1</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Sign Up</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Create your account and receive $40 in welcome credits automatically
            </p>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>2</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Choose Swag</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Browse over 1,000 items including apparel, tech gadgets, and office supplies
            </p>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>3</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Track Delivery</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Track your order in real-time with our integrated Mapbox tracking system
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Featured Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {['Apparel', 'Tech', 'Office', 'Drinkware', 'Bags', 'Accessories'].map((category) => (
            <Link
              key={category}
              to={user ? `/products?category=${category}` : '/login'}
              className="card"
              style={{ padding: '2rem', textAlign: 'center', textDecoration: 'none' }}
            >
              <h3 style={{ color: 'var(--primary-blue)' }}>{category}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
