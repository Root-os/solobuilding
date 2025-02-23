const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { sendEmail } = require("../middleware/sendEmail");
/**
 * Helper function to generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, fname: user.fname, lname: user.lname, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "3h" }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { fname, lname, email, password, role, phone } = req.body;
if(!fname || !lname || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required fname, lname,email, password" });
    }
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }
    if (role !== "admin" && role !== "employee") {
      return res.status(400).json({ success: false, message: "Invalid role, only employee or admin is allowed" });
    }
if (phone&&phone.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid phone number, it should be between 10 to 13 digits" });
    }
    if (phone&&phone.length > 13) {
      return res.status(400).json({ success: false, message: "Invalid phone number, it should be between 10 to 13 digits" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      fname,
      lname,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    const token = generateToken(user);
    res.cookie("authToken", token, { httpOnly: true, sameSite: "None", secure: process.env.NODE_ENV === "production" });
    res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { fname, lname, role,phone } = req.body;
    const { id } = req.user;
    if (role&&(role !== "admin" && role !== "employee")) {
      return res.status(400).json({ success: false, message: "Invalid role, only employee or admin is allowed" });
    }

    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (phone&&phone.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid phone number, it should be between 10 to 13 digits" });
    }
    if (phone&&phone.length > 13) {
      return res.status(400).json({ success: false, message: "Invalid phone number, it should be between 10 to 13 digits" });
    }

    user.fname = fname;
    user.lname = lname;
    user.role = role;
    user.phone = phone;
    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "User update failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Your account is inactive. Contact support." });
    }

    const token = generateToken(user);
    res.cookie("authToken", token, { httpOnly: true, sameSite: "None", secure: process.env.NODE_ENV === "production" });

    res.status(200).json({ success: true,  token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id }, attributes: { exclude: ["password"] } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await user.destroy();
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await user.destroy();
    res.clearCookie("authToken");
    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete account", error: error.message });
  }
}
exports.logout = async (req, res) => {
  try {
    if (!req.cookies.authToken) {
      return res.status(400).json({ success: false, message: "No active session" });
    }

    res.clearCookie("authToken");
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: "Invalid current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to change password", error: error.message });
  }
};

exports.myProfile = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }, attributes: { exclude: ["password"] } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user", error: error.message });
  }
};


exports.verifySession = async (req, res) => {
  try {
    return res.status(200).json({ success: true,user:req.user, message: "Session is valid" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Session is invalid" });
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate password reset token
    const token = jwt.sign({ id: user.id, fname: user.fname }, process.env.JWT_EMAIL_SECRET, { expiresIn: '3h' });

    // Define the reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/reset-password/${token}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    const success = await sendEmail({
      to: user.email,
      subject: "Password Reset Token",
      text:message,
    });

    if (success) {
      return res.status(200).json({ success: true, message: 'Password reset link sent to your email, please check your email' });
    }

    return res.status(400).json({ success: false, message: 'Failed to send email' });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send password reset email", error: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'No token found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    const id = decoded.id;
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset password", error: error.message });
  }
};
