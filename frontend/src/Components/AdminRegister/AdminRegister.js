import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import "./AdminRegister.css";

function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    adminCode: "" // Simple admin code to prevent abuse
  });
  const [errors, setErrors] = useState({});

  const registerBgStyle = {
    minHeight: "100vh",
    width: "100vw",
    background: "url('/football-stadium.jpg') center center/cover no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const handleChange = e => {
    let { name, value } = e.target;
    if(name === 'phone'){
      value = (value || '').replace(/\D/g, '');
    }
    setForm({ ...form, [name]: value });
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validators = {
    name: v => v && v.trim().length >= 3 ? '' : 'Please enter your full name (min 3 chars)',
    email: v => /^\S+@\S+\.\S+$/.test(v) ? '' : 'Please enter a valid email',
    phone: v => /^0\d{9}$/.test(v) ? '' : 'Phone must be exactly 10 digits and start with 0',
    password: v => v && v.length >= 6 ? '' : 'Password must be at least 6 characters',
    confirmPassword: v => v === form.password ? '' : 'Passwords do not match',
    adminCode: v => v === 'ADMIN123' ? '' : 'Invalid admin code'
  };

  const validateAll = () => {
    const next = {};
    Object.keys(validators).forEach(key => {
      const err = validators[key](form[key]);
      if(err) next[key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if(!validateAll()) return;

    try {
      const response = await API.post("/api/v1/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "admin", // Force admin role
        phone: form.phone
      });

      if (response.status === 201) {
        alert("Admin account created successfully!");
        navigate("/");
      } else {
        alert(response.data.message || "Admin registration failed!");
      }
    } catch (error) {
      alert("Registration failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="register-bg">
      <div style={registerBgStyle}>
        <form className="register-form" onSubmit={handleSubmit}>
          <h2>Create Admin Account</h2>
          <p className="admin-note">This creates an administrator account with full system access</p>
          
          <div className="form-field full">
            <input
              type="text"
              placeholder="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              aria-invalid={!!errors.name}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          
          <div className="form-field full">
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          
          <div className="form-field full">
            <input
              type="tel"
              placeholder="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>
          
          <div className="form-field full">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          
          <div className="form-field full">
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
          </div>
          
          <div className="form-field full">
            <input
              type="text"
              placeholder="Admin Code (ADMIN123)"
              name="adminCode"
              value={form.adminCode}
              onChange={handleChange}
              aria-invalid={!!errors.adminCode}
            />
            {errors.adminCode && <div className="field-error">{errors.adminCode}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary btn-admin" disabled={!form.name || !form.email || !form.password}>
            Create Admin Account
          </button>
          
          <p>
            Need regular user account?
            <span className="login-link" onClick={() => navigate("/register")}> Register Here</span>
          </p>
          
          <p>
            Already have account?
            <span className="login-link" onClick={() => navigate("/")}> Login</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminRegister;
