const TenantInventory = require("../models/tenantInventory");
const Tenant = require("../models/tenant");
const {inventorySchema,paramsSchema,UpdateinventorySchema}=require('../helpers/schema');
// Create inventory record (Admins & Employees Only)
const createInventory = async (req, res) => {
    try {
        const { error } = inventorySchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message});
        const checkedBy = req.user.id;
        if (req.user.role !== "admin" && req.user.role !== "employee") {
            return res.status(403).json({ success: false, message: "Access denied. Admins or employees only." });
        }
      const { tenantId, type, items, notes } = req.body;
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });
  
      if (!tenantId || !type || !items) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
  
      const inventory = await TenantInventory.create({ tenantId, type, items, checkedBy, notes });
      res.status(201).json({ success: true, inventory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  // Update inventory record (Admins & Employees Only)
  const updateInventory = async (req, res) => {
    try {
        // Validate request parameters (ID)
        const { error: errorParams } = paramsSchema.validate(req.params);
        if (errorParams) return res.status(400).json({ success: false, message: errorParams.details[0].message });

        // Validate request body
        const { error: errorBody } = UpdateinventorySchema.validate(req.body);
        if (errorBody) return res.status(400).json({ success: false, message: errorBody.details[0].message });

        const checkedBy = req.user.id;

        // Check if user has permission
        if (req.user.role !== "admin" && req.user.role !== "employee") {
            return res.status(403).json({ success: false, message: "Access denied. Admins or employees only." });
        }

        // Find inventory record
        const inventory = await TenantInventory.findByPk(req.params.id);
        if (!inventory) return res.status(404).json({ success: false, message: "Inventory not found" });

        // Prepare update data
        const updateData = { ...req.body };

        // Only update checkedBy if it's different from the current value
        if (inventory.checkedBy !== checkedBy) {
            updateData.checkedBy = checkedBy;
        }

        // Update inventory with only the necessary fields
        await inventory.update(updateData);

        res.json({ success: true, inventory });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

  
// Get all inventory records
const getAllInventories = async (req, res) => {
  try {
    const inventories = await TenantInventory.findAll(
        { include: { model: Tenant, attributes: [ "fullName", "email" , "phoneNumber" ] } }
    );
    res.json({ success: true, inventories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get inventory by ID
const getInventoryById = async (req, res) => {
    const { error } = paramsSchema.validate(req.params);
    if (error) return res.status(400).json({ success: false, message: error.message });
  try {
    const inventory = await TenantInventory.findByPk(req.params.id, { include: { model: Tenant, attributes: [ "fullName", "email" , "phoneNumber" ] } });
    if (!inventory) return res.status(404).json({ success: false, message: "Inventory not found" });

    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryByTenantId = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
      const inventory = await TenantInventory.findAll({ where: { tenantId: tenantId } }, { include: { model: Tenant, attributes: [ "fullName", "email" , "phoneNumber" ] }, });
           if (!inventory) return res.status(404).json({ success: false, message: "Inventory not found" });
  
      res.json({ success: true, inventory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

// Get tenant's own inventory records
const getTenantInventories = async (req, res) => {
  try {
    const inventories = await TenantInventory.findAll({ where: { tenantId: req.user.id } });
    res.json({ success: true, inventories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Delete inventory record (Admins & Employees Only)
const deleteInventory = async (req, res) => {
  try {
    const inventory = await TenantInventory.findByPk(req.params.id);
    if (!inventory) return res.status(404).json({ success: false, message: "Inventory not found" });

    await inventory.destroy();
    res.status(204).json({ success: true, message: "Inventory deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllInventories,
  getInventoryById,
  getTenantInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByTenantId,
};
