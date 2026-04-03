import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../utils/api';
import './CustomerEventList.css';
import event1 from '../../../images/event1.jpg';
import volleyball1 from '../../../images/volleyball1.jpg';
import Nav from '../../Nav/Nav';  

// Default event images array for variety
const defaultImages = [event1, volleyball1, event1, volleyball1];

function CustomerEventList() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/api/v1/events').then(res => setEvents(res.data));
  }, []);

  // Function to get event image
  const getEventImage = (event, index) => {
    if (event.image) {
      return event.image.startsWith('http') ? event.image : `/images/${event.image}`;
    }
    return defaultImages[index % defaultImages.length];
  };

  return (
    <>
    <Nav/>
       
      <div className="customer-event-list">
      <div className="page-header">
        <h2>✨ Available Sports Events</h2>
        <p className="page-description">
          Discover exciting sports events and competitions. Join our community and participate in various sporting activities throughout the year.
        </p>
      </div>
      <div className="event-grid">
        {events.map((e, index) => (
          <div className="event-card" key={e._id}>
            <img 
              src={getEventImage(e, index)} 
              alt={e.title}
              className="event-image"
              onError={(event) => {
                event.target.src = event1; // Fallback image
              }}
            />
            <div className="event-content">
              <h3>{e.title}</h3>
              <p className="event-type">🏆 {e.type || 'Sports Event'}</p>
              <p className="venue">📍 {e.venue}</p>
              <p className="deadline">⏳ Registration closes: {new Date(e.registrationDeadline).toLocaleDateString()}</p>
              <p className="participants">👥 Max: {e.maxParticipants} participants</p>
              <div className="card-buttons">
                <button className="btn-view" onClick={() => navigate(`/customer/events/${e._id}`)}>
                  👁️ View Details
                </button>
                <button className="btn-register" onClick={() => navigate(`/customer/events/${e._id}/register`)}>
                  🚀 Register Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

export default CustomerEventList;
