import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Box, Typography, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TablePagination, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Loading from '../Inventory/Loading';
import Notification from '../Inventory/Notification';
import UpdateItem from '../Inventory/UpdateItem';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, itemId: null });
  const [updateDialog, setUpdateDialog] = useState({ open: false, item: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/inventory');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data.users || []);
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification(`Error fetching items: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/inventory/${deleteDialog.itemId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchItems();
      showNotification('Item deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification(`Error deleting item: ${error.message}`, 'error');
    }
    setLoading(false);
    setDeleteDialog({ open: false, itemId: null });
  };

  const handleUpdateSuccess = async () => {
    await fetchItems();
    setUpdateDialog({ open: false, item: null });
    showNotification('Item updated successfully');
  };

  const filteredItems = items.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Inventory Items</Typography>
      
      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.Itemname}</TableCell>
                <TableCell>{item.Category}</TableCell>
                <TableCell>{item.Quantity}</TableCell>
                <TableCell>{item.Location}</TableCell>
                <TableCell>{item.Status}</TableCell>
                <TableCell>
                  {item.Image && item.Image.trim() !== '' ? (
                    <img 
                      src={item.Image} 
                      alt={item.Itemname} 
                      style={{ width: 50, height: 50, objectFit: 'cover' }} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>No Image</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => setUpdateDialog({ open: true, item })}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, itemId: item._id })}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredItems.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, itemId: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this item?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, itemId: null })}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <UpdateItem
        open={updateDialog.open}
        item={updateDialog.item}
        onClose={() => setUpdateDialog({ open: false, item: null })}
        onSuccess={handleUpdateSuccess}
      />

      {/* Loading and Notification Components */}
      <Loading open={loading} />
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </Box>
  );
};

export default ItemList;