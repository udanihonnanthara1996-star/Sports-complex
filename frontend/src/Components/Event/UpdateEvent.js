import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from '../../utils/api';

function UpdateEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState({
    image: "",
    eventId: "",
    title: "",
    type: "",
    description: "",
    time: "",
    venue: "",
    maxParticipants: "",
    judgeBoard: "",
    registrationDeadline: "",
    participantsCount: "",
    contact: "",
    status: "",
  });

  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch existing event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/api/v1/events/${id}`);
        const e = res.data;
        setEvent({
          image: e.image || "",
          eventId: e.eventId || "",
          title: e.title || "",
          type: e.type || "",
          description: e.description || "",
          time: e.time ? e.time.slice(0, 16) : "",
          venue: e.venue || "",
          maxParticipants: e.maxParticipants || "",
          judgeBoard: e.judgeBoard || "",
          registrationDeadline: e.registrationDeadline
            ? e.registrationDeadline.split("T")[0]
            : "",
          participantsCount: e.participantsCount || "",
          contact: e.contact || "",
          status: e.status || "",
        });
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setImage(files[0]);
      setEvent((prev) => ({ ...prev, image: files[0].name }));
    } else {
      setEvent((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  // ✅ Validations (same as AddEvent)
  const validateField = (name, value) => {
    let error = "";
    // Normalize value to a string for safe trim()/regex operations
    const valStr = value == null ? "" : (typeof value === "string" ? value : String(value));

    switch (name) {
      case "eventId":
        if (!valStr.trim()) error = "Event ID is required.";
        else if (!/^EV\d{4}$/.test(valStr))
          error = "Event ID must be like EV1234 (starts with EV and 4 digits).";
        break;
      case "title":
        if (!valStr.trim()) error = "Title is required.";
        else if (!/^[A-Za-z\s]+$/.test(valStr))
          error = "Title can contain only letters and spaces.";
        break;
      case "type":
        if (!valStr.trim()) error = "Type is required.";
        break;
      case "description":
        if (!valStr.trim()) error = "Description is required.";
        else if (/^\d+$/.test(valStr))
          error = "Description cannot be only numbers.";
        else if (/^[^A-Za-z0-9]+$/.test(valStr))
          error = "Description cannot be only symbols.";
        break;
      case "time":
        if (!value) error = "Time is required.";
        else {
          const selectedTime = new Date(value);
          const now = new Date();
          if (selectedTime < now)
            error = "Event time cannot be in the past.";
        }
        break;
      case "venue":
        if (!valStr.trim()) error = "Venue is required.";
        break;
      case "maxParticipants":
        if (!value) error = "Max Participants is required.";
        else if (Number(value) <= 0)
          error = "Max Participants must be greater than 0.";
        break;
      case "judgeBoard":
        if (!valStr.trim()) error = "Judge Board is required.";
        else if (/^\d+$/.test(valStr))
          error = "Judge Board cannot contain only numbers.";
        break;
      case "registrationDeadline":
        if (!value) error = "Registration deadline is required.";
        else {
          const today = new Date(new Date().toDateString());
          const selectedDate = new Date(value);
          if (selectedDate < today)
            error = "Registration deadline cannot be in the past.";
        }
        break;
      case "participantsCount":
        if (Number(value) < 0)
          error = "Participants count cannot be negative.";
        break;
      case "contact":
        if (!/^0\d{9}$/.test(valStr))
          error = "Contact must be 10 digits and start with 0.";
        break;
      case "status":
        if (!valStr.trim()) error = "Status is required.";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    Object.entries(event).forEach(([key, val]) => validateField(key, val));

    if (Object.values(errors).some((err) => err)) {
      alert("Please fix validation errors before updating.");
      return;
    }

    try {
      await API.put(`/api/v1/events/${id}`, event);
      alert("✅ Event updated successfully!");
      navigate("/events");
    } catch (err) {
      console.error("Error updating event:", err);
      alert("❌ Failed to update event. Try again.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        background: "#000",
        color: "#e2e8f0",
        borderRadius: "18px",
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#22c55e",
          marginBottom: "20px",
        }}
      >
        ✏️ Update Event
      </h1>

      <form
        onSubmit={handleUpdate}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          background: "#111",
          padding: "25px",
          borderRadius: "12px",
        }}
        encType="multipart/form-data"
      >
        {/* Image */}
        <div>
          <label style={{ color: "#22c55e" }}>Event Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {image && (
            <small style={{ color: "#22c55e" }}>{image.name}</small>
          )}
        </div>

        {/* Event ID */}
        <div>
          <label style={{ color: "#22c55e" }}>Event ID</label>
          <input
            type="text"
            name="eventId"
            value={event.eventId}
            onChange={handleChange}
            disabled
            style={{
              width: "100%",
              padding: "8px",
              background: "#333",
              color: "#aaa",
              borderRadius: "6px",
            }}
          />
        </div>

        {/* Title */}
        <div>
          <label style={{ color: "#22c55e" }}>Title</label>
          <input
            type="text"
            name="title"
            value={event.title}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.title && (
            <small style={{ color: "red" }}>{errors.title}</small>
          )}
        </div>

        {/* Type */}
        <div>
          <label style={{ color: "#22c55e" }}>Type</label>
          <select
            name="type"
            value={event.type}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          >
            <option value="">-- Select Type --</option>
            <option value="Tournament">Tournament</option>
            <option value="Match">Match</option>
            <option value="Training">Training Session</option>
          </select>
          {errors.type && (
            <small style={{ color: "red" }}>{errors.type}</small>
          )}
        </div>

        {/* Description */}
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ color: "#22c55e" }}>Description</label>
          <textarea
            name="description"
            value={event.description}
            onChange={handleChange}
            rows="3"
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.description && (
            <small style={{ color: "red" }}>{errors.description}</small>
          )}
        </div>

        {/* Time */}
        <div>
          <label style={{ color: "#22c55e" }}>Time</label>
          <input
            type="datetime-local"
            name="time"
            value={event.time}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.time && <small style={{ color: "red" }}>{errors.time}</small>}
        </div>

        {/* Venue */}
        <div>
          <label style={{ color: "#22c55e" }}>Venue</label>
          <select
            name="venue"
            value={event.venue}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          >
            <option value="">-- Select Ground --</option>
            <option value="Ground A">Ground A</option>
            <option value="Ground B">Ground B</option>
            <option value="Ground C">Ground C</option>
            <option value="Ground D">Ground D</option>
          </select>
          {errors.venue && (
            <small style={{ color: "red" }}>{errors.venue}</small>
          )}
        </div>

        {/* Max Participants */}
        <div>
          <label style={{ color: "#22c55e" }}>Max Participants</label>
          <input
            type="number"
            name="maxParticipants"
            value={event.maxParticipants}
            onChange={handleChange}
            min="1"
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.maxParticipants && (
            <small style={{ color: "red" }}>{errors.maxParticipants}</small>
          )}
        </div>

        {/* Judge Board */}
        <div>
          <label style={{ color: "#22c55e" }}>Judge Board</label>
          <input
            type="text"
            name="judgeBoard"
            value={event.judgeBoard}
            onChange={handleChange}
            placeholder="Judge1, Judge2"
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.judgeBoard && (
            <small style={{ color: "red" }}>{errors.judgeBoard}</small>
          )}
        </div>

        {/* Registration Deadline */}
        <div>
          <label style={{ color: "#22c55e" }}>Registration Deadline</label>
          <input
            type="date"
            name="registrationDeadline"
            value={event.registrationDeadline}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.registrationDeadline && (
            <small style={{ color: "red" }}>
              {errors.registrationDeadline}
            </small>
          )}
        </div>

        {/* Participants Count */}
        <div>
          <label style={{ color: "#22c55e" }}>Participants Count</label>
          <input
            type="number"
            name="participantsCount"
            value={event.participantsCount}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.participantsCount && (
            <small style={{ color: "red" }}>{errors.participantsCount}</small>
          )}
        </div>

        {/* Contact */}
        <div>
          <label style={{ color: "#22c55e" }}>Contact</label>
          <input
            type="text"
            name="contact"
            value={event.contact}
            onChange={handleChange}
            placeholder="10 digits starting with 0"
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.contact && (
            <small style={{ color: "red" }}>{errors.contact}</small>
          )}
        </div>

        {/* Status */}
        <div>
          <label style={{ color: "#22c55e" }}>Status</label>
          <input
            type="text"
            name="status"
            value={event.status}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              background: "#222",
              color: "#fff",
              borderRadius: "6px",
            }}
          />
          {errors.status && (
            <small style={{ color: "red" }}>{errors.status}</small>
          )}
        </div>

        {/* Update Button */}
        <div
          style={{
            gridColumn: "span 2",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #000000, #22c55e)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Update Event
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdateEvent;
