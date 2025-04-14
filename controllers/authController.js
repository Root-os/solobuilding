const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { Role, Permission } = require('../models');

const { sendEmail } = require("../middleware/sendEmail");
const EmployeeDetail =require('../models/employeeDetail')
/**
 * Helper function to generate JWT token
 */
const generateToken = (user, roleName, permissions) => {
  return jwt.sign(
    { id: user.id, fname: user.fname, lname: user.lname, role: roleName, permissions },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "3h" }
  );
};


exports.registerUser = async (req, res) => {
  try {
    const { fname, lname, email, password, roleId, phone } = req.body;
if(!fname || !lname || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required fname, lname,email, password" });
    }
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }
    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ message: 'Invalid role,please correct to the existing on or create this one' });
    }

    // Check if phone number is valid
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
      roleId,
      phone,
    });

    const token = generateToken(user, role.name, []);
    res.cookie("authToken", token, { httpOnly: true, sameSite: "None", secure: process.env.NODE_ENV === "production" });
    res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};


exports.registerUserEmployee = async (req, res) => {
  try {
    const { fname, lname, email, password, phone, salary, position, hireDate, shift, department, employmentType, emergencyContact, address, bankAccount } = req.body;

    // Check if the required fields are provided
    if (!fname || !lname || !email || !password || !salary || !position || !hireDate || !department) {
      return res.status(400).json({ success: false, message: "All fields are required: fname, lname, email, password, salary, position, hireDate, department" });
    }

    // Check if the user already exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
const role = await Role.findOne({ where: { name: 'employee' } });
    if (!role) {
      return res.status(400).json({ message: 'Invalid role please first create role employee' });
    }
    // Create the user
    user = await User.create({
      fname,
      lname,
      email,
      password: hashedPassword,
      roleId: role.id,
      phone,
    });

    // Create the employee details after the user is created
    if (user) {
      await EmployeeDetail.create({
        userId: user.id,
        salary,
        position,
        hireDate,
        shift: shift || 'flexible',  // default value if shift is not provided
        department,
        employeementType: employmentType || 'full-time',  // default value if employmentType is not provided
        emergencyContact,
        address,
        bankAccount,
      });
    }
    // const permissions = user.Role.Permissions.map((perm) => perm.name);
    // Generate a token for the user
    const token = generateToken(user, role.name, []);

    // Set the token in the cookie
    res.cookie("authToken", token, { httpOnly: true, sameSite: "None", secure: process.env.NODE_ENV === "production" });

    // Return the success response
    res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { fname, lname, roleId,phone } = req.body;
    const { id } = req.user;
   

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
const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ message: 'Invalid role,please correct to the existing on or create this one' });
    }
    user.fname = fname;
    user.lname = lname;
    user.roleId = roleId;
    user.phone = phone;
    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "User update failed", error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;  // Get the employee ID from the URL parameter
    const { fname, lname, phone, salary, position, department, hireDate, shift, employmentType, emergencyContact, address, bankAccount } = req.body;

    // Find the employee by ID
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Validate and update the basic user details
    user.fname = fname || user.fname;
    user.lname = lname || user.lname;
    user.phone = phone || user.phone;
    await user.save();

    // Find and update the employee details (if any)
    const employeeDetails = await EmployeeDetail.findOne({ where: { userId: user.id } });
    if (!employeeDetails) {
      return res.status(404).json({ success: false, message: "Employee details not found" });
    }

    employeeDetails.salary = salary || employeeDetails.salary;
    employeeDetails.position = position || employeeDetails.position;
    employeeDetails.department = department || employeeDetails.department;
    employeeDetails.hireDate = hireDate || employeeDetails.hireDate;
    employeeDetails.shift = shift || employeeDetails.shift;
    employeeDetails.employmentType = employmentType || employeeDetails.employmentType;
    employeeDetails.emergencyContact = emergencyContact || employeeDetails.emergencyContact;
    employeeDetails.address = address || employeeDetails.address;
    employeeDetails.bankAccount = bankAccount || employeeDetails.bankAccount;
    await employeeDetails.save();

    // Return the updated user and employee details
    res.status(200).json({
      success: true,
      message: "Employee details updated successfully",
      user,
      employeeDetail: employeeDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update employee", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email },
      include: {
        model: Role,
        include: Permission,
      }
      });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Your account is inactive. Contact support." });
    }
    const permissions = user.Role.Permissions.map((perm) => perm.name);

    const token = generateToken(user, user.Role.name, permissions);

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

exports.getAllEmployeeUsers = async (req, res) => {
  try {
    const role = await Role.findOne({ where: { name: 'employee' } });
    if (!role) {
      return res.status(400).json({ message: 'Invalid role please first create role employee' });
    }
    // Fetch users with the role of 'employee' along with their related employee details
    const users = await User.findAll({
      where: { roleId: role.id },
      attributes: { exclude: ["password"] },
      include: [{
        model: EmployeeDetail,  // Include the EmployeeDetail model
        required: true,         // Ensures only users with employee details are included
      }]
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { id: req.params.id },  include: {
      model: Role,
      include: Permission,
    },
    attributes: { exclude: ["password"] } });
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
    const user = await User.findOne({ 
      where: { id: req.user.id },
      expiresIn:Role,
      attributes: { exclude: ["password"] } });
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

exports.getPermissions= async (req,res)=>{
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        model: Role,
        include: Permission,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = user.Role.Permissions.map((perm) => perm.name);
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getUsersPermissions= async (req,res)=>{
  try {
    const user = await User.findByPk(req.params.id, {
      include: {
        model: Role,
        include: Permission,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = user.Role.Permissions.map((perm) => perm.name);
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};