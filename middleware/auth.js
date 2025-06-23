const jwt = require('jsonwebtoken');
const Role =require('../models/role')


const verifyToken = (req, res,next) => {
  let token;

  // Check for token in cookies
  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    console.log('Token from cookies:', token);
  }
  // Check for token in headers
  else if (req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
    console.log('Token from headers:', token);
  }

  if (!token) {
    console.log('No token found');
    res.status(403).json({ success: false, message: 'No token found' });
    return null;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', user);
    return req.user = user;
  } catch (error) {
    console.log('Invalid token:', error.message);
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

 const adminAuth = (req, res, next) => {
  console.log('Admin Auth Middleware: Checking token and role...');
  const user = verifyToken(req, res);
  console.log('Decoded user:', user);
  if (!user) return;

  console.log('User role:', user.role);
  if (user.role.toLowerCase() !== "admin") {
    console.log('Access denied: User is not an admin');
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }

  console.log('Access granted: User is an admin');
  next();
};

 const tenantAuth = (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  if (user.role !== "tenant") {
    return res.status(403).json({ success: false, message: "Access denied. Tenants only." });
  }
  next();
};

const employeeAuth = async (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return;

  const roleName = user.role.toLowerCase();

  if (roleName === 'admin' || roleName === 'tenant') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins and tenants are not allowed here.' });
  }

  try {
    const roleExists = await Role.findOne({ where: { name: user.role } });

    if (!roleExists) {
      return res.status(403).json({ success: false, message: 'Access denied. Role not recognized.' });
    }

    next(); // ✅ Valid employee-like role (finance, hr, etc.)
  } catch (err) {
    console.error('Role DB check failed:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error while checking role' });
  }
};

 const roleAuth = (role) => (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  if (user.role !== role) {
    return res.status(403).json({ success: false, message: `Access denied. ${role}s only.` });
  }

  next();
};
const adminOrEmployeeAuth = async (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return;

  const roleName = user.role.toLowerCase();

  if (roleName === 'admin') {
    return next(); 
  }

  if (roleName === 'tenant') {
    return res.status(403).json({ success: false, message: 'Access denied. Tenants are not allowed here.' });
  }

  try {
    const roleExists = await Role.findOne({ where: { name: user.role } });
    if (!roleExists) {
      return res.status(403).json({ success: false, message: 'Access denied. Role not recognized.' });
    }

    next(); 
  } catch (err) {
    console.error('Role DB check failed:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error while checking role' });
  }
};

const EmployeeOrTenantAuth = async (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return;

  const roleName = user.role.toLowerCase();

  // ❌ Explicitly block admin
  if (roleName === 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins are not allowed here.' });
  }

  if (roleName === 'tenant') {
    return next();
  }

  try {
    const roleExists = await Role.findOne({ where: { name: user.role } });
    if (!roleExists) {
      return res.status(403).json({ success: false, message: 'Access denied. Role not recognized.' });
    }

    next();
  } catch (err) {
    console.error('Role DB check failed:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error while checking role' });
  }
};

const AdminOrTenantAuth = (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails
  // Check if the user is either an admin or a tenant
  if (user.role.toLowerCase()!== "admin" && user.role.toLowerCase()!== "tenant") {
    return res.status(403).json({ success: false, message: "Access denied. Admins or tenants only." });
  }
  next();
}
module.exports = { verifyToken,adminAuth, tenantAuth, employeeAuth, roleAuth,AdminOrTenantAuth, EmployeeOrTenantAuth,adminOrEmployeeAuth };