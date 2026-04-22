// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')}>🏆 SportSyncLK</div>
      <div className="links">
        <Link to="/">Dashboard</Link>
        <Link to="/events">Events</Link>
        <Link to="/events/add">Add Event</Link>

      </div>
    </nav>
  );
};

export default Navbar;
