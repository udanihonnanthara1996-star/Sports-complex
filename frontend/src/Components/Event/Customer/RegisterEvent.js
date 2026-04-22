import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../../utils/api';
import './RegisterEvent.css';

function RegisterEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', details: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // clear error while typing
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // ✅ Strong validation rules
    if (!/^[A-Za-z\s]{3,}$/.test(form.name)) {
      setError('Name must be at least 3 letters and contain only alphabets.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      await API.post(`/api/v1/events/${id}/register`, form);
      alert('Registration successful! A confirmation email has been sent.');
      navigate('/customer/events'); // ✅ navigate back to event list
    } catch (err) {
      alert('Error registering. Event might be full.');
    }
  };

  return (
    <div className="register-event-form">
      <div className="registration-header">
        <h2>🎯 Event Registration</h2>
        <p className="registration-description">
          Complete the form below to register for this exciting sports event. All fields marked with * are required. 
          You'll receive a confirmation email once your registration is submitted for review.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name *"
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Your Email *"
          required
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number (10 digits) *"
          required
        />
        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="Enter Details (optional)"
          rows="4"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Submit Registration</button>
        <button type="button" onClick={() => navigate('/customer/events')}>Cancel</button>
      </form>
    </div>
  );
}

export default RegisterEvent;
