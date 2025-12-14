import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchSubscription,
  startSubscription,
  updateAutoRenew,
} from '../services/subscription.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export default function SubscriptionPage() {
  const { initializing, isAuthenticated, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: '', error: '' });
  const [processing, setProcessing] = useState(false);
  const [autoRenewChoice, setAutoRenewChoice] = useState(true);

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/auth', {
        replace: true,
        state: { from: location.pathname, mode: 'signin' },
      });
    }
  }, [initializing, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!isAuthenticated) return;
      setLoading(true);
      setStatus({ message: '', error: '' });
      try {
        const sub = await fetchSubscription();
        if (!ignore) {
          setSubscription(sub);
          setAutoRenewChoice(Boolean(sub?.autoRenew));
        }
      } catch (err) {
        if (!ignore) {
          const message = err?.response?.data?.error || err.message || 'Unable to load subscription.';
          setStatus({ message: '', error: message });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const isSubscribed = useMemo(() => Boolean(subscription?.isActive), [subscription]);

  const handleSubscribe = async () => {
    setStatus({ message: '', error: '' });
    setProcessing(true);
    try {
      const wait = new Promise((resolve) => setTimeout(resolve, 5000));
      const [sub] = await Promise.all([
        startSubscription(autoRenewChoice),
        wait,
      ]);
      setSubscription(sub);
      setStatus({ message: 'Subscription activated!', error: '' });
      await refresh();
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to start subscription.';
      setStatus({ message: '', error: message });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    setStatus({ message: '', error: '' });
    try {
      const updated = await updateAutoRenew(!subscription.autoRenew);
      setSubscription(updated);
      setAutoRenewChoice(Boolean(updated.autoRenew));
      setStatus({
        message: updated.autoRenew ? 'Auto-renew enabled.' : 'Auto-renew disabled.',
        error: '',
      });
      await refresh();
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to update auto-renew.';
      setStatus({ message: '', error: message });
    }
  };

  if (initializing || loading) {
    return <Loader />;
  }

  return (
    <section className="subscription-page">
      <div className="subscription-hero">
        <p className="eyebrow">AlexandRead Premium</p>
        <h1>Unlock every book. One simple plan.</h1>
        <p className="lede">
          Get full access to the entire library, premium titles included. Your subscription
          renews monthly and can be toggled at any time.
        </p>
      </div>

      <div className="subscription-grid">
        <div className="subscription-card">
          <div className="subscription-price">
            <div>
              <span className="price">${subscription?.value ?? 4.99}</span>
              <span className="price-period">/ month</span>
            </div>
            <span className="badge">All access</span>
          </div>
          <ul className="subscription-benefits">
            <li>Unlimited reading across free and premium books</li>
            <li>Pause or cancel anytime before renewal</li>
            <li>Auto-renew can be switched on or off</li>
          </ul>

          {!isSubscribed ? (
            <div className="subscription-actions">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={autoRenewChoice}
                  onChange={(event) => setAutoRenewChoice(event.target.checked)}
                />
                <span>Enable automatic renewal each month</span>
              </label>
              <button
                type="button"
                className="primary-btn subscribe-btn"
                onClick={handleSubscribe}
                disabled={processing}
              >
                {processing ? 'Processing payment...' : 'Subscribe now'}
              </button>
            </div>
          ) : (
            <div className="subscription-actions">
              <p className="status success">You are currently subscribed.</p>
              <button
                type="button"
                className={`ghost-btn toggle-renew ${subscription.autoRenew ? 'active' : ''}`}
                onClick={handleToggleAutoRenew}
              >
                {subscription.autoRenew ? 'Disable auto-renew' : 'Enable auto-renew'}
              </button>
            </div>
          )}

          {status.message && <p className="status success">{status.message}</p>}
          {status.error && <p className="status error">{status.error}</p>}
        </div>

        <div className="subscription-status-card">
          <h2>Your subscription</h2>
          <div className="status-rows">
            <div className="status-row">
              <span>Plan status</span>
              <strong className={isSubscribed ? 'status-active' : 'status-inactive'}>
                {isSubscribed ? 'Active' : 'Not active'}
              </strong>
            </div>
            <div className="status-row">
              <span>Start date</span>
              <strong>{formatDate(subscription?.start)}</strong>
            </div>
            <div className="status-row">
              <span>End date</span>
              <strong>{formatDate(subscription?.end)}</strong>
            </div>
            <div className="status-row">
              <span>Price</span>
              <strong>${subscription?.value ?? 4.99}</strong>
            </div>
            <div className="status-row">
              <span>Days remaining</span>
              <strong>{subscription?.daysRemaining ?? 0} days</strong>
            </div>
            <div className="status-row">
              <span>Auto-renew</span>
              <strong>{subscription?.autoRenew ? 'Enabled' : 'Disabled'}</strong>
            </div>
          </div>

          <div className="auto-renew-box">
            <p>Auto-renew will extend your plan by one month when it reaches the end date.</p>
            <button
              type="button"
              className={`primary-btn secondary toggle-renew ${subscription?.autoRenew ? 'active' : ''}`}
              onClick={handleToggleAutoRenew}
            >
              {subscription?.autoRenew ? 'Turn off auto-renew' : 'Turn on auto-renew'}
            </button>
          </div>
        </div>
      </div>

      {processing && (
        <div className="subscription-processing">
          <div className="processing-card">
            <p className="eyebrow">Processing</p>
            <h3>Securing your subscription...</h3>
            <p>This takes about five seconds. Please wait.</p>
          </div>
        </div>
      )}
    </section>
  );
}
