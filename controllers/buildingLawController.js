const BuildingRule = require('../models/buildingLaw');
const fs = require('fs');
const path = require('path');

// Create a new building rule

exports.createRule = async (req, res) => {
  try {
    const { description } = req.body;
    const image = req.file ? req.file.path : null;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const rule = await BuildingRule.create({
      description,
      image,
    });

    res.status(201).json({ message: 'Rule created', rule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rule', details: error.message });
  }
};

// Get all building rules
exports.getAllRules = async (req, res) => {
  try {
    const rules = await BuildingRule.findAll({
      attributes: ['id', 'description', 'image', 'createdAt', 'updatedAt'],
      order: [['id', 'ASC']]
    });

    const rulesWithFullImageUrl = rules.map(rule => {
      const cleanPath = rule.image?.replace(/\\/g, '/').replace(/^.*[\\/]/, '');
      return {
        id: rule.id,
        description: rule.description,
        image: rule.image ? `${req.protocol}://${req.get('host')}/uploads/${cleanPath}` : null,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    });

    res.json(rulesWithFullImageUrl);
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
    const { ruleNumber, description } = req.body;
    const rule = await BuildingRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    let updatedData = { ruleNumber, description };

    // Check if a new image was uploaded
    if (req.file) {
      updatedData.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await rule.update(updatedData);

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
