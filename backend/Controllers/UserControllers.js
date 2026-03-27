const User = require("../Model/UserModel");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// --------------------
// CRUD operations
// --------------------

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { sortBy = "createdAt", order = "asc", name } = req.query;
    let query = {};
    if (name) {
      query.$or = [
        { name: { $regex: name, $options: "i" } },
        { email: { $regex: name, $options: "i" } },
      ];
    }
    const users = await User.find(query).sort({ [sortBy]: order === "desc" ? -1 : 1 });
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Add new user
const addUsers = async (req, res) => {
  const { name, email, password, role = "user", status = "active", profile } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }
  try {
    const user = new User({ name, email, password, role, status, profile });
    await user.save();
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to add users" });
  }
};

// Get user by ID
const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, password, role, status, profile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, password, role, status, profile },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "Unable to update user" });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Unable to delete user" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// --------------------
// Login / Auth
// --------------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status !== "active") {
      return res.status(401).json({ message: "User inactive" });
    }
    res.status(200).json({
      userId: user._id,
      name: user.name,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// --------------------
// Admin middleware
// --------------------
const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking admin role" });
  }
};

// --------------------
// Extra features
// --------------------

// Activate/Deactivate user
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating status" });
  }
};

// Reset password (admin)
const resetPassword = async (req, res) => {
  try {
    const newPassword = Math.random().toString(36).slice(-8);
    const user = await User.findByIdAndUpdate(req.params.id, { password: newPassword }, { new: true });
    res.status(200).json({ message: "Password reset successfully", newPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password reset failed" });
  }
};

// Forgot password (generate token)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://yourfrontend.com/reset-password?token=${token}&email=${email}`;
    res.json({ message: "Password reset link sent", resetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Forgot password failed" });
  }
};

// Generate PDF report
const generateUserReport = async (req, res) => {
  try {
    const users = await User.find({});
    if (!users.length) return res.status(404).json({ message: "No users found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=users-report.pdf");

    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(18).text("User Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("Name\tEmail\tStatus\tRole");
    doc.moveDown();

    users.forEach(u => {
      doc.text(`${u.name}\t${u.email}\t${u.status}\t${u.role}`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating PDF" });
  }
};

// Send notifications (mock)
const sendNotification = async (req, res) => {
  const { emails, message } = req.body;
  try {
    // Implement actual email sending logic here
    res.status(200).json({ message: "Notifications sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Notification failed" });
  }
};

// --------------------
// Export all controllers
// --------------------
module.exports = {
  getAllUsers,
  addUsers,
  getById,
  updateUser,
  deleteUser,
  loginUser,
  requireAdmin,
  updateUserStatus,
  resetPassword,
  forgotPassword,
  generateUserReport,
  sendNotification
};
