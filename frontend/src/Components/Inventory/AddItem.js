import React, { useState } from 'react';
import API from "../../utils/api"; // Use API utility instead of fetch
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';

const AddItem = ({ onItemAdded }) => {
  const [formData, setFormData] = useState({
    Itemname: '',
    Category: '',
    Quantity: '',
    Location: '',
    Status: ''
    // Removed Image field
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/api/v1/inventory', formData);
      
      // API utility throws error for non-2xx status codes
      // 201 is success, so this should work fine
      setFormData({
        Itemname: '',
        Category: '',
        Quantity: '',
        Location: '',
        Status: ''
        // Removed Image field
      });
      onItemAdded();
      
      // Show success message
      alert('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert(`Error adding item: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Add New Item</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="Itemname"
                label="Item Name"
                value={formData.Itemname}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="Category"
                  value={formData.Category}
                  label="Category"
                  onChange={handleChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return 'Category';
                    }
                    return selected;
                  }}
                >
                  <MenuItem value="Sports Equipment">Sports Equipment</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="Quantity"
                label="Quantity"
                type="number"
                value={formData.Quantity}
                onChange={handleChange}
                required
                inputProps={{
                  min: 1,
                  max: 100,
                  step: 1
                }}
                error={formData.Quantity !== '' && (formData.Quantity < 1 || formData.Quantity > 100)}
                helperText={formData.Quantity !== '' && (formData.Quantity < 1 || formData.Quantity > 100) 
                  ? "Quantity must be between 1 and 100" 
                  : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Add Item
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddItem;