import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../../utils/api';
import './CustomerEventDetails.css';
import event1 from '../../../images/event1.jpg';
import volleyball1 from '../../../images/volleyball1.jpg';

function CustomerEventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/api/v1/events/${id}`).then(res => setEvent(res.data));
  }, [id]);

  if (!event) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading event details...</p>
    </div>
  );

  // Function to get event image with fallback
  const getEventImage = () => {
    if (event.image) {
      return event.image.startsWith('http') ? event.image : `/images/${event.image}`;
    }
    // Use different default images based on event type
    if (event.type && event.type.toLowerCase().includes('volleyball')) {
      return volleyball1;
    }
    return event1;
  };

  // Calculate days until registration deadline
  const daysUntilDeadline = Math.ceil((new Date(event.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="customer-event-details">
      <div className="event-header">
        <h2>{event.title}</h2>
        <p className="event-subtitle">
          Join this exciting {event.type || 'sports'} event and be part of our sporting community!
        </p>
      </div>

      <img 
        src={getEventImage()} 
        alt={event.title} 
        className="event-image"
        onError={(e) => {
          e.target.src = event1; // Fallback image
        }}
      />
      
      <div className="event-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🏆</span>
            <div>
              <strong>Event Type:</strong>
              <p>{event.type || 'Sports Event'}</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div>
              <strong>Venue:</strong>
              <p>{event.venue}</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">👥</span>
            <div>
              <strong>Max Participants:</strong>
              <p>{event.maxParticipants} people</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">⏰</span>
            <div>
              <strong>Event Time:</strong>
              <p>{event.time ? new Date(event.time).toLocaleString() : 'TBA'}</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">🗓</span>
            <div>
              <strong>Registration Deadline:</strong>
              <p>{new Date(event.registrationDeadline).toLocaleDateString()}</p>
              {daysUntilDeadline > 0 && (
                <small className="deadline-warning">
                  {daysUntilDeadline} days remaining
                </small>
              )}
            </div>
          </div>
          
          {event.judgeBoard && event.judgeBoard.length > 0 && (
            <div className="info-item">
              <span className="info-icon">👨‍⚖️</span>
              <div>
                <strong>Judge Board:</strong>
                <p>{event.judgeBoard.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
        
        {event.description && (
          <div className="event-description">
            <h3>📝 Event Description</h3>
            <p>{event.description}</p>
          </div>
        )}
      </div>

      <div className="button-group">
        <button 
          className="btn-register" 
          onClick={() => navigate(`/customer/events/${event._id}/register`)}
          disabled={daysUntilDeadline <= 0}
        >
          {daysUntilDeadline <= 0 ? '⏰ Registration Closed' : '🚀 Register Now'}
        </button>
        <button 
          className="btn-back" 
          onClick={() => navigate('/customer/events')}
        >
          ⬅ Back to Events
        </button>
      </div>
    </div>
  );
}

export default CustomerEventDetails;
