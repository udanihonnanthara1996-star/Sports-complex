import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../Nav/Nav';
import API from '../../utils/api';
import './Membership.css';

const PLAN_GRADIENTS = {
  Basic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  Gold: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  Platinum: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
};

const PLAN_ICONS = {
  Basic: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

function MyMembership() {
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyMembership();
  }, []);

  const fetchMyMembership = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/api/v1/memberships/my');
      setMembershipData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load membership details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await API.patch('/api/v1/memberships/cancel');
      setShowCancelConfirm(false);
      await fetchMyMembership();
      alert('✅ Membership cancelled successfully.');
    } catch (err) {
      alert('❌ Failed to cancel membership: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="membership-page">
        <Nav />
        <div className="membership-loading">
          <div className="loading-spinner" />
          <p>Loading your membership...</p>
        </div>
      </div>
    );
  }

  const { membership, hasActiveMembership, daysRemaining, expiringSoon } =
    membershipData || {};

  const planName =
    membership?.planId?.name || membership?.planSnapshot?.name || 'Unknown';
  const gradient = PLAN_GRADIENTS[planName] || PLAN_GRADIENTS.Basic;
  const icon = PLAN_ICONS[planName] || '⭐';

  return (
    <div className="membership-page">
      <Nav />

      <div className="my-membership-container">
        <div className="my-membership-header">
          <h1>My Membership</h1>
          <p>Manage your membership plan and track your benefits</p>
        </div>

        {error && (
          <div className="membership-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {!hasActiveMembership || !membership ? (
          <div className="no-membership-card">
            <div className="no-membership-icon">🎟️</div>
            <h2>No Active Membership</h2>
            <p>
              You don't have an active membership yet. Subscribe to a plan to
              unlock exclusive benefits, discounts, and priority booking access.
            </p>
            <button
              className="subscribe-btn"
              onClick={() => navigate('/membership/plans')}
            >
              🏆 View Membership Plans
            </button>
          </div>
        ) : (
          <>
            {/* Expiry Warning */}
            {expiringSoon && (
              <div className="expiry-warning">
                <span className="warning-icon">⚠️</span>
                <div>
                  <strong>Membership Expiring Soon!</strong>
                  <p>
                    Your {planName} membership expires in{' '}
                    <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
                    Renew now to continue enjoying your benefits.
                  </p>
                </div>
                <button
                  className="renew-btn"
                  onClick={() => navigate('/membership/plans')}
                >
                  Renew Now
                </button>
              </div>
            )}

            {/* Membership Card */}
            <div className="membership-card-display">
              <div
                className="membership-card-visual"
                style={{ background: gradient }}
              >
                <div className="card-visual-top">
                  <div className="card-plan-icon">{icon}</div>
                  <div className="card-plan-name">{planName} Member</div>
                </div>
                <div className="card-divider" />
                <div className="card-visual-bottom">
                  <div className="card-info-item">
                    <span className="card-label">STATUS</span>
                    <span
                      className={`card-status ${
                        membership.status === 'ACTIVE'
                          ? 'status-active'
                          : 'status-inactive'
                      }`}
                    >
                      {membership.status}
                    </span>
                  </div>
                  <div className="card-info-item">
                    <span className="card-label">STARTED</span>
                    <span className="card-value">
                      {new Date(membership.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="card-info-item">
                    <span className="card-label">EXPIRES</span>
                    <span className="card-value">
                      {new Date(membership.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="card-info-item">
                    <span className="card-label">DAYS LEFT</span>
                    <span className="card-value days-left">
                      {daysRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="membership-progress-section">
                <div className="progress-label">
                  <span>Membership Duration</span>
                  <span>
                    {daysRemaining} of{' '}
                    {membership.planId?.duration ||
                      membership.planSnapshot?.duration}{' '}
                    days remaining
                  </span>
                </div>
                <div className="membership-progress-bar">
                  <div
                    className="membership-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (daysRemaining /
                          (membership.planId?.duration ||
                            membership.planSnapshot?.duration || 1)) *
                          100
                      )}%`,
                      background: gradient,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Benefits & Discount */}
            <div className="my-membership-details-grid">
              <div className="detail-card discount-card">
                <div className="detail-card-icon">💸</div>
                <h3>Booking Discount</h3>
                <div className="discount-percentage">
                  {membership.planId?.discountPercentage ||
                    membership.planSnapshot?.discountPercentage ||
                    0}
                  %
                </div>
                <p>Off all facility bookings</p>
                <button
                  className="book-now-btn"
                  onClick={() => navigate('/bookingForm')}
                >
                  Book a Facility →
                </button>
              </div>

              <div className="detail-card benefits-card">
                <div className="detail-card-icon">🎁</div>
                <h3>Your Benefits</h3>
                <ul className="my-benefits-list">
                  {(membership.planId?.benefits || []).map((b, i) => (
                    <li key={i}>
                      <span className="benefit-check">✓</span> {b}
                    </li>
                  ))}
                  {!(membership.planId?.benefits || []).length && (
                    <li>No benefits data available</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="my-membership-actions">
              <button
                className="upgrade-btn"
                onClick={() => navigate('/membership/plans')}
              >
                ⬆ Upgrade Plan
              </button>
              <button
                className="cancel-membership-btn"
                onClick={() => setShowCancelConfirm(true)}
              >
                ✖ Cancel Membership
              </button>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
              <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
                <div
                  className="confirm-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-icon">⚠️</div>
                  <h3>Cancel Membership?</h3>
                  <p>
                    Are you sure you want to cancel your{' '}
                    <strong>{planName}</strong> membership? You will lose all
                    benefits immediately.
                  </p>
                  <div className="modal-actions">
                    <button
                      className="modal-confirm-btn"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                    <button
                      className="modal-cancel-btn"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep Membership
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyMembership;
