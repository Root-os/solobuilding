const { Role } = require('../models');

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

module.exports = {
  createRole,
  getAllRoles,
};