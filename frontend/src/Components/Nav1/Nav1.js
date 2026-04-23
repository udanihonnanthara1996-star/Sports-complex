import React from 'react';
import './Nav1.css';
import { Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";



function Nav1() {

  const { auth, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">
        SportSync.<span>LK</span>
      </div>
      <div className="nav-container">
        <ul className="nav-list1">
          <li><Link to="/home">Home</Link></li>
          {auth?.role === "admin" && (
            <>
              <li><Link to="/userdetails">User </Link></li>
              <li><Link to="/facility">Facility </Link></li>
              <li><Link to="/booking">Booking </Link></li>
              <li><Link to="/event">Events </Link></li>
              <li><Link to="/detailsPayment">Payment </Link></li>
              <li><Link to="/admin/tickets">Tickets</Link></li>
              <li><Link to="/feedback">Feedback</Link></li>
              <li><Link to="/adduser">Add User</Link></li>
            </>
          )}
          <li>
            {auth ? (
              <button onClick={logout}>Logout</button>
            ) : (
              <Link to="/">Login</Link>
            )}
          </li>
        </ul>
      </div>
      <div className="box">
        <form name="form1">
          <input type="text" name="search" placeholder="Search Here....." />
          <input type="submit" name="submit" value="Search" />
        </form>
      </div>
    </header>
  );
}

export default Nav1;