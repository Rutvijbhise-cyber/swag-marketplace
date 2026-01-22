import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      <div className="card card-body">
        {success && (
          <div className="alert alert-success">
            Profile updated successfully!
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ background: 'var(--background)', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Email cannot be changed
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div style={{
            borderTop: '1px solid var(--border)',
            marginTop: '2rem',
            paddingTop: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Default Shipping Address</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              This address will be pre-filled during checkout
            </p>

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
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card card-body" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Account Information</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Account Type</span>
            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Credit Balance</span>
            <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
              ${user?.credits?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
