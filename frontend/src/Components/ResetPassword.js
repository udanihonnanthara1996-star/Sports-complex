import React, { useState } from "react";
import API from "../utils/api"; // Import our custom API instance

function getParams() {
  const params = {};
  const search = window.location.search;
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

function ResetPassword() {
  const { token, email } = getParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await API.post("/api/v1/users/reset-password", {
        token,
        email,
        newPassword,
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(
        err.message || "Failed to reset password. Try again."
      );
    }
  };

  if (!token || !email) {
    return <div style={{ color: "red" }}>Invalid reset link.</div>
  }

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <div style={{ color: "green", marginTop: 8 }}>{message}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default ResetPassword;