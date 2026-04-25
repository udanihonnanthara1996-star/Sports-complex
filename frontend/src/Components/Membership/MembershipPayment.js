import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Nav from '../Nav/Nav';
import API from '../../utils/api';
import jsPDF from 'jspdf';
import './Membership.css';

function MembershipPayment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Plan data passed via navigation state from MembershipPlans
  const {
    planId,
    planName = '',
    planPrice = 0,
    planDuration = 30,
    planDiscount = 0,
  } = location.state || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    method: '',
    cardN: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if no plan was passed
  if (!planId) {
    return (
      <div className="membership-page">
        <Nav />
        <div className="no-membership-card" style={{ marginTop: '4rem' }}>
          <div className="no-membership-icon">🚫</div>
          <h2>No Plan Selected</h2>
          <p>Please select a membership plan first.</p>
          <button
            className="subscribe-btn"
            onClick={() => navigate('/membership/plans')}
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Full name is required.';
    if (!formData.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      e.email = 'Invalid email format.';
    }
    if (!formData.method) e.method = 'Payment method is required.';
    const cleanCard = formData.cardN.replace(/-/g, '').replace(/\s/g, '');
    if (!formData.cardN.trim()) {
      e.cardN = 'Card number is required.';
    } else if (!/^\d{16}$/.test(cleanCard)) {
      e.cardN = 'Card must be exactly 16 digits (numbers only).';
    }
    if (!formData.phone.trim()) {
      e.phone = 'Phone is required.';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      e.phone = 'Phone must be exactly 10 digits.';
    }
    return e;
  };


  const generateReceipt = (paymentRecord) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SportSync.LK', 15, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Membership Subscription Receipt', 15, 32);

    // Receipt body
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt Details', 15, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const rows = [
      ['Receipt Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Member Name', formData.name],
      ['Email', formData.email],
      ['Phone', formData.phone],
      ['Payment Method', formData.method],
      [''],
      ['Plan', planName],
      ['Duration', `${planDuration} days`],
      ['Booking Discount', `${planDiscount}%`],
      ['Amount Paid', `LKR ${Number(planPrice).toLocaleString()}`],
    ];

    let y = 72;
    rows.forEach(([label, value]) => {
      if (!label) { y += 4; return; }
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 80, y);
      y += 10;
    });

    // Footer
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Thank you for choosing SportSync.LK — Your premium sports complex.', 15, 284);
    doc.text('This is a computer-generated receipt. No signature required.', 15, 291);

    doc.save(`membership-receipt-${planName}-${Date.now()}.pdf`);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert(
        'Please fix the following errors:\n\n- ' +
          Object.values(validationErrors).join('\n- ')
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Save payment record (reuse existing Payment model)
      const paymentRes = await API.post('/api/v1/payments', {
        name: formData.name,
        email: formData.email,
        method: formData.method,
        cardN: formData.cardN,
        sport: `Membership - ${planName}`,
        sportTime: 'N/A',
        amount: String(planPrice),
        phone: formData.phone,
      });

      const savedPaymentId = paymentRes.data?.payment?._id || null;

      // 2. Activate membership
      await API.post('/api/v1/memberships/subscribe', {
        planId,
        paymentId: savedPaymentId,
      });

      // 3. Generate PDF receipt
      generateReceipt(paymentRes.data?.payment);

      setSuccess(true);
    } catch (err) {
      alert('❌ Payment failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="membership-page">
        <Nav />
        <div className="payment-success-container">
          <div className="success-animation">🎉</div>
          <h2>Membership Activated!</h2>
          <p>
            Welcome to the <strong>{planName}</strong> plan! Your PDF receipt
            has been downloaded automatically.
          </p>
          <div className="success-details">
            <div className="success-detail-item">
              <span>Plan</span>
              <strong>{planName}</strong>
            </div>
            <div className="success-detail-item">
              <span>Duration</span>
              <strong>{planDuration} days</strong>
            </div>
            <div className="success-detail-item">
              <span>Booking Discount</span>
              <strong>{planDiscount}%</strong>
            </div>
            <div className="success-detail-item">
              <span>Amount Paid</span>
              <strong>LKR {Number(planPrice).toLocaleString()}</strong>
            </div>
          </div>
          <div className="success-actions">
            <button
              className="subscribe-btn"
              onClick={() => navigate('/membership/my')}
            >
              View My Membership
            </button>
            <button
              className="upgrade-btn"
              onClick={() => navigate('/bookingForm')}
            >
              Book a Facility
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <Nav />
      <div className="membership-payment-container">
        <div className="payment-left-panel">
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="order-plan-badge">
              {planName === 'Basic' && '🥈'}
              {planName === 'Gold' && '🥇'}
              {planName === 'Platinum' && '💎'}
              {' '}{planName} Membership
            </div>
            <div className="order-details">
              <div className="order-row">
                <span>Plan Duration</span>
                <span>{planDuration} days</span>
              </div>
              <div className="order-row">
                <span>Booking Discount</span>
                <span className="discount-highlight">{planDiscount}% OFF</span>
              </div>
              <div className="order-divider" />
              <div className="order-row order-total">
                <span>Total</span>
                <span>LKR {Number(planPrice).toLocaleString()}</span>
              </div>
            </div>
            <div className="secure-badge">🔒 Secure Payment</div>
          </div>
        </div>

        <div className="payment-right-panel">
          <h2>Payment Details</h2>
          <p className="payment-subtitle">
            Complete your payment to activate your membership instantly.
          </p>

          <form className="membership-payment-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="mp-name">Full Name</label>
              <input
                id="mp-name"
                type="text"
                name="name"
                placeholder="John Silva"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mp-email">Email Address</label>
              <input
                id="mp-email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mp-phone">Phone Number</label>
              <input
                id="mp-phone"
                type="text"
                name="phone"
                placeholder="0771234567"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && (
                <span className="field-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="mp-method">Payment Method</label>
                <select
                  id="mp-method"
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className={errors.method ? 'input-error' : ''}
                >
                  <option value="">-- Select --</option>
                  <option value="Credit Card">💳 Credit Card</option>
                  <option value="Master Card">💳 Master Card</option>
                </select>
                {errors.method && (
                  <span className="field-error">{errors.method}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="mp-cardN">Card Number</label>
                <input
                  id="mp-cardN"
                  type="text"
                  name="cardN"
                  placeholder="1111222233334444"
                  value={formData.cardN}
                  onChange={handleChange}
                  className={errors.cardN ? 'input-error' : ''}
                />
                {errors.cardN && (
                  <span className="field-error">{errors.cardN}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="pay-membership-btn"
              disabled={loading}
            >
              {loading
                ? '⏳ Processing...'
                : `Pay LKR ${Number(planPrice).toLocaleString()} & Activate`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MembershipPayment;
