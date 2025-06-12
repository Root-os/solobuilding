const BuildingRule = require('../models/buildingLaw');

// Create a new building rule
exports.createRule = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const existing = await BuildingRule.findOne({ where: { description } });
    if (existing) {
      return res.status(409).json({ error: 'This rule already exists.' });
    }

    const rule = await BuildingRule.create({ description });
    res.status(201).json({ message: 'Rule created', rule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rule', details: error.message });
  }
};

// Get all building rules
exports.getAllRules = async (req, res) => {
  try {
    const rules = await BuildingRule.findAll({
      attributes: ['id', 'description', 'createdAt', 'updatedAt'],
      order: [['id', 'ASC']]
    });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single rule by ID
exports.getRuleById = async (req, res) => {
  try {
    const rule = await BuildingRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a rule
exports.updateRule = async (req, res) => {
  try {
    const { description } = req.body;
    const rule = await BuildingRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const duplicate = await BuildingRule.findOne({ where: { description, id: { [Op.ne]: req.params.id } } });
    if (duplicate) {
      return res.status(409).json({ error: 'Another rule with the same description already exists.' });
    }

    await rule.update({ description });
    res.json({ message: 'Rule updated', rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a rule
exports.deleteRule = async (req, res) => {
  try {
    const rule = await BuildingRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    await rule.destroy();
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
