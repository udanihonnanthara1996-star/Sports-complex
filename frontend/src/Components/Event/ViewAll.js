// src/components/ViewAll.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';
import './ViewAll.css';

function ViewAll() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get('/events').then(res => setEvents(res.data));
  }, []);

  return (
    <div className="viewall-container">
      <h2>All Events</h2>
      <div className="viewall-grid">
        {events.map(event => (
          <div key={event._id} className="viewall-card">
            <img
              src={event.image || '/images/event1.jpg'}
              alt={event.title}
              className="viewall-image"
            />
            <div className="viewall-content">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p><strong>Venue:</strong> {event.venue}</p>
              <p><strong>Max Participants:</strong> {event.maxParticipants}</p>
              <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
              <Link to={`/events/view/${event._id}`} className="btn-details">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewAll;
