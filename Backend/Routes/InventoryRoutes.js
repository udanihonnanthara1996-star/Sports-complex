const express = require('express');
const router = express.Router();
const Inventory = require('../Model/Inventory');
const auth = require('../middleware/auth');

// Get all inventory items
router.get('/', auth, async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new inventory item
router.post('/', auth, async (req, res) => {
  try {
    const { Itemname, Category, Quantity, Location, Status } = req.body;
    
    const newItem = new Inventory({
      Itemname,
      Category,
      Quantity,
      Location,
      Status
    });
    
    await newItem.save();
    res.status(201).json({ message: 'Item added successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    const { Itemname, Category, Quantity, Location, Status } = req.body;
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      { Itemname, Category, Quantity, Location, Status },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item updated successfully', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete inventory item
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
