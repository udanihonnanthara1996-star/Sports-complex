import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import { useAuth } from "../Context/AuthContext";
import API from "../../utils/api"; // Import our custom API instance

function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  // Background and layout are handled in CSS (LandingPage.css)

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/api/v1/users/login", { email, password });
      const user = response.data;
      login(user);
      if (user.role === "admin") navigate("/userdetails");
      else navigate("/home");
    } catch (error) {
      alert(error.message || "Login failed");
    }
  };

  return (
    <div className="landing-bg">
      <div className="landing-overlay" />
      <div className="landing-container">
        <section className="hero">
          <h1>Sports Complex — Book, Play, Enjoy</h1>
          <p>Reserve courts, join events, and manage your bookings in one beautiful place. Fast booking, secure payments and instant confirmation.</p>
          <div className="hero-ctas">
            <button className="cta-btn cta-primary" onClick={() => navigate('/register')}>Get Started</button>
            <button className="cta-btn cta-ghost" onClick={() => navigate('/event')}>Explore Events</button>
          </div>
          <div className="features">
            <div className="feature"><span className="dot" /> 24/7 Online Booking</div>
            <div className="feature"><span className="dot" /> Secure Payments</div>
            <div className="feature"><span className="dot" /> Admin & Staff Tools</div>
          </div>
        </section>

        <aside className="glass-card">
          <h2>Welcome back</h2>
          <form className="glass-form" onSubmit={handleLogin}>
            <div className="input-wrapper">
              <span className="input-icon">&#128231;</span>
              <input
                type="email"
                placeholder="Email or Phone"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="input-wrapper">
              <span className="input-icon">&#128274;</span>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="forgot-row">
              <span className="forgot" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
            </div>
            <button className="login-btn" type="submit">LOGIN</button>
          </form>
          <div className="signup-row">
            <span>Don't have account? </span>
            <span className="signup-link" onClick={() => navigate('/register')}>SignUp Now</span>
          </div>
          <div className="admin-signup-row">
            <span>Need admin access? </span>
            <span className="admin-signup-link" onClick={() => navigate('/admin-register')}>Create Admin Account</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default LandingPage;