import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9z" />
                <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
              </svg>
            </div>
            SwagMarket
          </Link>

          {user && (
            <nav className="nav">
              <Link
                to="/products"
                className={`nav-link ${isActive('/products') ? 'active' : ''}`}
              >
                Products
              </Link>
              <Link
                to="/orders"
                className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
              >
                Orders
              </Link>
              <Link
                to="/credits"
                className={`nav-link ${isActive('/credits') ? 'active' : ''}`}
              >
                Credits
              </Link>
            </nav>
          )}

          <div className="header-actions">
            {user ? (
              <>
                <Link to="/credits" className="credits-badge">
                  ${user.credits?.toFixed(2) || '0.00'}
                </Link>

                <Link to="/cart" className="cart-button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
                </Link>

                <div className="user-menu" ref={dropdownRef}>
                  <button
                    className="user-button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-item" style={{ cursor: 'default' }}>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/orders"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Orders
                      </Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={handleLogout}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>SwagMarket - Employee Swag Distribution Platform</p>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          New employees receive $40 in credits to pick their favorite swag!
        </p>
      </footer>
    </div>
  );
}
