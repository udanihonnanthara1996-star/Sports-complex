import React from 'react';
import './FeatureNav.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function FeatureNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth();
  const isAdmin = auth?.role === 'ADMIN' || auth?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="feature-header">
      <div className="feature-logo">
        <span className="logo-text">SportSync<span className="accent">.LK</span></span>
      </div>
      <nav className="feature-nav">
        <ul className="feature-nav-list">
          <li>
            <Link to="/home" className={isActive('/home') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li className="feature-nav-separator">|</li>
          <li>
            <Link to="/feedback" className={isActive('/feedback') ? 'active' : ''}>
              Feedback
            </Link>
          </li>
          <li className="feature-nav-separator">|</li>
          <li>
            <Link to="/tickets" className={isActive('/tickets') ? 'active' : ''}>
              Tickets
            </Link>
          </li>
          {isAdmin && (
            <>
              <li className="feature-nav-separator">|</li>
              <li>
                <Link to="/userdetails" className={isActive('/userdetails') ? 'active' : ''}>
                  Admin
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      <div className="feature-actions">
        <button className="btn secondary" onClick={() => navigate('/home')}>
          Back to Main
        </button>
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}