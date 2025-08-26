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

    await role.addPermissions(permissions);

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
    const permissions = await Permission.findAll({
      include: {
        model: Role,
        as: 'Roles', 
        attributes: ['id', 'name'],
        through: { attributes: [] }, // to remove the join table details
      },
    });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Update permission (change its name)
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Optionally check if the new name already exists (if needed)
    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission && existingPermission.id !== id) {
      return res.status(400).json({ message: 'Permission name already exists' });
    }

    // Update the permission
    permission.name = name;
    await permission.save();

    res.json({ message: 'Permission updated successfully', permission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete permission
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Check if the permission is assigned to any role
    const rolesWithPermission = await Role.findAll({
      include: {
        model: Permission,
        where: { id: id },
      },
    });

    if (rolesWithPermission.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete permission as it is assigned to one or more roles',
      });
    }

    // Proceed to delete the permission
    await permission.destroy();
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPermission,
  assignPermissionToRole,
  getAllPermissions,
  removePermissionsFromRole,
  updatePermission,
  deletePermission,
};