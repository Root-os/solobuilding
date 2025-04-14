const { Permission, Role } = require('../models');

const createPermission = async (req, res) => {
  try {
    const { name } = req.body;

    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    const permission = await Permission.create({ name });
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionIds } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({ message: 'One or more permissions not found' });
    }

    await role.setPermissions(permissions);
    res.json({ message: 'Permissions assigned to role successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const removePermissionsFromRole = async (req, res) => {
  try {
    const { roleId, permissionIds } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({ message: 'One or more permissions not found' });
    }

    // Remove specified permissions from the role
    await role.removePermissions(permissions);

    res.json({ message: 'Permissions revoked from role successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPermission,
  assignPermissionToRole,
  getAllPermissions,
  removePermissionsFromRole,
};