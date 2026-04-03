import React, { useState, useEffect } from 'react';
import API from "../../utils/api"; // Use the API utility instead of fetch
import {
  Box, Typography, TextField, InputAdornment, 
  Grid, Card, CardContent, CardMedia, 
  Chip, Skeleton, Pagination, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Loading from '../Inventory/Loading';
import Notification from '../Inventory/Notification';
import Nav from '../Nav/Nav';
// Import the local sport.jpg image
import sportImage from '../Inventory/sport.jpg';
import './UserItemsList.css';

const UserItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/v1/inventory');
      setItems(response.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setNotification({ open: true, message: `Error fetching items: ${error.message}`, severity: 'error' });
    }
    setLoading(false);
  };

  // Function to get image for item (use item image if available, otherwise use fallback)
  const getItemImage = (item) => {
    // If item has an image URL, use it
    if (item.Image && item.Image.trim() !== '') {
      return item.Image;
    }
    
    // Check if item is cricket-related and use cricket ball image
    if (item.Itemname && item.Itemname.toLowerCase().includes('cricket')) {
      return  sportImage;
    }
    
    if (item.Category && item.Category.toLowerCase().includes('cricket')) {
      return sportImage;
    }
    
    // Otherwise, use the local sport.jpg as fallback
    return sportImage;
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available': return 'success';
      case 'in use': return 'warning';
      case 'maintenance': return 'error';
      case 'out of stock': return 'default';
      default: return 'default';
    }
  };

  const getStatusClassName = (status) => {
    switch (status.toLowerCase()) {
      case 'available': return 'status-available';
      case 'in use': return 'status-in-use';
      case 'maintenance': return 'status-maintenance';
      case 'out of stock': return 'status-out-of-stock';
      default: return '';
    }
  };

  const filteredItems = items.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination logic
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading && items.length === 0) {
    return (
      <div className="user-items-container">
        <div className="user-items-header">
          <h1 className="user-items-title">Available Inventory</h1>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="items-grid">
          {[...Array(6)].map((_, index) => (
            <div className="skeleton-card" key={index}>
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line" style={{ width: '80%', height: '24px' }}></div>
                <div className="skeleton-line" style={{ width: '60%' }}></div>
                <div className="skeleton-line" style={{ width: '100%' }}></div>
                <div className="skeleton-line" style={{ width: '100%' }}></div>
              </div>
            </div>
          ))}
        </div>
        
        <Loading open={loading} />
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
        />
      </div>
    );
  }

  return (
    <>
    <Nav />
      <div className="user-items-container">
        <div className="user-items-header">
          <h1 className="user-items-title">Available Inventory</h1>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="no-items-message">
            No items found matching your search criteria
          </div>
        ) : (
          <>
            <div className="items-grid">
              {currentItems.map((item) => (
                <div className="item-card" key={item._id}>
                  <img
                    src={getItemImage(item)}
                    alt={item.Itemname || "sport.jpg"}
                    className="item-image"
                    onError={(e) => {
                      // If the image fails to load, fallback to the local sport.jpg
                      e.target.src = sportImage;
                    }}
                  />
                  <div className="item-content">
                    <h2 className="item-name">{item.Itemname}</h2>
                    
                    <span className="item-category">{item.Category}</span>
                    
                    <div className="item-details">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{item.Quantity}</span>
                    </div>
                    
                    <div className="item-details">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{item.Location}</span>
                    </div>
                    
                    <div className="item-details">
                      <span className="detail-label">Status:</span>
                      <span className={`status-chip ${getStatusClassName(item.Status)}`}>
                        {item.Status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination">
                  <button 
                    className="pagination-button"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    ← Previous
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-button ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="pagination-button"
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        <Loading open={loading} />
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
        />
      </div>
    </>
  );
};

export default UserItemList;