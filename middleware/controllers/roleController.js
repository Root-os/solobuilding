const { Role,User } = require('../models');

const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const role = await Role.create({ name });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Update Role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Optional: check if new name already exists
    const duplicate = await Role.findOne({ where: { name } });
    if (duplicate && duplicate.id !== Number(id)) {
      return res.status(400).json({ message: 'Another role with this name already exists' });
    }

    role.name = name;
    await role.save();

    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    // Check if there are any users associated with this role
    const usersWithRole = await User.findAll({ where: { roleId: id } });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role as it is assigned to one or more users' });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
module.exports = {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
};