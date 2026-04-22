import React from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api'; // Import our custom API instance
import { useNavigate } from 'react-router-dom';

function User(props) {
    // Safely handle undefined props.user
    if (!props.user) {
        return <div>No user data available.</div>;
    }

    const { _id, name, email, password, role, status, profile } = props.user;

    const history = useNavigate();

    const deleteHandler = async () => {
        try {
            await API.delete(`/api/v1/users/${_id}`);
            history("/");
            history("/userdetails");
        } catch (error) {
            alert("Failed to delete user: " + error.message);
        }
    }

    return (
        <div>
            <h1>User Display</h1>
            <br />

            <h1>ID :{_id}</h1>
            <h1>Name :{name}</h1>
            <h1>Email :{email}</h1>
            <h1>Password :{password}</h1>
            <h1>Role :{role}</h1>
            <h1>Status :{status}</h1>
            <h1>profile :{profile}</h1>
            <Link to={`userdetails/${_id}`}>Update</Link>
            <button onClick={deleteHandler}>Delete</button>
        </div>
    );
}

export default User;