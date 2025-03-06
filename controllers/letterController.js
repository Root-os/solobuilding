const { Letter } = require('../models'); 
const Tenant = require('../models/tenant');
const LetterType = require('../models/letterType');
const {letterValidationSchema} = require('../helpers/schema');
const Notification = require('../models/notification');
const NotificationType = require('../models/notificationType');

// Create a Letter
exports.createLetter = async (req, res) => {
  try {
    const { error } = letterValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { letterTypeId, tenantId, Date, description } = req.body;
    

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(400).json({ message: "Invalid tenantId" });
    }

    const letterType = await LetterType.findByPk(letterTypeId);
    if (!letterType) {
      return res.status(400).json({ message: "Invalid letterTypeId" });
    }

    // Create the new letter
    const newLetter = await Letter.create({
      letterTypeId,
      tenantId,
      Date,
      description,
      status: "Sent",
    });
    if(newLetter){
      let notificationType = await NotificationType.findOne({
        where: { name: "New Letter" },
      });
      if (!notificationType) {
        notificationType = await NotificationType.create({
          name: "New Letter",
        });
      }
      const notification = await Notification.create({
        receiver_id: tenantId,
        receiver_type: "tenant",
        title: "New Letter",
        body: `You have received a new letter from the management`,
        type_id: notificationType.id,
      });
    }

    return res.status(201).json({ message: "Letter created successfully", newLetter, notification });
  } catch (error) {
    return res.status(500).json({ message: "Error creating letter", error: error.message });
  }
};

// Get all Letters
exports.getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.findAll(
        {
            include: [Tenant, LetterType]
        }
    );
    return res.status(200).json(letters);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching letters", error: error.message });
  }
};

// Get a Letter by ID
exports.getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id,{
        include: [Tenant, LetterType]
    });
    if (!letter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    return res.status(200).json(letter);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching letter", error: error.message });
  }
};

// Update a Letter
exports.updateLetter = async (req, res) => {
  try {
    // Validate the incoming request data using Joi
    const { error } = letterValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { letterTypeId, tenantId, Date, description, status } = req.body;

    // Check if the letter exists
    const letter = await Letter.findByPk(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    // Check if the tenant and letterTypeId are valid
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(400).json({ message: "Invalid tenantId" });
    }

    const letterType = await LetterType.findByPk(letterTypeId);
    if (!letterType) {
      return res.status(400).json({ message: "Invalid letterTypeId" });
    }

    // Update the letter
    await letter.update({
      letterTypeId,
      tenantId,
      Date,
      description,
      status,
    });

    return res.status(200).json({ message: "Letter updated successfully", letter });
  } catch (error) {
    return res.status(500).json({ message: "Error updating letter", error: error.message });
  }
};

// Delete a Letter
exports.deleteLetter = async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    await letter.destroy();

    return res.status(200).json({ message: "Letter deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting letter", error: error.message });
  }
};
