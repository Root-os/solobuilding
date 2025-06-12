const  ItemAssignment  = require("../models/itemAssignment");
const  Item  = require("../models/item");
const  User  = require("../models/user");
const { itemAssignmentSchema } = require("../helpers/schema"); // Adjust path if necessary
const {paramsSchema} = require("../helpers/schema");

// CREATE ItemAssignment
exports.createItemAssignment = async (req, res) => {
  try {
    const { error } = itemAssignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { itemId, assignedId, assignType, assignDate, amount, description } = req.body;

    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("Initial itemAmount:", item.itemAmount);

    if (parseFloat(item.itemAmount) < parseFloat(amount)) {
      return res.status(400).json({ message: "Insufficient item amount" });
    }

    // Deduct from itemAmount
    item.itemAmount = parseFloat(item.itemAmount) - parseFloat(amount);
    await item.save();

    console.log("Updated itemAmount after deduction:", item.itemAmount);

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
    console.error("Error in createItemAssignment:", error);
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
    const { error } = itemAssignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { erroId } = paramsSchema.validate(req.params);
    if (erroId) {
      return res.status(400).json({
        message: "Validation error",
        error: erroId.details[0].message,
      });
    }

    const { id } = req.params;
    const { assignType, assignDate, amount, description } = req.body;

    const existingAssignment = await ItemAssignment.findByPk(id);
    if (!existingAssignment) {
      return res.status(404).json({ message: "ItemAssignment not found" });
    }

    const item = await Item.findByPk(existingAssignment.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Restore previous amount
    item.itemAmount = parseFloat(item.itemAmount) + parseFloat(existingAssignment.amount);

    // Deduct new amount
    if (parseFloat(item.itemAmount) < parseFloat(amount)) {
      return res.status(400).json({ message: "Insufficient item amount for update" });
    }

    item.itemAmount = parseFloat(item.itemAmount) - parseFloat(amount);
    await item.save();

    // Update the assignment
    await ItemAssignment.update(
      { assignType, assignDate, amount, description },
      { where: { id } }
    );

    const updatedAssignment = await ItemAssignment.findByPk(id);

    return res.status(200).json({
      message: "ItemAssignment updated and itemAmount adjusted",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Error in updateItemAssignment:", error);
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

    const assignment = await ItemAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: "ItemAssignment not found" });
    }

    const item = await Item.findByPk(assignment.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Restore the amount
    item.itemAmount = parseFloat(item.itemAmount) + parseFloat(assignment.amount);
    await item.save();

    await ItemAssignment.destroy({ where: { id } });

    return res.status(200).json({
      message: "ItemAssignment deleted and itemAmount restored",
    });
  } catch (error) {
    console.error("Error in deleteItemAssignment:", error);
    return res.status(500).json({
      message: "Error deleting ItemAssignment",
      error: error.message,
    });
  }
};

// REPORT ItemAssignments based on itemId, assignDate, and assignType
exports.generateReport = async (req, res) => {
    try {

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
       return res.status(200).json([]);
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
  


