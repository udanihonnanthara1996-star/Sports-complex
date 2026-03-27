const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "staff", "admin"], required: true, default: "customer" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    profile: {
      phone: { type: String },
      address: { type: String },
      photo: { type: String }
    },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
  },
  { timestamps: true }
);

// Remove any duplicate index definitions since unique: true already creates an index

module.exports = mongoose.model("UserModel", userSchema);