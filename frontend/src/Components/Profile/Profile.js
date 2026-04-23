import React, { useEffect, useState } from 'react';
import './Profile.css';
import API from '../../utils/api';
import { useAuth } from '../Context/AuthContext';

function Profile(){
  const { auth, setAuth } = useAuth();
  const [user, setUser] = useState({ name: '', email: '', profile: { phone: '', address: '', photo: '' } });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(()=>{
    // Try to fetch user on mount. Prefer auth from context; if not available yet, read localStorage.
    const tryFetch = async () => {
      const currentAuth = auth || (JSON.parse(localStorage.getItem('auth')) || null);
      if(currentAuth && currentAuth.userId){
        await fetchUserFor(currentAuth.userId);
      }
    };
    tryFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to fetch given id (used by mount helper)
  const fetchUserFor = async (id) => {
    setLoading(true);
    try{
      const res = await API.get(`/api/v1/users/${id}`);
      const data = res.data.user || res.data;
      setUser(prev => ({ ...prev, ...data, profile: { ...(data.profile || {}) } }));
      setPhotoPreview((data.profile && data.profile.photo) || '');
    }catch(err){
      console.error('Error fetching profile', err);
      setError(err.message || 'Failed to load profile');
    }finally{ setLoading(false); }
  };

  // removed duplicate fetchUser - use fetchUserFor(id) instead

  const handleChange = (e) => {
    const { name, value } = e.target;
    if(name.startsWith('profile.')){
      const key = name.split('.')[1];
      setUser(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
    } else {
      setUser(prev => ({ ...prev, [name]: value }));
    }
  };

  // handle file upload and preview (convert to base64)
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPhotoPreview(base64);
      // store base64 in profile.photo so we send to backend (or upload to storage in future)
      setUser(prev => ({ ...prev, profile: { ...prev.profile, photo: base64 } }));
      // If not in full-edit mode, perform a quick save for the photo alone
      if(!editing){
        quickSavePhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // quick save only the photo so user can change avatar without pressing Edit
  const quickSavePhoto = async (base64) => {
    setLoading(true);
    setError('');
    try{
      const payload = { profile: { ...(user.profile || {}), photo: base64 } };
      const res = await API.patch(`/api/v1/users/${auth?.userId || (JSON.parse(localStorage.getItem('auth')||'null')?.userId)}`, payload);
      // update local auth with new profile photo
      if(setAuth){
        setAuth(a => ({ ...a, profile: res.data.user?.profile || payload.profile }));
      }
      setUser(prev => ({ ...prev, ...res.data.user }));
      setPhotoPreview(res.data.user?.profile?.photo || base64);
    }catch(err){
      console.error('Error quick-saving photo', err);
      setError(err?.response?.data?.message || err.message || 'Unable to save photo');
    }finally{ setLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try{
      const payload = {
        name: user.name,
        email: user.email,
        profile: user.profile
      };
      const res = await API.patch(`/api/v1/users/${auth.userId}`, payload);
      // update local auth name/email if present
      if(setAuth){
        setAuth(a => ({ ...a, name: res.data.user?.name || payload.name, email: res.data.user?.email || payload.email, profile: res.data.user?.profile || payload.profile }));
      }
      setUser(prev => ({ ...prev, ...res.data.user }));
      setPhotoPreview(res.data.user?.profile?.photo || photoPreview);
      setEditing(false);
      alert('Profile updated successfully');
    }catch(err){
      console.error('Error updating profile', err);
      setError(err.message || 'Update failed');
    }finally{ setLoading(false); }
  };

  if(loading) return <div className="profile-container"><p>Loading...</p></div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>My Profile</h2>
        {error && <div className="profile-error">{error}</div>}

        <div className="profile-form">
          <div className="form-field">
            <label>Full name</label>
            <input className="input-large" placeholder="e.g. Saman Perera" name="name" value={user.name || ''} onChange={handleChange} disabled={!editing} />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input className="input-large" placeholder="you@domain.com" name="email" value={user.email || ''} onChange={handleChange} disabled={!editing} />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input className="input-large" placeholder="+94 77 123 4567" name="profile.phone" value={user.profile?.phone || ''} onChange={handleChange} disabled={!editing} />
          </div>

          <div className="form-field">
            <label>Address</label>
            <input className="input-large" placeholder="Street, City, Country" name="profile.address" value={user.profile?.address || ''} onChange={handleChange} disabled={!editing} />
          </div>

          <div className="form-field full-width">
            <label>Photo</label>
            <div className="photo-row">
              <div className="photo-preview">
                {photoPreview ? <img src={photoPreview} alt="preview" /> : <div className="preview-empty">No photo</div>}
              </div>
              <div className="photo-actions">
                <input type="file" accept="image/*" onChange={handleFile} disabled={!editing} />
                <div className="photo-note">Upload a square photo for best results. It will be encoded for preview.</div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <button className="btn-save" onClick={handleSave} disabled={loading}>Save</button>
                <button className="btn-cancel" onClick={() => { setEditing(false); fetchUserFor(auth?.userId || (JSON.parse(localStorage.getItem('auth')||'null')?.userId)); }}>Cancel</button>
              </>
            ) : (
              <button className="btn-edit" onClick={() => setEditing(true)}>Edit Profile</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
