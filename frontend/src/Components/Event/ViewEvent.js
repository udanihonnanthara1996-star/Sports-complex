import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from '../../utils/api';
import "./ViewEvent.css";

function ViewEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/api/v1/events/${id}`).then((res) => setEvent(res.data));
  }, [id]);

  if (!event) return <p className="loading">Loading event details...</p>;

  return (
    <div className="view-event-container">
      <div className="event-card">
        {event.image && (
          <img src={event.image} alt={event.title} className="event-image" />
        )}
        <div className="event-content">
          <h2 className="event-title">{event.title}</h2>
          <p className="event-description">{event.description}</p>

          <div className="event-details">
            <p>
              <span>📍 Venue:</span> {event.venue}
            </p>
            <p>
              <span>👥 Max Participants:</span> {event.maxParticipants}
            </p>
            <p>
              <span>⏰ Deadline:</span>{" "}
              {new Date(event.registrationDeadline).toLocaleDateString()}
            </p>
          </div>

          <div className="button-group">
            <button onClick={() => navigate("/events")} className="btn-back">
              ⬅ Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewEvent;
