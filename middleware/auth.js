const jwt = require('jsonwebtoken');
const Role =require('../models/role')



const verifyToken = (req, res) => {
  let token;

  if (req.cookies?.authToken) token = req.cookies.authToken;
  else if (req.headers['authorization']) token = req.headers['authorization'].split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    return user;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
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

 const tenantAuth = async (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  if (user.role !== "tenant") {
    return res.status(403).json({ success: false, message: "Access denied. Tenants only." });
  }

  try {
    const Tenant = require('../models/tenant'); // Adjust the path if needed
    const tenant = await Tenant.findByPk(user.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    req.tenant = tenant; // 🔑 Attach tenant object to request
    next();
  } catch (err) {
    console.error('Tenant fetch error:', err.message);
    res.status(500).json({ success: false, message: "Failed to load tenant", error: err.message });
  }
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