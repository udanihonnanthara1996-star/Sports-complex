import React from 'react';
import './AdminNav.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function AdminNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { auth } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="admin-header-simple">
      <div className="admin-logo-simple">
        SportSync.<span>LK</span>
      </div>

      <nav className="admin-nav-container">
        <ul className="admin-nav-list">
     
          <li><Link to="/userdetails">User</Link></li>
          <li><Link to="/dashboard2">Facility</Link></li>
          <li><Link to="/booking">Booking</Link></li>
          <li><Link to="/dashboard">Events</Link></li>
          <li><Link to="/detailsPayment">Payment</Link></li>
          <li><Link to="/admin/tickets">Tickets</Link></li>
         
          <li>
            {/* Admin profile button - navigates to admin profile page */}
            <button type="button" className="admin-profile-btn" onClick={() => navigate('/admin/profile')}>
              {auth?.profile?.photo ? (
                <img src={auth.profile.photo} alt="avatar" className="admin-avatar" />
              ) : (
                <span className="admin-initials">{(auth?.name||'A').split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
              )}
            </button>
          </li>
          <li>
            <button type="button" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </nav>

      
    </header>
  );
}
