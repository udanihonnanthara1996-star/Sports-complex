import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid
} from '@mui/material';

const UpdateItem = ({ open, item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    Itemname: '',
    Category: '',
    Quantity: '',
    Location: '',
    Status: '',
    Image: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        Itemname: item.Itemname,
        Category: item.Category,
        Quantity: item.Quantity,
        Location: item.Location,
        Status: item.Status,
        Image: item.Image || ''
      });
    }
  }, [item]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/v1/inventory/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(`Error updating item: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Item</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Itemname"
                label="Item Name"
                value={formData.Itemname}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Category"
                label="Category"
                value={formData.Category}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Quantity"
                label="Quantity"
                type="number"
                value={formData.Quantity}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Location"
                label="Location"
                value={formData.Location}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Status"
                label="Status"
                value={formData.Status}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="Image"
                label="Image URL"
                value={formData.Image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                helperText="Enter a valid image URL to display an image for this item"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateItem;