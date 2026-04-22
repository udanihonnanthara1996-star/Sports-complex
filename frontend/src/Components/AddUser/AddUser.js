import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api'; // Import our custom API instance
import './AddUser.css'; // Add this import for custom styling

function AddUser() {
  const history = useNavigate();
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
    profile: "", 
  });
  const handleChange = (e) => {
    setInputs(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendRequest();
      history("/userdetails");
    } catch (error) {
      alert("Failed to add user: " + error.message);
    }
  };

  const sendRequest = async () => {
    await API.post("/api/v1/users", {
      name: String(inputs.name),
      email: String(inputs.email),
      password: String(inputs.password),
      role: String(inputs.role),
      status: String(inputs.status),
      profile: String(inputs.profile),
    });
  };

  return (
    <div className="add-user-container">
      <h1>Add User</h1>
      <form className="add-user-form" onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" onChange={handleChange} value={inputs.name} placeholder="Enter name" />

        <label>Email:</label>
        <input type="email" name="email" onChange={handleChange} value={inputs.email} placeholder="Enter email" />

        <label>Password:</label>
        <input type="password" name="password" onChange={handleChange} value={inputs.password} placeholder="Enter password" />

        <label>Role:</label>
        <input type="text" name="role" onChange={handleChange} value={inputs.role} placeholder="Enter role" />

        <label>Status:</label>
        <input type="text" name="status" onChange={handleChange} value={inputs.status} placeholder="Enter status" />

        <label>Profile:</label>
        <input type="text" name="profile" onChange={handleChange} value={inputs.profile} placeholder="Enter profile" />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default AddUser;