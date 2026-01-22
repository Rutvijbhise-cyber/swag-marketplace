import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { api, getConfig } from '../services/api';

const CREDIT_OPTIONS = [
  { amount: 10, label: '$10' },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' }
];

function CheckoutForm({ selectedAmount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements || !selectedAmount) {
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const { clientSecret } = await api.post('/payments/create-intent', {
        amount: selectedAmount
      });

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm on backend
        const result = await api.post('/payments/confirm', {
          paymentIntentId: paymentIntent.id
        });
        onSuccess(result.newBalance);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Card Details</label>
        <div className="stripe-element">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#202124',
                  '::placeholder': { color: '#80868b' }
                }
              }
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={!stripe || loading || !selectedAmount}
      >
        {loading ? 'Processing...' : `Pay $${selectedAmount?.toFixed(2) || '0.00'}`}
      </button>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        Payments are securely processed by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

export default function Credits() {
  const { user, updateCredits } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [config, txData] = await Promise.all([
          getConfig(),
          api.get('/payments/transactions')
        ]);

        if (config.stripePublishableKey) {
          setStripePromise(loadStripe(config.stripePublishableKey));
        }
        setTransactions(txData.transactions);
      } catch (err) {
        console.error('Failed to load credits page:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handlePaymentSuccess = (newBalance) => {
    updateCredits(newBalance);
    setShowSuccess(true);
    setSelectedAmount(null);

    // Refresh transactions
    api.get('/payments/transactions').then((data) => {
      setTransactions(data.transactions);
    });

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Credits</h1>
        <p className="page-subtitle">Manage your swag marketplace credits</p>
      </div>

      {showSuccess && (
        <div className="alert alert-success">
          Credits added successfully! Your new balance is ${user?.credits?.toFixed(2)}.
        </div>
      )}

      <div className="credits-container">
        <div>
          <div className="credit-balance">
            <h2>Current Balance</h2>
            <p className="credit-amount">${user?.credits?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="card card-body">
            <h2 style={{ marginBottom: '1.5rem' }}>Add Credits</h2>

            <div className="credit-options">
              {CREDIT_OPTIONS.map((option) => (
                <div
                  key={option.amount}
                  className={`credit-option ${selectedAmount === option.amount ? 'selected' : ''}`}
                  onClick={() => setSelectedAmount(option.amount)}
                >
                  <p className="credit-option-amount">{option.label}</p>
                </div>
              ))}
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  selectedAmount={selectedAmount}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            ) : (
              <div className="alert alert-info">
                Payment processing is not configured. Please add your Stripe API keys.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="transactions-list">
            <div className="transactions-header">
              Transaction History
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No transactions yet
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div>
                    <p style={{ fontWeight: '500' }}>
                      {tx.type === 'welcome_credit'
                        ? 'Welcome Credits'
                        : tx.type === 'credit_purchase'
                        ? 'Credit Purchase'
                        : tx.type === 'order_payment'
                        ? 'Order Payment'
                        : tx.type}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <p className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                    {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
