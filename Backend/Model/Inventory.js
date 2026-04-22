const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  Itemname: {
    type: String,
    required: true
  },
  Category: {
    type: String,
    required: true
  },
  Quantity: {
    type: Number,
    required: true,
    min: 1
  },
  Location: {
    type: String,
    required: true
  },
  Status: {
    type: String,
    enum: ['available', 'in use', 'maintenance', 'out of stock', 'new'],
    default: 'available'
  },
  Image: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', InventorySchema);
