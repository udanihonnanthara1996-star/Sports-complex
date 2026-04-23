import React, { useEffect, useState } from 'react';
import API from '../../utils/api'; // Import our custom API instance
import { useParams, useNavigate } from 'react-router-dom';

function UpdateUser() {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    role: "customer",
    status: "active",
    profile: {
      phone: "",
      address: "",
      photo: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchHandler = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/api/v1/users/${id}`);
        const user = res.data.user;

        setInputs({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "customer",
          status: user.status || "active",
          profile: {
            phone: (user.profile && user.profile.phone) || "",
            address: (user.profile && user.profile.address) || "",
            photo: (user.profile && user.profile.photo) || ""
          }
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to fetch user data: " + err.message);
        alert("Failed to fetch user data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchHandler();
    }
  }, [id]);

  const sendRequest = async () => {
    try {
      setLoading(true);
      setError("");
      await API.put(`/api/v1/users/${id}`, inputs);
      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user: " + err.message);
      alert("Failed to update user. Please check the console for more details.: " + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setInputs((prevState) => ({
        ...prevState,
        profile: {
          ...prevState.profile,
          [profileField]: value
        }
      }));
    } else {
      setInputs((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputs.name.trim() || !inputs.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const success = await sendRequest();
    if (success) {
      alert("User updated successfully!");
      navigate("/userdetails");
    }
  };

  const handleCancel = () => {
    navigate("/userdetails");
  };

  if (loading && !inputs.name) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "50vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Loading user data...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "600px", 
      margin: "40px auto", 
      padding: "30px", 
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        marginBottom: "30px", 
        color: "#202941",
        fontSize: "24px"
      }}>
        Update User
      </h2>
      
      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          color: "#dc2626", 
          padding: "12px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          border: "1px solid #fecaca"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Name *
          </label>
          <input 
            name="name" 
            value={inputs.name} 
            onChange={handleChange} 
            placeholder="Enter name" 
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Email *
          </label>
          <input 
            name="email" 
            value={inputs.email} 
            onChange={handleChange} 
            placeholder="Enter email" 
            type="email"
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Role
          </label>
          <select 
            name="role" 
            value={inputs.role} 
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box",
              backgroundColor: "#fff"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Status
          </label>
          <select 
            name="status" 
            value={inputs.status} 
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box",
              backgroundColor: "#fff"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Phone
          </label>
          <input 
            name="profile.phone" 
            value={inputs.profile.phone} 
            onChange={handleChange} 
            placeholder="Enter phone number" 
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Address
          </label>
          <input 
            name="profile.address" 
            value={inputs.profile.address} 
            onChange={handleChange} 
            placeholder="Enter address" 
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600", 
            color: "#374151" 
          }}>
            Photo URL
          </label>
          <input 
            name="profile.photo" 
            value={inputs.profile.photo} 
            onChange={handleChange} 
            placeholder="Enter photo URL" 
            type="url"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#33a467";
              e.target.style.boxShadow = "0 0 0 3px rgba(51, 164, 103, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ 
          display: "flex", 
          gap: "15px", 
          justifyContent: "center", 
          marginTop: "20px" 
        }}>
          <button 
            type="button"
            onClick={handleCancel}
            style={{
              padding: "12px 24px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f3f4f6";
            }}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#9ca3af" : "#33a467",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#2d8f57";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#33a467";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Updating..." : "Update User"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdateUser;