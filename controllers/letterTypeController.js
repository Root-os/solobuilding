const LetterTypeModel = require("../models/letterType");  // Renamed to avoid shadowing
const { letterTypeValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const { Op } = require("sequelize");

// Create LetterType
exports.createLetterType = async (req, res) => {
    try {
      const { error } = letterTypeValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const { name, description } = req.body;
  
      // Check if a LetterType with the same name already exists
      const existingLetterType = await LetterTypeModel.findOne({
        where: { name },
      });
  
      if (existingLetterType) {
        return res.status(400).json({ message: "LetterType name is double so write another name" });
      }
  
      const letterType = await LetterTypeModel.create({
        name,
        description,
      });
  
      res.status(201).json(letterType);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

// Get All LetterTypes
exports.getAllLetterTypes = async (req, res) => {
  try {
    const letterTypes = await LetterTypeModel.findAll();
    res.status(200).json(letterTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get LetterType by ID
exports.getLetterTypeById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const letterType = await LetterTypeModel.findByPk(req.params.id);

    if (!letterType) {
      return res.status(404).json({ message: "LetterType not found" });
    }

    res.status(200).json(letterType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update LetterType
exports.updateLetterType = async (req, res) => {
    try {
      const { error } = letterTypeValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const { name, description } = req.body;
  
      const { errorId } = paramsSchema.validate(req.params);
      if (errorId) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const letterType = await LetterTypeModel.findByPk(req.params.id);
  
      if (!letterType) {
        return res.status(404).json({ message: "LetterType not found" });
      }
  
      // Check if the name already exists, but exclude the current LetterType being updated
      const existingLetterType = await LetterTypeModel.findOne({
        where: { name, id: { [Op.ne]: req.params.id } },
      });
  
      if (existingLetterType) {
        return res.status(400).json({ message: "LetterType name must be unique." });
      }
  
      // Update the letterType fields
      letterType.name = name;
      letterType.description = description;
  
      await letterType.save();
  
      res.status(200).json(letterType);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

// Delete LetterType
exports.deleteLetterType = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const letterType = await LetterTypeModel.findByPk(req.params.id);

    if (!letterType) {
      return res.status(404).json({ message: "LetterType not found" });
    }

    await letterType.destroy();

    res.status(200).json({ message: "LetterType deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
