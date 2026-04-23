// src/components/EventDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../utils/api';
import './EventDetails.css';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    API.get(`/api/v1/events/${id}`).then(res => setEvent(res.data));
  }, [id]);

  const handleStatus = async (regId, status) => {
    try {
      await API.put(`/api/v1/events/${id}/registrations/${regId}`, { status });
      setEvent({
        ...event,
        registrations: event.registrations.map(r =>
          r._id === regId ? { ...r, status } : r
        )
      });
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  if (!event) return <p className="loading">Loading event details...</p>;

  return (
    <div className="event-details">
      <header className="event-header">
        <h2>{event.title}</h2>
        <p className="event-deadline">
          <i className="fas fa-calendar-alt"></i> Deadline:{" "}
          {new Date(event.registrationDeadline).toLocaleDateString()}
        </p>
      </header>

      <section className="event-info">
        <p>{event.description}</p>
        <p><strong>📍 Venue:</strong> {event.venue}</p>
        <p><strong>👥 Max Participants:</strong> {event.maxParticipants}</p>
      </section>

      <section className="event-registrations">
        <h3>📋 Registrations</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {event.registrations.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>
                  <span className={`status-badge ${r.status}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleStatus(r._id, 'approved')} 
                    className="btn-approve"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleStatus(r._id, 'rejected')} 
                    className="btn-reject"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default EventDetails;
