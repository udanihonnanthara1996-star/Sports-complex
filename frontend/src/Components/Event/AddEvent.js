import React, { useState } from "react";
import API from "../../utils/api"; // Import our custom API instance
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function AddEvent() {
  const [event, setEvent] = useState({
    name: "",
    type: "",
    description: "",
    date: "",
    location: "",
    maxParticipants: "",
    judgeBoard: "",
    registrationDeadline: "",
    contact: ""
  });

  const [errors, setErrors] = useState({});
  const [savedEvent, setSavedEvent] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";
    const valStr = value == null ? "" : (typeof value === "string" ? value : String(value));
    switch (name) {
      case "name": if(!valStr.trim()) error="Event name is required."; break;
      case "type": if(!value) error="Type is required."; break;
      case "description": if(!valStr.trim()) error="Description is required."; break;
      case "date": 
        if(!value) error="Date & Time required."; 
        else if(new Date(value) < new Date()) error="Event date cannot be in the past.";
        break;
      case "location": if(!value) error="Location is required."; break;
      case "maxParticipants":
        if(!value) error="Max Participants required."; 
        else if(Number(value)<=0) error="Must be greater than 0."; 
        break;
  case "judgeBoard": if(!valStr.trim()) error="Judge Board is required."; break;
      case "registrationDeadline":
        if(!value) error="Registration Deadline required."; 
        else if(new Date(value) < new Date().setHours(0,0,0,0)) error="Deadline cannot be in past.";
        break;
      case "contact":
        if(!/^0\d{9}$/.test(valStr)) error="Contact must be 10 digits starting with 0."; 
        break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Object.entries(event).forEach(([key,val])=>validateField(key,val));
    if(Object.values(errors).some(err=>err)){ alert("Fix errors first."); return; }

    // Map frontend -> backend fields
    const formattedEvent = {
      title: event.name,
      type: event.type,
      description: event.description,
      time: event.date,
      venue: event.location,
      maxParticipants: Number(event.maxParticipants),
      judgeBoard: event.judgeBoard.split(',').map(s=>s.trim()),
      registrationDeadline: event.registrationDeadline,
      contacts: [event.contact]
    };

    try {
      const res = await API.post("/api/v1/events", formattedEvent);
      setSavedEvent(res.data);
      alert("✅ Event saved successfully!");
    } catch(err){
      console.error("Error saving:", err.message);
      alert("❌ Failed to save event: " + err.message);
    }
  };

  const downloadPDF = () => {
    if(!savedEvent){ alert("Save first!"); return; }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Event Details", 14, 20);
    const rows = Object.entries(savedEvent).map(([k,v]) => [k, Array.isArray(v)?v.join(', '):v]);
    autoTable(doc, { startY:30, head:[["Field","Value"]], body:rows, theme:"grid" });
    doc.save(`${savedEvent.title || "Event"}-Details.pdf`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏆 Create New Event</h1>
      <form onSubmit={handleSubmit} style={styles.form}>

        <div style={styles.group}>
          <label>Event Name</label>
          <input type="text" name="name" value={event.name} onChange={handleChange} style={styles.input}/>
          {errors.name && <small style={styles.error}>{errors.name}</small>}
        </div>

        <div style={styles.group}>
          <label>Type</label>
          <select name="type" value={event.type} onChange={handleChange} style={styles.input}>
            <option value="">-- Select Type --</option>
            <option value="Tournament">Tournament</option>
            <option value="Match">Match</option>
            <option value="Training Session">Training Session</option>
          </select>
          {errors.type && <small style={styles.error}>{errors.type}</small>}
        </div>

        <div style={styles.group}>
          <label>Venue</label>
          <select name="location" value={event.location} onChange={handleChange} style={styles.input}>
            <option value="">-- Select Venue --</option>
            <option value="Ground A">Ground A</option>
            <option value="Ground B">Ground B</option>
            <option value="Ground C">Ground C</option>
            <option value="Ground D">Ground D</option>
          </select>
          {errors.location && <small style={styles.error}>{errors.location}</small>}
        </div>

        <div style={styles.groupFull}>
          <label>Description</label>
          <textarea name="description" value={event.description} onChange={handleChange} rows="3" style={styles.textarea}/>
          {errors.description && <small style={styles.error}>{errors.description}</small>}
        </div>

        <div style={styles.group}>
          <label>Date & Time</label>
          <input type="datetime-local" name="date" value={event.date} onChange={handleChange} style={styles.input}/>
          {errors.date && <small style={styles.error}>{errors.date}</small>}
        </div>

        <div style={styles.group}>
          <label>Max Participants</label>
          <input type="number" name="maxParticipants" value={event.maxParticipants} onChange={handleChange} style={styles.input}/>
          {errors.maxParticipants && <small style={styles.error}>{errors.maxParticipants}</small>}
        </div>

        <div style={styles.group}>
          <label>Judge Board (comma-separated)</label>
          <input type="text" name="judgeBoard" value={event.judgeBoard} onChange={handleChange} style={styles.input}/>
          {errors.judgeBoard && <small style={styles.error}>{errors.judgeBoard}</small>}
        </div>

        <div style={styles.group}>
          <label>Registration Deadline</label>
          <input type="date" name="registrationDeadline" value={event.registrationDeadline} onChange={handleChange} style={styles.input}/>
          {errors.registrationDeadline && <small style={styles.error}>{errors.registrationDeadline}</small>}
        </div>

        <div style={styles.group}>
          <label>Contact</label>
          <input type="text" name="contact" value={event.contact} onChange={handleChange} placeholder="0XXXXXXXXX" style={styles.input}/>
          {errors.contact && <small style={styles.error}>{errors.contact}</small>}
        </div>

        <button type="submit" style={styles.saveBtn}>Save Event</button>
      </form>

      {savedEvent && (
        <div style={styles.preview}>
          <h2>Event Preview</h2>
          <ul>
            {Object.entries(savedEvent).map(([k,v]) => (
              <li key={k}><strong>{k}:</strong> {Array.isArray(v)?v.join(', '):v}</li>
            ))}
          </ul>
          <button onClick={downloadPDF} style={styles.downloadBtn}>Download PDF</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container:{maxWidth:"800px", margin:"20px auto", padding:"20px", background:"#f9f9f9", borderRadius:"12px", fontFamily:"Segoe UI, sans-serif"},
  title:{textAlign:"center", marginBottom:"20px", color:"#22c55e"},
  form:{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px"},
  group:{display:"flex", flexDirection:"column"},
  groupFull:{gridColumn:"span 2", display:"flex", flexDirection:"column"},
  input:{padding:"8px", borderRadius:"6px", border:"1px solid #ccc"},
  textarea:{padding:"8px", borderRadius:"6px", border:"1px solid #ccc"},
  error:{color:"red", fontSize:"13px"},
  saveBtn:{gridColumn:"span 2", padding:"10px", background:"#22c55e", border:"none", color:"white", borderRadius:"8px", cursor:"pointer", fontWeight:"bold"},
  preview:{marginTop:"25px", padding:"15px", border:"1px solid #ddd", borderRadius:"10px", background:"white"},
  downloadBtn:{marginTop:"10px", padding:"8px 16px", background:"#007bff", border:"none", borderRadius:"6px", color:"white", cursor:"pointer"}
};

export default AddEvent;
