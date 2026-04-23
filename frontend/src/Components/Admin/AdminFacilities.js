import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import AdminNav from './AdminNav';
import './AdminFacilities.css';

const facilityTypes = [
  { value: 'gym', label: 'Gym' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'football', label: 'Football' }
];

const emptyFacility = {
  name: '',
  type: 'gym',
  description: '',
  pricePerHour: '',
  maxCapacity: 1,
  isActive: true
};

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [facility, setFacility] = useState(emptyFacility);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(true);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/v1/facilities');
      setFacilities(res.data?.facilities || []);
    } catch (err) {
      console.error('Failed to load facilities:', err);
      setError(err.message || 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const resetForm = () => {
    setFacility(emptyFacility);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFacility((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      name: facility.name.trim(),
      type: facility.type,
      description: facility.description.trim(),
      pricePerHour: Number(facility.pricePerHour) || 0,
      maxCapacity: Number(facility.maxCapacity) || 1,
      isActive: facility.isActive
    };

    try {
      if (editingId) {
        await API.put(`/api/v1/facilities/${editingId}`, payload);
        setSuccess('Facility updated successfully.');
      } else {
        await API.post('/api/v1/facilities', payload);
        setSuccess('Facility created successfully.');
      }
      resetForm();
      fetchFacilities();
      setShowForm(false);
    } catch (err) {
      console.error('Facility save failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (facilityItem) => {
    setFacility({
      name: facilityItem.name || '',
      type: facilityItem.type || 'gym',
      description: facilityItem.description || '',
      pricePerHour: facilityItem.pricePerHour || '',
      maxCapacity: facilityItem.maxCapacity || 1,
      isActive: facilityItem.isActive !== false
    });
    setEditingId(facilityItem._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (facilityId) => {
    if (!window.confirm('Delete this facility? This cannot be undone.')) return;
    try {
      await API.delete(`/api/v1/facilities/${facilityId}`);
      fetchFacilities();
    } catch (err) {
      console.error('Failed to delete facility:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete facility');
    }
  };

  return (
    <div className="admin-facilities-page">
      <AdminNav />
      <div className="admin-facilities-content">
        <div className="facilities-header">
          <div>
            <h1>Facility Management</h1>
            <p>Create, edit, and delete sports facilities available for booking.</p>
          </div>
          <button
            type="button"
            className="facility-toggle-btn"
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) resetForm();
            }}
          >
            {showForm ? 'Hide Form' : 'Add New Facility'}
          </button>
        </div>

        {showForm && (
          <section className="facility-form-panel">
            <form className="facility-form" onSubmit={handleSubmit}>
              <h2>{editingId ? 'Edit Facility' : 'New Facility'}</h2>

              {error && <div className="form-message error">{error}</div>}
              {success && <div className="form-message success">{success}</div>}

              <label htmlFor="name">Facility Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={facility.name}
                onChange={handleChange}
                required
              />

              <label htmlFor="type">Facility Type</label>
              <select id="type" name="type" value={facility.type} onChange={handleChange}>
                {facilityTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label htmlFor="pricePerHour">Price Per Hour</label>
              <input
                id="pricePerHour"
                name="pricePerHour"
                type="number"
                min="0"
                step="0.01"
                value={facility.pricePerHour}
                onChange={handleChange}
                required
              />

              <label htmlFor="maxCapacity">Max Capacity</label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                value={facility.maxCapacity}
                onChange={handleChange}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={facility.description}
                onChange={handleChange}
              />

              <div className="form-row-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={facility.isActive}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>

              <button type="submit" className="facility-submit-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Facility' : 'Create Facility'}
              </button>
            </form>
          </section>
        )}

        <section className="facility-list-panel">
          <div className="facility-list-header">
            <h2>Active Facilities</h2>
            <p>{loading ? 'Loading facilities...' : `${facilities.length} facilities found`}</p>
          </div>

          {!loading && !facilities.length && (
            <div className="empty-state">No facilities found. Add one using the form above.</div>
          )}

          <div className="facility-cards">
            {facilities.map((item) => (
              <div className="facility-card" key={item._id}>
                <div className="facility-card-top">
                  <div>
                    <h3>{item.name}</h3>
                    <span className={`facility-badge ${item.isActive ? 'active' : 'inactive'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="facility-actions">
                    <button type="button" onClick={() => handleEdit(item)}>Edit</button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                  </div>
                </div>
                <p className="facility-meta">
                  <strong>Type:</strong> {facilityTypes.find((type) => type.value === item.type)?.label || item.type}
                </p>
                <p className="facility-meta">
                  <strong>Price:</strong> ${item.pricePerHour?.toFixed(2) || '0.00'} per hour
                </p>
                <p className="facility-meta">
                  <strong>Capacity:</strong> {item.maxCapacity}
                </p>
                {item.description && <p className="facility-description">{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
