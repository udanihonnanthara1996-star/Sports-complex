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

const PLAN_TEXT_COLORS = {
  Basic: '#4a3fa0',
  Gold: '#7a4a00',
  Platinum: '#b0c4de',
};

function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myMembership, setMyMembership] = useState(null);
  const [subscribing, setSubscribing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    fetchMyMembership();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await API.get('/api/v1/memberships/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      setError('Failed to load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMembership = async () => {
    try {
      const res = await API.get('/api/v1/memberships/my');
      setMyMembership(res.data.membership);
    } catch {
      // Not logged in or no membership — that's fine
    }
  };

  const handleSubscribe = (plan) => {
    // Navigate to payment page with plan info in state
    navigate('/membership/payment', {
      state: {
        planId: plan._id,
        planName: plan.name,
        planPrice: plan.price,
        planDuration: plan.duration,
        planDiscount: plan.discountPercentage,
      },
    });
  };

  const isCurrentPlan = (planId) =>
    myMembership &&
    myMembership.status === 'ACTIVE' &&
    myMembership.planId?._id === planId;

  if (loading) {
    return (
      <div className="membership-page">
        <Nav />
        <div className="membership-loading">
          <div className="loading-spinner" />
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <Nav />
      <div className="membership-hero">
        <div className="membership-hero-content">
          <span className="membership-badge-tag">🏆 Exclusive Benefits</span>
          <h1>Membership Plans</h1>
          <p>
            Unlock premium access to world-class facilities, priority bookings,
            and exclusive member discounts. Choose the plan that fits your
            lifestyle.
          </p>
        </div>
        <div className="membership-hero-bg" />
      </div>

      {myMembership && myMembership.status === 'ACTIVE' && (
        <div className="active-membership-banner">
          <span className="banner-icon">✅</span>
          <div>
            <strong>
              You're a {myMembership.planId?.name || myMembership.planSnapshot?.name} Member!
            </strong>
            <span>
              &nbsp;— Expires{' '}
              {new Date(myMembership.endDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <button
            className="view-membership-btn"
            onClick={() => navigate('/membership/my')}
          >
            View My Membership →
          </button>
        </div>
      )}

      {error && (
        <div className="membership-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan._id);
          return (
            <div
              key={plan._id}
              className={`plan-card ${isCurrent ? 'current-plan' : ''} ${
                plan.name === 'Platinum' ? 'featured-plan' : ''
              }`}
            >
              {plan.name === 'Platinum' && (
                <div className="featured-ribbon">Most Popular</div>
              )}
              {isCurrent && (
                <div className="current-plan-badge">✅ Current Plan</div>
              )}

              <div
                className="plan-card-header"
                style={{ background: PLAN_GRADIENTS[plan.name] || PLAN_GRADIENTS.Basic }}
              >
                <div className="plan-icon">{PLAN_ICONS[plan.name] || '⭐'}</div>
                <h2 className="plan-name">{plan.name}</h2>
                <div className="plan-price">
                  <span className="currency">LKR</span>
                  <span className="amount">
                    {Number(plan.price).toLocaleString()}
                  </span>
                </div>
                <div className="plan-duration">
                  {plan.duration} days
                </div>
                {plan.discountPercentage > 0 && (
                  <div className="plan-discount-badge">
                    {plan.discountPercentage}% OFF Bookings
                  </div>
                )}
              </div>

              <div className="plan-card-body">
                <ul className="benefits-list">
                  {(plan.benefits || []).map((benefit, i) => (
                    <li key={i}>
                      <span className="benefit-check">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button
                  className={`subscribe-btn ${
                    isCurrent ? 'subscribed-btn' : ''
                  } ${plan.name === 'Platinum' ? 'platinum-btn' : ''}`}
                  onClick={() => !isCurrent && handleSubscribe(plan)}
                  disabled={isCurrent || subscribing === plan._id}
                >
                  {subscribing === plan._id
                    ? '⏳ Processing...'
                    : isCurrent
                    ? '✅ Active Plan'
                    : myMembership && myMembership.status === 'ACTIVE'
                    ? '⬆ Upgrade Plan'
                    : 'Subscribe Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="membership-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Can I upgrade my plan?</h3>
            <p>
              Yes! You can upgrade at any time. Your current plan will be
              cancelled and the new plan activates immediately.
            </p>
          </div>
          <div className="faq-item">
            <h3>How are discounts applied?</h3>
            <p>
              Discounts are automatically applied when you book a facility. No
              coupon code required!
            </p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel my membership?</h3>
            <p>
              Yes, you can cancel at any time from the "My Membership" page.
              Cancellations are effective immediately.
            </p>
          </div>
          <div className="faq-item">
            <h3>When does my membership start?</h3>
            <p>
              Your membership activates immediately after successful payment and
              runs for the full plan duration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipPlans;
