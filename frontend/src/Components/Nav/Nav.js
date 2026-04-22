import React from 'react'
import './nav.css';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";



function Nav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="logo">SportSync<span>.LK</span></div>
      <nav className="nav">
        <ul className="nav-list">
          <li><Link to="/home">Home</Link></li>
           <li><Link to="/itemlist">Facility</Link></li>
          <li><Link to="/bookingForm">Booking</Link></li>
          <li><Link to="/customer/events">Event</Link></li>
           <li><Link to="/payment">Payment</Link></li>
          <li><Link to="/feedback">Feedback</Link></li>
          <li><Link to="/tickets">Tickets</Link></li>
        </ul>
      </nav>
      <div className="auth-buttons" style={{marginLeft:'auto'}}>
        {/* Profile avatar button: placed immediately before logout */}
        <button className="profile-btn" onClick={() => navigate('/profile')} title="Profile">
          <ProfileAvatar />
        </button>

        <button onClick={handleLogout} className="logout" title="Logout">
          Logout
        </button>
      </div>
    </header>
  );
}

function ProfileAvatar(){
  const { auth } = useAuth();
  if(!auth) return <span className="avatar-fallback">P</span>;
  const photo = auth?.profile?.photo;
  if(photo){
    return <img src={photo} alt="Profile" className="nav-avatar" />;
  }
  // Fallback: initials
  const name = auth?.name || auth?.email || '';
  const initials = name ? name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'P';
  return <div className="avatar-fallback">{initials}</div>;
}

export default Nav