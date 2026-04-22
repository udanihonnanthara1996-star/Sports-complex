// src/components/EventList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import './EventList.css';

function EventList() {
  const [events, setEvents] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/api/v1/events').then(res => setEvents(res.data));
  }, []);

  const handleDelete = async id => {
    if (window.confirm('Are you sure?')) {
      await API.delete(`/api/v1/events/${id}`);
      setEvents(events.filter(e => e._id !== id));
    }
  };

  const filtered = events.filter(e => {
    const matchesTitle = (e.title || '').toLowerCase().includes(searchTitle.toLowerCase());
    const matchesDate = dateFilter
      ? new Date(e.registrationDeadline).toLocaleDateString('en-CA') === dateFilter
      : true;
    const matchesVenue = venueFilter ? e.venue === venueFilter : true;
    return matchesTitle && matchesDate && matchesVenue;
  });

  return (
    <div className="event-list">
      <div className="page-header">
        <h2>📋 Event Management Center</h2>
        <p className="page-description">
          Manage all your sports events from one central location. Create, edit, delete events and monitor registrations with powerful filtering and search capabilities.
        </p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={e => setSearchTitle(e.target.value)}
          className="search-bar"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="search-bar date-picker"
        />
        <select
          value={venueFilter}
          onChange={e => setVenueFilter(e.target.value)}
          className="search-bar"
        >
          <option value="">All Venues</option>
          <option value="Ground A">Ground A</option>
          <option value="Ground B">Ground B</option>
          <option value="Ground C">Ground C</option>
          <option value="Ground D">Ground D</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Venue</th>
            <th>Deadline</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <tr key={e._id}>
              <td>{e.title}</td>
              <td>{e.venue}</td>
              <td>{new Date(e.registrationDeadline).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => navigate(`/events/update/${e._id}`)}
                  className="btn-edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(e._id)}
                  className="btn-delete"
                >
                  Delete
                </button>
                <button
                  onClick={() => navigate(`/events/view/${e._id}`)}
                  className="btn-view"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/events/${e._id}/registrations`)}
                  className="btn-view-registrations"
                >
                  View Registrations
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EventList;
