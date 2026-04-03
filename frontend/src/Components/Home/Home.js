import React from "react"
import "./Home.css";
import "boxicons";
import LOGO from './logo2.jpg';
import { Link } from "react-router-dom";
import Nav from "../Nav/Nav";


function Home() {
  return (
    <div>
  
      <Nav/>
      <div className="contain">
        <div className="box-icon">
          <box-icon name="facebook-circle" type="logo"></box-icon>
          <box-icon name="instagram" type="logo"></box-icon>
          <box-icon name="twitter" type="logo"></box-icon>
        </div>

        <h1 className="header1" style={{fontWeight: "800"}}>
          <span style={{ color: "#ffffffff" }}> Indoor</span>
          <span style={{ color: "#06c599ff" }}> Booking</span>
          <span style={{ color: "#f5f5f5ff" }}> Made<br/></span>
          <span style={{ color: "#ffffffff" }}> Easy</span>
        </h1>
        <button type="submit" className="btn2">
          Book Now
        </button>
      </div>

      <div className="container">
        <header>
          <h1>Sports Facilities Finder</h1>
          <p className="subtitle">Discover and book sports facilities in your area. Find the perfect place to play your favorite sports.</p>
        </header>
                    
        <div className="sports-grid">
          {/* Tennis Card */}
          <div className="sport-card">
            <div className="card-header tennis-header">
              <h2>Tennis</h2>
              <i className="fas fa-tennis-ball"></i>
            </div>
            <div className="card-content">
              <h3>Tennis Courts</h3>
              <p>Access tennis courts with various surfaces including grass, clay, and hard courts.</p>
              <span className="facilities-count">0+ Facilities</span>
              <br />
              <a href="#" className="explore-btn">
                Explore <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
                        
          {/* Basketball Card */}
          <div className="sport-card">
            <div className="card-header basketball-header">
              <h2>Basketball</h2>
              <i className="fas fa-basketball-ball"></i>
            </div>
            <div className="card-content">
              <h3>Basketball Courts</h3>
              <p>Find indoor and outdoor basketball courts for casual games or competitive matches.</p>
              <span className="facilities-count">0+ Facilities</span>
              <br />
              <a href="#" className="explore-btn">
                Explore <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
                        
          {/* Cricket Card */}
          <div className="sport-card">
            <div className="card-header cricket-header">
              <h2>Cricket</h2>
              <i className="fas fa-baseball-ball"></i>
            </div>
            <div className="card-content">
              <h3>Cricket Grounds</h3>
              <p>Cricket is a bat-and-ball game where two teams compete to score the most runs.</p>
              <span className="facilities-count">0+ Facilities</span>
              <br />
              <a href="#" className="explore-btn">
                Explore <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>

          {/* Gym Card */}
          <div className="sport-card">
            <div className="card-header gym-header">
              <h2>Gym</h2>
              <i className="fas fa-dumbbell"></i>
            </div>
            <div className="card-content">
              <h3>Gym Indoor</h3>
              <p>We hope this helps you navigate your gym of choice with a little more confidence</p>
              <span className="facilities-count">0+ Facilities</span>
              <br />
              <a href="#" className="explore-btn">
                Explore <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>

          {/* Table Tennis Card */}
          <div className="sport-card">
            <div className="card-header tabletennis-header">
              <h2>Table Tennis</h2>
              <i className="fas fa-table-tennis"></i>
            </div>
            <div className="card-content">
              <h3>Table Tennis Courts</h3>
              <p>Find indoor and outdoor Table Tennis courts for casual games or competitive matches.</p>
              <span className="facilities-count">0+ Facilities</span>
              <br />
              <a href="#" className="explore-btn">
                Explore <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
                        
          {/* All Sports Card */}
          <div className="sport-card">
            <div className="card-header all-sports-header">
              <h2>All Sports</h2>
              <i className="fas fa-running"></i>
            </div>
            <div className="card-content">
              <h3>Explore All Sports</h3>
              <p>Discover all 3+ sports categories and find the perfect facilities for your passion.</p>
              <br />
              <a href="#" className="explore-btn">
                View All Categories <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
                    
        <button className="view-all-btn">
          View All Sports Facilities
        </button>
      </div>
            
      <section className="hero">
        <div className="hero-content">
          <h1>
            <span className="highlight">Ready to Elevate</span><br />
            Your sports experience?
          </h1>
          <p>
            Join Sport.LK today and connect with the best sports facilities across Sri Lanka.
            Book facilities, coordinate transportation, find equipment, and support talented
            athletes all on one platform.
          </p>
          <div className="hero-buttons">
            <a href="" className="btn btn-primary">Book a Facility Now</a>
            <a href="#" className="btn btn-outline">Explore Features</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-col">
            <img
              src={LOGO}
              alt="Olympic Indoor Sports Logo"
              className="footer-logo"
            />
            <h3>INDOOR SPORT.LK</h3>
            <p>
              © 2025 INDOOR SPORTLK.
              <br />
              All rights reserved.
            </p>
            <div className="box-icon2">
              <box-icon
                name="facebook-circle"
                type="logo"
                color=" #4267B2"
              ></box-icon>
              <box-icon name="instagram" type="logo" color="#E1306C"></box-icon>
              <box-icon name="twitter" type="logo" color="#1DA1F2"></box-icon>
            </div>
          </div>
          <div className="footer-col">
            <h3>Contact Us</h3>
            <ul>
              <li>
                <a href="#"> 237/A Malabe, Kollupitiya</a>
              </li>
              <li>
                <a href="#"> +94776957704</a>
              </li>
              <li>
                <a href="#"> +94776955505</a>
              </li>
              <li>
                <a href="#"> sport.lk@gmail.com</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Business Hours</h3>
            <p>
              <h5>Monday   - 8:00AM - 12:00PM</h5>
              <h5>Tuesday  - 8:00AM - 12:00PM</h5>
              <h5>Wednesday- 8:00AM - 12:00PM</h5>
              <h5>Thursday - 8:00AM - 12:00PM</h5>
              <h5>Friday   - 8:00AM - 12:00PM</h5>
              <h5>Saturday - 24Hours</h5>
              <h5>Sunday   -  24Hours</h5>
            </p>
          </div>

          <div className="footer-col">
            <h3>Legal</h3>
            <ul>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
              <li>
                <a href="#">Cookie policy</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;