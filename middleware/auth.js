export const adminAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  };
  
  export const tenantAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "tenant") {
      return res.status(403).json({ message: "Access denied. Tenants only." });
    }
    next();
  };

  export const employeeAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ message: "Access denied. employee only." });
    }
    next();
  };
  