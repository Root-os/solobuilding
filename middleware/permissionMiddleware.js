const { User, Role, Permission } = require('../role based access backend/models');

const permissionMiddleware = (requiredPermission) => async (req, res, next) => {
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

    const hasPermission = user.Role.Permissions.some(
      (perm) => perm.name === requiredPermission
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = permissionMiddleware;