const { Letter } = require('../models'); 
const Tenant = require('../models/tenant');
const LetterType = require('../models/letterType');
const LetterResponse = require('../models/letterResponse');
const Unit = require('../models/unit');
const Floor = require('../models/floor');
const {letterValidationSchema} = require('../helpers/schema');
const sendNotificationHelper= require('../helpers/sendAlert');
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");

// Create a Letter
exports.createLetter = async (req, res) => {
  try {
    const { error } = letterValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { letterTypeId, tenantId, letterDate, description } = req.body;

    letterDate = new Date(letterDate);

    if (isNaN(letterDate.getTime())) { 
      return res.status(400).json({ message: "Invalid date format" });
    }

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
      Date: letterDate,  // Use the renamed letterDate variable here
      description,
      status: "Sent",
    });

    
    const formattedDate = new Date(newLetter.Date).toLocaleDateString();
    const notification = await sendNotificationHelper({
      adminId: tenant.id,
      title: `Dear ${tenant.fullName} you have New Letter`,
      body: `You have received a new letter from the management on ${formattedDate}. Please check your dashboard for more details.`,
      type: "New Letter",
      receiver_type: "tenant"
      });
      const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
      const loginUrl = process.env.TENANT_PORTAL_URL;
      await smsUtil.sendSingleSMS({
        phone: tenant.phoneNumber,
        msg: `You have received a new letter from the management on ${formattedDate}.
             Please check your dashboard for more details. + \nLogin here: ${loginUrl}`, 
        callback: process.env.GEEZSMS_WEBHOOK_URL, 
      });

      return res.status(201).json({ message: "Letter created successfully", newLetter, notification });
    } catch (error) {
      return res.status(500).json({ message: "Error creating letter", error: error.message });
    }
  };

// Get all Letters
exports.getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.findAll({
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
          include: [
            {
              model: Floor,
              attributes: ['floorNumber']
            },
            {
              model: Unit,
              attributes: ['unitNumber']
            }
          ]
        },
        {model: LetterResponse, attributes: ['id','message']},
        { model: LetterType }
      ]
    });

    return res.status(200).json(letters);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching letters", error: error.message });
  }
};

// Get a Letter by ID
exports.getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id,{
        include: [
          {model:Tenant,
            attributes: ['fullName', 'email', 'phoneNumber'],
            include: [
              {
                model: Floor,attributes:['floorNumber']
                
              },
              {
                model: Unit,attributes:['unitNumber']
                
              }
            ]
          },
           {model:LetterType}
          ]
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
    const letter = await Letter.findByPk(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    // Extract fields from request body
    const { letterTypeId, tenantId, Date, description, status } = req.body;

    // Validate foreign keys only if provided
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) return res.status(400).json({ message: "Invalid tenantId" });
    }

    if (letterTypeId) {
      const letterType = await LetterType.findByPk(letterTypeId);
      if (!letterType) return res.status(400).json({ message: "Invalid letterTypeId" });
    }

    // Build update object dynamically
    const updatedFields = {};
    if (letterTypeId !== undefined) updatedFields.letterTypeId = letterTypeId;
    if (tenantId !== undefined) updatedFields.tenantId = tenantId;
    if (Date !== undefined) updatedFields.Date = Date;
    if (description !== undefined) updatedFields.description = description;
    if (status !== undefined) updatedFields.status = status;

    // Update only the fields provided
    await letter.update(updatedFields);

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

exports.getMyLetters = async (req, res) => {
  try {
    const phoneNumber = req.user.phone;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number not found in token' });
    }

    // 1️⃣ Get all tenants with this phone number
    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ['id', 'fullName', 'email', 'phoneNumber']
    });

    if (!tenants.length) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenantIds = tenants.map(t => t.id);

    // 2️⃣ Get all letters for these tenants
    const letters = await Letter.findAll({
      where: { tenantId: tenantIds },
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
          include: [
            { model: Floor, attributes: ['floorNumber'] },
            { model: Unit, attributes: ['unitNumber'] }
          ]
        },
        { model: LetterType, attributes: ['id','name','description'] },
        { model: LetterResponse, attributes: ['id','message'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!letters.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No letters found for this phone number'
      });
    }

    // 3️⃣ Group letters by phoneNumber
    const groupedByPhone = {};

    letters.forEach(letter => {
      const tenant = letter.Tenant;
      const phone = tenant.phoneNumber;

      if (!groupedByPhone[phone]) {
        groupedByPhone[phone] = {
          phoneNumber: phone,
          fullName: tenant.fullName,
          email: tenant.email,
          letters: []
        };
      }

      groupedByPhone[phone].letters.push({
        id: letter.id,
        description: letter.description,
        Date: letter.Date,
        status: letter.status,
        createdAt: letter.createdAt,
        updatedAt: letter.updatedAt,
        tenantId: letter.tenantId,
        unit: { unitNumber: tenant.Unit?.unitNumber || null },
        floor: { floorNumber: tenant.Floor?.floorNumber?.trim() || null },
        letterType: letter.LetterType || null,
        letterResponses: letter.LetterResponses || []
      });
    });

    return res.status(200).json({
      success: true,
      data: Object.values(groupedByPhone)
    });

  } catch (error) {
    console.error('Error retrieving tenant letters:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


