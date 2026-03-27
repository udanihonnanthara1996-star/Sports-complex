const User = require("../Model/Inventory");
const mongoose = require('mongoose');


//data display
const getallusers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
    return res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ 
      message: "Error fetching users", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


// data insert
const adduser = async (req, res, next) => {
  const { Itemname, Category, Quantity, Location, Status, Image } = req.body;

  // Validate required fields
  if (!Itemname || !Category || !Quantity || !Location || !Status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let user;
  try {
    user = new User({
      Itemname,
      Category,
      Quantity,
      Location,
      Status,
      Image: Image || "" // Add image field, default to empty string if not provided
    });
    await user.save();
    return res.status(201).json({ user });
  } catch (err) {
    console.error("Save error:", err);
    return res.status(500).json({ 
      message: "Error saving user", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
     });
  }
};




//get by Id
const getById = async (req, res, next) => {
    const id = req.params.id;  // get id from request

    let user;
    try {
        user = await User.findById(id);  
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (err) {
        console.error("Error fetching user by ID:", err);
        return res.status(500).json({ 
          message: "Error fetching user", 
          error: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};




//Update user Details
const Updateuser = async (req, res, next) => {
  const id = req.params.id;
  const { Itemname, Category, Quantity, Location, Status, Image } = req.body;

  let upuser;

  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const updateData = {
      Itemname, 
      Category, 
      Quantity, 
      Location, 
      Status
    };
    
    // Only add Image to update data if it's provided
    if (Image !== undefined) {
      updateData.Image = Image;
    }
    
    upuser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } 
    );
    
    if (!upuser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({ upuser });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ 
      message: "Error updating user", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


//Delete user details
const deleteUsers = async (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const duser = await User.findByIdAndDelete(id);

    if (!duser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully", duser });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ 
      message: "Error deleting user", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};




exports.getallusers = getallusers;
exports.adduser = adduser;
exports.getById = getById;
exports.Updateuser = Updateuser;
exports.deleteUsers = deleteUsers;