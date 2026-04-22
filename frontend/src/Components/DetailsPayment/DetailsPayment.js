import React, { useEffect, useState } from "react";
import API from "../../utils/api"; // Import our custom API instance
import "./DetailsPayment.css";
import AdminNav from "../Admin/AdminNav";

// Use relative path since our API instance has the base URL
const URL = "/api/v1/payments";

function DetailsPayment() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Fetch users from backend and merge with localStorage
  const fetchUsers = async () => {
    try {
      const res = await API.get(URL);
      let serverUsers = [];
      if (res.data.users && Array.isArray(res.data.users)) serverUsers = res.data.users;
      else if (Array.isArray(res.data)) serverUsers = res.data;

      const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");

      const merged = [...local, ...serverUsers].reduce((acc, curr) => {
        const exists = acc.find(u => u._id === curr._id || u.email === curr.email);
        if (!exists) acc.push(curr);
        return acc;
      }, []);

      setUsers(merged);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users.");
      try {
        const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        setUsers(local);
      } catch (e) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    if (!user._id) {
      // LocalStorage user
      const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
      const updated = local.filter(u => u.email !== user.email);
      localStorage.setItem("submittedUsers", JSON.stringify(updated));
      setUsers(updated);
      return;
    }

    try {
      await API.delete(`${URL}/${user._id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user: " + err.message);
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id || user.email); // Use email as key for local users
    setEditValues({
      name: user.name || "",
      email: user.email || "",
      method: user.method || "",
      sport: user.sport || "",
      sportTime: user.sportTime || "",
      amount: user.amount || "",
      phone: user.phone || "",
    });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setEditErrors({});
  };

  const validateEdit = (vals) => {
    const errs = {};
    if (!vals.name.trim()) errs.name = "Name is required.";
    if (!vals.email.trim()) errs.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(vals.email)) errs.email = "Invalid email.";
    if (!vals.method) errs.method = "Payment method required.";
    if (!vals.sport) errs.sport = "Sport required.";
    if (!vals.sportTime) errs.sportTime = "Booking time required.";
    if (!vals.amount.toString().trim()) errs.amount = "Amount required.";
    if (!vals.phone.trim()) errs.phone = "Phone required.";
    else if (!/^\d{10}$/.test(vals.phone)) errs.phone = "Phone must be 10 digits.";
    return errs;
  };

  const saveEdit = async (id) => {
    const errs = validateEdit(editValues);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    try {
      if (!id || id.includes("@")) {
        // LocalStorage user
        const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        const updated = local.map(u => u.email === editValues.email ? { ...editValues } : u);
        localStorage.setItem("submittedUsers", JSON.stringify(updated));
        setUsers(updated);
        setEditingId(null);
        return;
      }

      // Backend user
      await API.put(`${URL}/${id}`, editValues);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Failed to save user: " + err.message);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <div>
      <AdminNav />
      <h1>All Users Details</h1>
      {users.map((user) => {
        const key = user._id || user.email;
        return (
          <div key={key} className="user-card">
            {editingId === (user._id || user.email) ? (
              <div className="edit-form">
                {/* Name & Email */}
                <div className="form-row">
                  <input
                    name="name"
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  />
                  <input
                    name="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                  />
                </div>
                {editErrors.name && <div className="error">{editErrors.name}</div>}
                {editErrors.email && <div className="error">{editErrors.email}</div>}

                {/* Method & Amount */}
                <div className="form-row">
                  <select
                    name="method"
                    value={editValues.method}
                    onChange={(e) => setEditValues({ ...editValues, method: e.target.value })}
                  >
                    <option value="">-- Select Payment Method --</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Master Card">Master Card</option>
                  </select>
                  <input
                    name="amount"
                    value={editValues.amount}
                    onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                  />
                </div>
                {editErrors.method && <div className="error">{editErrors.method}</div>}
                {editErrors.amount && <div className="error">{editErrors.amount}</div>}

                {/* Sport & Time */}
                <div className="form-row">
                  <select
                    name="sport"
                    value={editValues.sport}
                    onChange={(e) => setEditValues({ ...editValues, sport: e.target.value })}
                  >
                    <option value="">-- Select Sport --</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Table Tennis">Table Tennis</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                  </select>
                  <select
                    name="sportTime"
                    value={editValues.sportTime}
                    onChange={(e) => setEditValues({ ...editValues, sportTime: e.target.value })}
                  >
                    <option value="">-- Select Booking Time --</option>
                    <option value="8.00 - 9.00 AM">8.00 - 9.00 AM</option>
                    <option value="9.00 - 10.00 AM">9.00 - 10.00 AM</option>
                    <option value="10.00 - 11.00 AM">10.00 - 11.00 AM</option>
                    <option value="5.00 - 6.00 PM">5.00 - 6.00 PM</option>
                    <option value="6.00 - 7.00 PM">6.00 - 7.00 PM</option>
                  </select>
                </div>
                {editErrors.sport && <div className="error">{editErrors.sport}</div>}
                {editErrors.sportTime && <div className="error">{editErrors.sportTime}</div>}

                {/* Phone */}
                <div className="form-row">
                  <input
                    name="phone"
                    value={editValues.phone}
                    onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                  />
                </div>
                {editErrors.phone && <div className="error">{editErrors.phone}</div>}

                <div className="user-actions">
                  <button onClick={() => saveEdit(user._id || user.email)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                  <button onClick={() => handleDelete(user)}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                <h2>{user.name}</h2>
                <p>Email: {user.email}</p>
                <p>Method: {user.method}</p>
                <p>Sport: {user.sport}</p>
                <p>Sport Time: {user.sportTime}</p>
                <p>Amount: {user.amount}</p>
                <p>Phone: {user.phone}</p>
                <div className="user-actions">
                  <button onClick={() => startEdit(user)}>Edit</button>
                  <button onClick={() => handleDelete(user)}>Delete</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DetailsPayment;
