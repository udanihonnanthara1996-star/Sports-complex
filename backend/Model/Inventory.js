const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  Itemname: {
    type: String,
    required: true, 
  },
  Category: {
    type: String,
    required: true,
  },
  Quantity: {            
    type: Number,
    required: true,
  },
  Location: {
    type: String,
    required: true,
  },
  Status: {
    type: String,
    required: true,
  },
  // Add image field
  Image: {
    type: String,
    required: false,
  },
});
module.exports = mongoose.model("Inventory", userSchema);