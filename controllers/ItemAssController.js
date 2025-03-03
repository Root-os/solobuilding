const  ItemAssignment  = require("../models/itemAssignment");
const  Item  = require("../models/item");
const  User  = require("../models/user");
const { itemAssignmentSchema } = require("../helpers/schema"); // Adjust path if necessary
const {paramsSchema} = require("../helpers/schema");



// CREATE ItemAssignment
exports.createItemAssignment = async (req, res) => {
  try {
    // Validate the incoming request body using Joi schema
    const { error } = itemAssignmentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { itemId, assignedId, assignType, assignDate, amount, description } = req.body;

    // Create a new ItemAssignment record
    const newAssignment = await ItemAssignment.create({
      itemId,
      assignedId,
      assignType,
      assignDate,
      amount,
      description,
    });

    return res.status(201).json({
      message: "ItemAssignment created successfully",
      data: newAssignment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error creating ItemAssignment",
      error: error.message,
    });
  }
};


// GET all ItemAssignments
 exports.getAllItemAssignments = async (req, res) => {
  try {
    const itemAssignments = await ItemAssignment.findAll({
      include: [
        {
          model: Item,
          as: 'item', 
          attributes: ['id', 'itemName'], 
        },
        {
          model: User,
          as: 'assignto', 
          attributes: ['id', 'fname','lname','email'],
        },
      ],
    });

    return res.status(200).json({
      message: "ItemAssignments fetched successfully",
      data: itemAssignments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error fetching ItemAssignments",
      error: error.message,
    });
  }
};

// GET a specific ItemAssignment by ID
 exports.getItemAssignmentById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }
    const { id } = req.params;

    const itemAssignment = await ItemAssignment.findOne({
      where: { id },
      include: [
        {
          model: Item,
          as: 'item', 
        },
        {
          model: User,
          as: 'assignto', 
          attributes: ['id', 'fname','lname','email'],
        },
      ],
    });

    if (!itemAssignment) {
      return res.status(404).json({
        message: "ItemAssignment not found",
      });
    }

    return res.status(200).json({
      message: "ItemAssignment fetched successfully",
      data: itemAssignment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error fetching ItemAssignment",
      error: error.message,
    });
  }
};

// UPDATE an ItemAssignment
 exports.updateItemAssignment = async (req, res) => {
  try {
    // Validate the incoming request body using Joi schema
    const { error } = itemAssignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const {erroId} = paramsSchema.validate(req.params);
    if (erroId) {
      return res.status(400).json({
        message: "Validation error",
        error: erroId.details[0].message,
      });
    }


    const { id } = req.params;
    const { assignType, assignDate, amount, description } = req.body;

    const [updated] = await ItemAssignment.update(
      { assignType, assignDate, amount, description },
      { where: { id } }
    );

    if (updated) {
      const updatedAssignment = await ItemAssignment.findOne({ where: { id } });
      return res.status(200).json({
        message: "ItemAssignment updated successfully",
        data: updatedAssignment,
      });
    }

    return res.status(404).json({
      message: "ItemAssignment not found",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error updating ItemAssignment",
      error: error.message,
    });
  }
};

// DELETE an ItemAssignment
 exports.deleteItemAssignment = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      }); 
    }

    const { id } = req.params;

    const deleted = await ItemAssignment.destroy({ where: { id } });

    if (deleted) {
      return res.status(200).json({
        message: "ItemAssignment deleted successfully",
      });
    }

    return res.status(404).json({
      message: "ItemAssignment not found",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error deleting ItemAssignment",
      error: error.message,
    });
  }
};

// REPORT ItemAssignments based on itemId, assignDate, and assignType
exports.generateReport = async (req, res) => {
    try {

      const { error } = itemAssignmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          message: "Validation error",
          error: error.details[0].message,
        });
      }
      
      const { itemId, assignDate, assignType } = req.body;
  
      const whereConditions = {};
      if (itemId) whereConditions.itemId = itemId;
      if (assignDate) whereConditions.assignDate = assignDate;
      if (assignType) whereConditions.assignType = assignType;
  
      // Fetch the filtered ItemAssignments based on the conditions
      const report = await ItemAssignment.findAll({
        where: whereConditions,
        include: [
          {
            model: Item,
            as: 'item',
            attributes: ['id', 'itemName'],
          },
          {
            model: User,
            as: 'assignto',
            attributes: ['id', 'fname', 'lname', 'email'],
          },
        ],
      });
  
      if (report.length === 0) {
        return res.status(404).json({
          message: "No ItemAssignments found for the provided criteria",
        });
      }
  
      return res.status(200).json({
        message: "ItemAssignment report generated successfully",
        data: report,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error generating ItemAssignment report",
        error: error.message,
      });
    }
  };
  


