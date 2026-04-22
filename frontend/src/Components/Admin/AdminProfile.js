import React, { useEffect, useState, useRef } from 'react';
import './AdminProfile.css';
import API from '../../utils/api';
import { useAuth } from '../Context/AuthContext';

export default function AdminProfile(){
  const { auth, setAuth } = useAuth();
  const [admin, setAdmin] = useState({ name:'', email:'', profile:{ phone:'', address:'', photo:'' } });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(()=>{
    const id = auth?.userId || (JSON.parse(localStorage.getItem('auth')||'null')?.userId);
    if(id) fetchAdmin(id);
    // eslint-disable-next-line
  }, []);

  const fetchAdmin = async (id) => {
    setLoading(true);
    try{
      const res = await API.get(`/api/v1/users/${id}`);
      const u = res.data.user || res.data;
      // ensure profile.photo exists
      if(!u.profile) u.profile = {};
      setAdmin(u);
    }catch(err){
      setError('Failed to load admin');
    }finally{ setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if(name.startsWith('profile.')){
      const k = name.split('.')[1];
      setAdmin(prev => ({ ...prev, profile: { ...prev.profile, [k]: value } }));
    } else setAdmin(prev => ({ ...prev, [name]: value }));
  };

  // When user selects a file: preview and quick-save (PATCH only photo)
  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setAdmin(prev => ({ ...prev, profile: { ...prev.profile, photo: base64 } }));
      // quick-save photo only
      try{
        await API.patch(`/api/v1/users/${auth.userId}`, { profile: { photo: base64 } });
        // update auth in context/localStorage so nav/avatar updates
        if(setAuth) setAuth(a => ({ ...a, profile: { ...(a?.profile||{}), photo: base64 } }));
        const st = JSON.parse(localStorage.getItem('auth')||'null');
        if(st){ st.profile = { ...(st.profile||{}), photo: base64 }; localStorage.setItem('auth', JSON.stringify(st)); }
      }catch(err){
        console.error('photo quick-save failed', err);
        setError('Failed to upload photo');
      }
    };
    reader.readAsDataURL(f);
  };

  const removePhoto = async () => {
    if(!window.confirm('Remove profile photo?')) return;
    try{
      await API.patch(`/api/v1/users/${auth.userId}`, { profile: { photo: '' } });
      setAdmin(prev => ({ ...prev, profile: { ...prev.profile, photo: '' } }));
      if(setAuth) setAuth(a => ({ ...a, profile: { ...(a?.profile||{}), photo: '' } }));
      const st = JSON.parse(localStorage.getItem('auth')||'null');
      if(st){ st.profile = { ...(st.profile||{}), photo: '' }; localStorage.setItem('auth', JSON.stringify(st)); }
    }catch(err){
      console.error(err);
      setError('Failed to remove photo');
    }
  };

  const save = async () => {
    setLoading(true);
    try{
      const payload = { name: admin.name, email: admin.email, profile: admin.profile };
      const res = await API.patch(`/api/v1/users/${auth.userId}`, payload);
      setAdmin(res.data.user || res.data);
      if(setAuth) setAuth(a => ({ ...a, name: res.data.user?.name || payload.name, email: res.data.user?.email || payload.email, profile: { ...(a?.profile||{}), ...(res.data.user?.profile||payload.profile) } }));
      // sync localStorage
      const st = JSON.parse(localStorage.getItem('auth')||'null');
      if(st){ st.name = admin.name; st.email = admin.email; st.profile = { ...(st.profile||{}), ...(admin.profile||{}) }; localStorage.setItem('auth', JSON.stringify(st)); }
      setEditing(false);
      alert('Admin profile updated');
    }catch(err){
      console.error(err);
      setError('Update failed');
    }finally{ setLoading(false); }
  };

  if(loading) return <div className="admin-profile-card">Loading...</div>;

  return (
    <div className="admin-profile-card">
      <h2>Admin Profile</h2>
      {error && <div className="api-error">{error}</div>}

      <div className="profile-top">
        <div className="photo-wrap">
          {admin.profile?.photo ? (
            <img src={admin.profile.photo} alt="admin" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">{(admin.name||'A').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
          )}
        </div>
        <div className="photo-actions">
          <input ref={fileRef} type="file" accept="image/*" id="photoFile" style={{display:'none'}} onChange={handleFile} />
          <button className="btn-upload" onClick={() => fileRef.current && fileRef.current.click()}>Change Photo</button>
          {admin.profile?.photo && <button className="btn-remove" onClick={removePhoto}>Remove Photo</button>}
        </div>
      </div>

      <div className="field-row">
        <label>Full name</label>
        <input name="name" value={admin.name || ''} onChange={handleChange} disabled={!editing} />
      </div>
      <div className="field-row">
        <label>Email</label>
        <input name="email" value={admin.email || ''} onChange={handleChange} disabled={!editing} />
      </div>
      <div className="field-row">
        <label>Phone</label>
        <input name="profile.phone" value={admin.profile?.phone || ''} onChange={handleChange} disabled={!editing} />
      </div>
      <div className="field-row">
        <label>Address</label>
        <input name="profile.address" value={admin.profile?.address || ''} onChange={handleChange} disabled={!editing} />
      </div>
      <div className="admin-actions">
        {editing ? (
          <>
            <button className="btn-save" onClick={save}>Save</button>
            <button className="btn-cancel" onClick={() => { setEditing(false); fetchAdmin(auth.userId); }}>Cancel</button>
          </>
        ) : (
          <button className="btn-edit" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
    </div>
  );
}
