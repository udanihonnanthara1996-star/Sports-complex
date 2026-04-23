// src/components/Manager/EventRegistrations.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import './EventRegistrations.css';

function EventRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // fetch registrations
    API.get(`/api/v1/events/${id}/registrations`)
      .then(res => setRegistrations(res.data))
      .catch(err => handleError(err, 'Fetching registrations failed'));

    // fetch event details
    API.get(`/api/v1/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(err => handleError(err, 'Fetching event details failed'));
  }, [id]);

  const handleError = (err, customMessage) => {
    console.error(err);
    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.msg ||
      err.message ||
      'Unknown error';
    alert(`${customMessage}:\n${JSON.stringify(errorMsg, null, 2)}`);
  };

  const handleAction = async (registrationId, action) => {
    try {
      if (action === 'approve') {
        await API.post(`/api/v1/events/registrations/${registrationId}/approve`);
        setRegistrations(registrations.map(r =>
          r._id === registrationId ? { ...r, status: 'approved' } : r
        ));
        alert('✅ Registration approved and email notification sent!');
      } else if (action === 'reject') {
        setSelectedRegistration(registrationId);
        setShowRejectModal(true);
      }
    } catch (err) {
      handleError(err, 'Updating registration status failed');
    }
  };

  const handleReject = async () => {
    try {
      await API.post(`/api/v1/events/registrations/${selectedRegistration}/reject`, {
        reason: rejectionReason
      });
      setRegistrations(registrations.map(r =>
        r._id === selectedRegistration ? { ...r, status: 'rejected' } : r
      ));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRegistration(null);
      alert('❌ Registration rejected and email notification sent!');
    } catch (err) {
      handleError(err, 'Rejecting registration failed');
    }
  };

  const sendReminders = async () => {
    try {
      const response = await API.post('/api/v1/events/send-reminders?daysAhead=3');
      const data = response.data;

      if (data.emailsSent > 0) {
        alert(`✅ Success! ${data.emailsSent} reminder emails sent for ${data.eventsProcessed} events.`);
      } else if (data.eventsProcessed > 0) {
        alert(`📅 Found ${data.eventsProcessed} events but no approved registrations to send reminders to.`);
      } else {
        alert(`📅 No events found 3 days ahead (${data.targetDate}).`);
      }
    } catch (err) {
      handleError(err, 'Sending event reminders failed');
    }
  };

  const debugEvents = async () => {
    try {
      const response = await API.get('/api/v1/events/debug');
      const data = response.data;

      const debugMsg = `📊 Debug Information:

Total Events: ${data.totalEvents}
Total Registrations: ${data.totalRegistrations}
Approved Registrations: ${data.approvedRegistrations}

Events Details:
${data.events.map(e => 
  `• ${e.title}
    - Time: ${e.time ? new Date(e.time).toLocaleDateString() : 'Not set'}
    - Registration Deadline: ${e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleDateString() : 'Not set'}
    - Status: ${e.status}`
).join('\n')}
`;
      alert(debugMsg);
    } catch (err) {
      handleError(err, 'Fetching debug information failed');
    }
  };

  const testAPI = async () => {
    try {
      const response = await API.get('/api/v1/test');
      alert(`✅ API Test Successful!\n\nResponse: ${JSON.stringify(response.data, null, 2)}`);
    } catch (err) {
      handleError(err, 'API Test Failed');
    }
  };

  return (
    <div className="event-registrations-container">
      <div className="header-section">
        <h2>📋 Event Registrations</h2>
        {event && (
          <div className="event-info">
            <h3>{event.title}</h3>
            <p>📍 {event.venue} | 🗓 {new Date(event.registrationDeadline).toLocaleDateString()}</p>
          </div>
        )}
        <div className="action-buttons">
          <button className="back-btn" onClick={() => navigate('/events')}>← Back to Events</button>
          <button className="reminder-btn" onClick={sendReminders}>📧 Send Event Reminders</button>
          <button className="debug-btn" onClick={debugEvents}>🔍 Debug Events</button>
          <button className="test-btn" onClick={testAPI}>🔧 Test API</button>
        </div>
      </div>

      <div className="registrations-stats">
        <div className="stat-item">
          <span className="stat-number">{registrations.length}</span>
          <span className="stat-label">Total Registrations</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{registrations.filter(r => r.status === 'approved').length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{registrations.filter(r => r.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{registrations.filter(r => r.status === 'rejected').length}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      <table className="event-registrations-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Registration Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No registrations found for this event.
              </td>
            </tr>
          ) : (
            registrations.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td><span className={`status-badge ${r.status || 'pending'}`}>{r.status || 'pending'}</span></td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  {r.status === 'pending' ? (
                    <>
                      <button className="approve-btn" onClick={() => handleAction(r._id, 'approve')}>✅ Approve</button>
                      <button className="reject-btn" onClick={() => handleAction(r._id, 'reject')}>❌ Reject</button>
                    </>
                  ) : (
                    <span className="action-completed">
                      {r.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Registration</h3>
            <p>Please provide a reason (optional):</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div className="modal-buttons">
              <button onClick={() => setShowRejectModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleReject} className="confirm-reject-btn">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventRegistrations;
