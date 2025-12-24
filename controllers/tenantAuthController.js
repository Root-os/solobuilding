const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tenant = require('../models/tenant');
const sendEmail  = require('../middleware/sendEmail');

exports.login = async (req, res) => {
    try {
      const { phoneNumber, email, password } = req.body;
  
      console.log('Login request body:', req.body); // Debug the request body
  
      // Check if either phoneNumber or email is provided
      if (!phoneNumber && !email) {
        return res.status(400).json({ success: false, message: 'Phone number or email is required' });
      }
  
      let tenant;
      if (phoneNumber) {
        // Find tenant by phone number
        tenant = await Tenant.findOne({
          where: { phoneNumber },
            order: [['updatedAt', 'DESC']],
          });

        console.log('Tenant found by phone number:', tenant); // Debug the tenant found
} else if (email) {
  // Step 1: Find tenant by email
  const tenantByEmail = await Tenant.findOne({ where: { email } });

  if (!tenantByEmail) {
    console.log('Tenant not found by email'); // Debug
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Step 2: Get the latest tenant record for this phone number
  const latestTenant = await Tenant.findOne({
    where: { phoneNumber: tenantByEmail.phoneNumber },
    order: [['updatedAt', 'DESC']],
  });

  // Step 3: Check if the tenant trying to login is the latest
  if (latestTenant.id !== tenantByEmail.id) {
    console.log('Outdated email used for login'); // Debug
    return res.status(401).json({ success: false, message: 'This email is outdated. Use the latest email to login.' });
  }

  // Step 4: Assign the latest tenant to the login variable
  tenant = latestTenant;

  console.log('Tenant found by latest email:', tenant); // Debug
}

  
      // Check if tenant exists
      if (!tenant) {
        console.log('Tenant not found'); // Debug tenant not found
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
  
      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(password, tenant.password);
      console.log('Password valid:', isPasswordValid); // Debug password validation
  
      if (!isPasswordValid) {
        console.log('Invalid password'); // Debug invalid password
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
  
      // Check if tenant account is active
      if (tenant.status !== 'active') {
        console.log('Tenant account is inactive'); // Debug inactive account
        return res.status(403).json({ success: false, message: 'Your account is inactive. Contact support.' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: tenant.id, fullName: tenant.fullName, role: 'tenant', email: tenant.email, phone: tenant.phoneNumber }, process.env.JWT_SECRET, { expiresIn: '3h' });
  
      // Set the cookie
      res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
      // Send success response
      res.status(200).json({ success: true, token });
    } catch (error) {
      console.error('Login error:', error); // Debug any errors
      res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
  };
  
// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const tenant = await Tenant.findByPk(req.tenant.id);

    if (!tenant || !(await bcrypt.compare(currentPassword, tenant.password))) {
      return res.status(400).json({ success: false, message: 'Invalid current password' });
    }

    tenant.password = await bcrypt.hash(newPassword, 10);
    await tenant.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Forgot Password (via Email)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const tenant = await Tenant.findOne({ where: { email } });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const token = jwt.sign({ id: tenant.id }, process.env.JWT_EMAIL_SECRET, { expiresIn: '1h' });
    const resetUrl = `${req.protocol}://${req.get('host')}/tenant/reset-password/${token}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of your password. Please make a PUT request to: \n\n ${resetUrl}`;

    await sendEmail({
      email: tenant.email,
      subject: 'Password Reset Token',
      message,
    });

    res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send password reset email', error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
    const tenant = await Tenant.findByPk(decoded.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.password = await bcrypt.hash(password, 10);
    await tenant.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

// Get Tenant Profile
exports.getProfile = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// Update Tenant Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const tenant = await Tenant.findByPk(req.user.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.fullName = fullName;
    tenant.phoneNumber = phoneNumber;
       await tenant.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};