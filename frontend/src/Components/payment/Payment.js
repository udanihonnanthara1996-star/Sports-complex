import React, { useEffect, useState } from "react";
import API from "../../utils/api"; // Import our custom API instance
import "./Payment.css";
import Nav from "../Nav/Nav";
import jsPDF from "jspdf";

// Use relative path since our API instance has the base URL
const URL = "/api/v1/payments";

function Payment() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    method: "",
    sport: "",
    sportTime: "",
    amount: "",
    phone: "",
    cardN: "",
  });

  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    
    if (!formData.method) {
      newErrors.method = "Payment method is required.";
    }

    const cleanCardN = formData.cardN.replace(/-/g, "");
    if (!formData.cardN.trim()) {
      newErrors.cardN = "Card number is required.";
    } else if (!/^\d{16}$/.test(cleanCardN)) {
      newErrors.cardN = "Card number must be exactly 16 digits.";
    } else if (formData.method === "Master Card" && !/^5[1-5]/.test(cleanCardN) && !/^2[2-7]/.test(cleanCardN)) {
      newErrors.cardN = "Invalid Master Card number. It should start with 51-55 or 22-27.";
    } else if (formData.method === "Credit Card" && !/^4/.test(cleanCardN)) {
      // Assuming 'Credit Card' implies Visa in this context for demonstration
      newErrors.cardN = "Invalid Visa Credit Card number. It should start with 4.";
    }

    if (!formData.sport) newErrors.sport = "Sport is required.";
    if (!formData.sportTime) newErrors.sportTime = "Booking time is required.";
    
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required.";
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a valid positive number.";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Create a single string of all errors to show in the popup alert
      const errorMessage = Object.values(validationErrors).join("\n- ");
      alert("Please fix the following validation errors:\n\n- " + errorMessage);
      
      return;
    }
    try {
      // POST to the same base URL used for fetching payments
      await API.post(URL, formData);
      setSuccess(true);
      generatePDF();
      // store the submitted user locally so UserDetails can pick it up immediately
      const submitted = { ...formData };
      try {
        const existing = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        existing.unshift(submitted);
        localStorage.setItem("submittedUsers", JSON.stringify(existing));
      } catch (e) {
        console.error("localStorage write failed", e);
      }

      setFormData({
        name: "",
        email: "",
        method: "",
        sport: "",
        sportTime: "",
        amount: "",
        phone: "",
        cardN: "",
      });
      setErrors({});
    } catch (err) {
      console.error("Error submitting payment:", err);
      alert("Error submitting payment: " + err.message);
    }
  };

  // PDF generation function
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Customer Payment Details", 20, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${formData.name}`, 20, 40);
    doc.text(`Email: ${formData.email}`, 20, 50);
    doc.text(`Payment Method: ${formData.method}`, 20, 60);
    doc.text(`Sport: ${formData.sport}`, 20, 70);
    doc.text(`Booking Time: ${formData.sportTime}`, 20, 80);
    doc.text(`Amount: ${formData.amount}`, 20, 90);
    doc.text(`Phone: ${formData.phone}`, 20, 100);

    doc.save("payment-details.pdf");
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get(URL);
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res.data.users && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        // Prefer backend-provided message if available
        const serverMsg = err.response && (err.response.data && (err.response.data.message || err.response.data.error))
          ? (err.response.data.message || err.response.data.error)
          : null;
        setError(serverMsg || err.message || "Failed to fetch users.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
  
    
    <div className="payment-page">
        <Nav />
      <div className="body1">
        <div className="payment-container beautiful-form">
          <h2>
            <span role="img" aria-label="payment" style={{ marginRight: "8px" }}></span>
            Payment Form
          </h2>

          {success && (
            <div className="success-message">
              <span role="img" aria-label="success">✅</span> Payment Successful!
            </div>
          )}

          <button onClick={generatePDF} className="download-pdf-btn">
            <span role="img" aria-label="download" style={{ marginRight: "6px" }}></span>
            Download PDF
          </button>

          <form onSubmit={handleSubmit} className="payment-form grid-form">
            <div className="form-row">
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              <input type="text" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
            </div>
            {(errors.name || errors.email) && (
              <div className="form-errors">
                {errors.name && <p className="error-text">{errors.name}</p>}
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            )}
            <div className="form-row">
              <select name="method" value={formData.method} onChange={handleChange} required>
                <option value="">-- Select Payment Method --</option>
                <option value="Credit Card">💳 Credit Card</option>
                <option value="Master Card">💳 Master Card</option>
              </select>
              <input type="text" name="cardN" placeholder="Card Number (1111-2222-3333-4444)" value={formData.cardN} onChange={handleChange} required />
            </div>
            {(errors.method || errors.cardN) && (
              <div className="form-errors">
                {errors.method && <p className="error-text">{errors.method}</p>}
                {errors.cardN && <p className="error-text">{errors.cardN}</p>}
              </div>
            )}
            <div className="form-row">
              <select name="sport" value={formData.sport} onChange={handleChange} required>
                <option value="">-- Select Sport --</option>
                <option value="Badminton"> Badminton</option>
                <option value="Cricket"> Cricket</option>
                <option value="Table Tennis"> Table Tennis</option>
                <option value="Basketball"> Basketball</option>
                <option value="volleyball"> Volleyball</option>
              </select>
              <select name="sportTime" value={formData.sportTime} onChange={handleChange} required>
                <option value="">-- Select Booking Time --</option>
                <option value="8.00 - 9.00 AM">8.00 - 9.00 AM</option>
                <option value="9.00 - 10.00 AM">9.00 - 10.00 AM</option>
                <option value="10.00 - 11.00 AM">10.00 - 11.00 AM</option>
                <option value="5.00 - 6.00 PM">5.00 - 6.00 PM</option>
                <option value="6.00 - 7.00 PM">6.00 - 7.00 PM</option>
              </select>
            </div>
            {(errors.sport || errors.sportTime) && (
              <div className="form-errors">
                {errors.sport && <p className="error-text">{errors.sport}</p>}
                {errors.sportTime && <p className="error-text">{errors.sportTime}</p>}
              </div>
            )}
            <div className="form-row">
              <input type="text" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} required />
              <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
            </div>
            {(errors.amount || errors.phone) && (
              <div className="form-errors">
                {errors.amount && <p className="error-text">{errors.amount}</p>}
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            )}
            <button type="submit" className="pay-btn">
              <span role="img" aria-label="pay"></span> Pay Now
            </button>
          </form>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div className="users-list">
            {users.length > 0 ? (
              <div>
                <h3>Saved Payments</h3>
                <ul>
                  {users.map((userItem, index) => (
                    <li key={index} className="payment-user-item">
                      <strong>{userItem.name || userItem.email || `Payment ${index + 1}`}</strong>
                      {userItem.email && <span> — {userItem.email}</span>}
                      {userItem.amount && <span> | Amount: {userItem.amount}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No saved payments available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;
