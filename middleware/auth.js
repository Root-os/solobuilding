const jwt = require('jsonwebtoken');
const verifyToken = (req, res) => {
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
    req.user = user;
    return user;
  } catch (error) {
    console.log('Invalid token:', error.message);
    res.status(403).json({ success: false, message: 'Invalid token' });
    return null;
  }
};

 const adminAuth = (req, res, next) => {
  console.log('Admin Auth Middleware: Checking token and role...');
  const user = verifyToken(req, res);
  if (!user) return;

  console.log('User role:', user.role);
  if (user.role !== "admin") {
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

 const employeeAuth = (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  if (user.role !== "employee") {
    return res.status(403).json({ success: false, message: "Access denied. Employees only." });
  }

  next();
};
 const roleAuth = (role) => (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  if (user.role !== role) {
    return res.status(403).json({ success: false, message: `Access denied. ${role}s only.` });
  }

  next();
};
 const adminOrEmployeeAuth = (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  // Check if the user is either an admin or an employee
  if (user.role !== "admin" && user.role !== "employee") {
    return res.status(403).json({ success: false, message: "Access denied. Admins or employees only." });
  }

  next();
};
const EmployeeOrTenantAuth = (req, res, next) => {
  const user = verifyToken(req, res);
  if (!user) return; // Stop if token verification fails

  // Check if the user is either an admin or an employee
  if (user.role !== "tenant" && user.role !== "employee") {
    return res.status(403).json({ success: false, message: "Access denied. tenant or employee only." });
  }

  next();
};
module.exports = { adminAuth, tenantAuth, employeeAuth, roleAuth, EmployeeOrTenantAuth,adminOrEmployeeAuth };