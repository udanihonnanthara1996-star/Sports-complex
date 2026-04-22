import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard1.css';
import Navbar from './Navbar';

function Dashboard1() {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all events
        const eventsRes = await API.get('/api/v1/events');
        setAllEvents(eventsRes.data);
        
        // Filter events for selected month
        const filtered = eventsRes.data.filter(e => {
          const eventMonth = new Date(e.registrationDeadline).getMonth() + 1;
          return eventMonth === month;
        });
        setEvents(filtered);
        
        // Fetch all registrations for statistics
        const registrationsData = [];
        for (const event of eventsRes.data) {
          try {
            const regRes = await API.get(`/api/v1/events/${event._id}/registrations`);
            registrationsData.push(...regRes.data.map(reg => ({ ...reg, eventId: event._id, eventTitle: event.title })));
          } catch (err) {
            console.error(`Error fetching registrations for event ${event._id}:`, err);
          }
        }
        setRegistrations(registrationsData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month]);

  // Calculate statistics
  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const activeParticipants = registrations.filter(r => r.status === 'approved').length;
  const pendingRegistrations = registrations.filter(r => r.status === 'pending').length;

  // Generate monthly data for current year
  const generateMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map((name, index) => {
      const monthEvents = allEvents.filter(e => {
        const eventDate = new Date(e.createdAt);
        return eventDate.getMonth() === index && eventDate.getFullYear() === currentYear;
      });
      
      return {
        name,
        events: monthEvents.length,
        participants: monthEvents.reduce((sum, e) => sum + (e.participantsCount || 0), 0)
      };
    });
  };

  // Generate pie chart data based on event types
  const generatePieData = () => {
    const typeCount = {};
    events.forEach(event => {
      const type = event.type || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  const monthlyData = generateMonthlyData();
  const pieData = generatePieData();

  // ✅ Updated to black/white/green theme
  const COLORS = ['#22c55e', '#e2e8f0', '#000000'];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="blue">Sports</span> Event Management <span className="yellow">Dashboard</span>
        </h1>
        <p className="dashboard-subtitle">
          Comprehensive overview of your sports events, registrations, and participant analytics
        </p>
      </div>

      {/* Month Selector */}
      <div className="month-selector">
        <label>📅 Select Month:</label>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}>
          {monthNames.map((name, index) => (
            <option key={index} value={index + 1}>{name}</option>
          ))}
        </select>
        <span className="current-month-indicator">
          Currently viewing: <strong>{monthNames[month - 1]} 2024</strong>
        </span>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="value">{totalEvents}</p>
            <p className="change">This month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Active Participants</h3>
            <p className="value">{activeParticipants}</p>
            <p className="change">Approved registrations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Completed Events</h3>
            <p className="value">{completedEvents}</p>
            <p className="change">This month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Registrations</h3>
            <p className="value">{pendingRegistrations}</p>
            <p className="change">Awaiting approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>Upcoming Events</h3>
            <p className="value">{upcomingEvents}</p>
            <p className="change">This month</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-box">
          <h3>📊 Monthly Event Statistics - 2024</h3>
          <p className="chart-description">Events created and participants registered throughout the year</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#e2e8f0" />
              <YAxis stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Bar dataKey="events" fill="#22c55e" radius={[4, 4, 0, 0]} name="Events" />
              <Bar dataKey="participants" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Participants" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>🏆 Event Type Distribution - {monthNames[month - 1]}</h3>
          <p className="chart-description">Breakdown of event types for the selected month</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData.length > 0 ? pieData : [{ name: 'No Events', value: 1 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(pieData.length > 0 ? pieData : [{ name: 'No Events', value: 1 }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events Table at bottom */}
      <div className="events-table-container">
        <div className="table-header">
          <h3>📋 Events for {monthNames[month - 1]} 2024</h3>
          <p className="table-description">
            Detailed view of all events scheduled for the selected month with participant information
          </p>
        </div>
        
        {events.length === 0 ? (
          <div className="no-events-message">
            <div className="no-events-icon">📅</div>
            <h4>No Events Found</h4>
            <p>There are no events scheduled for {monthNames[month - 1]} 2024.</p>
            <p>Try selecting a different month or create new events.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Type</th>
                  <th>Venue</th>
                  <th>Registration Deadline</th>
                  <th>Participants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev._id}>
                    <td>
                      <div className="event-title-cell">
                        <strong>{ev.title}</strong>
                        {ev.description && (
                          <small>{ev.description.substring(0, 50)}...</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="event-type-badge">
                        {ev.type || 'General'}
                      </span>
                    </td>
                    <td>{ev.venue}</td>
                    <td>{new Date(ev.registrationDeadline).toLocaleDateString()}</td>
                    <td>
                      <div className="participants-cell">
                        <span className="participant-count">
                          {ev.participantsCount || 0}/{ev.maxParticipants}
                        </span>
                        <div className="participant-bar">
                          <div 
                            className="participant-fill" 
                            style={{ 
                              width: `${((ev.participantsCount || 0) / ev.maxParticipants) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${ev.status || 'upcoming'}`}>
                        {ev.status || 'upcoming'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard1;