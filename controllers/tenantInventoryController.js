const TenantInventory = require("../models/tenantInventory");
const Tenant = require("../models/tenant");
const {
  inventorySchema,
  paramsSchema,
  UpdateinventorySchema,
} = require("../helpers/schema");
const TenantItem = require("../models/tenanItem");

// Create inventory record (Admins & Employees Only)
const createInventory = async (req, res) => {
  try {
    const { error } = inventorySchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    const checkedBy = req.user.id;
    const { tenantId, type, items, notes } = req.body;
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant)
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });

    if (!tenantId || !type || !items) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const itemList = Array.isArray(items)
      ? items
      : items.split(",").map((i) => i.trim());

    const inventory = await TenantInventory.create({
      tenantId,
      type,
      items,
      checkedBy,
      notes,
    });
    // register items to separate model called tenant item
    if (inventory) {
      const tenantItems = await Promise.all(
        itemList.map((item) =>
          TenantItem.create({
            tenantId,
            itemName: item.name,
            quantity: item.quantity,
          })
        )
      );
    }
    res.status(201).json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update inventory record (Admins & Employees Only)
const updateInventory = async (req, res) => {
  try {
    const { error: errorParams } = paramsSchema.validate(req.params);
    if (errorParams)
      return res
        .status(400)
        .json({ success: false, message: errorParams.details[0].message });

    const { error: errorBody } = UpdateinventorySchema.validate(req.body);
    if (errorBody)
      return res
        .status(400)
        .json({ success: false, message: errorBody.details[0].message });

    const checkedBy = req.user.id;
    const inventory = await TenantInventory.findByPk(req.params.id);
    if (!inventory)
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });

    const { items, ...updateData } = req.body;

    if (inventory.checkedBy !== checkedBy) {
      updateData.checkedBy = checkedBy;
    }

    // Update main inventory record
    await inventory.update(updateData);

    // Parse items
    const itemList = Array.isArray(items)
      ? items
      : items.split(",").map((i) => i.trim());

    // Update or Insert TenantItem records
    if (itemList && itemList.length > 0) {
      for (const item of itemList) {
        const existingItem = await TenantItem.findOne({
          where: {
            tenantId: inventory.tenantId,
            itemName: item.name,
          },
        });

        if (existingItem) {
          // Update quantity
          existingItem.quantity = item.quantity;
          await existingItem.save();
        } else {
          // New item: create it
          await TenantItem.create({
            tenantId: inventory.tenantId,
            itemName: item.name,
            quantity: item.quantity,
          });
        }
      }
    }

    res.json({ success: true, inventory });
  } catch (error) {
    console.error('Update Inventory Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all inventory records
const getAllInventories = async (req, res) => {
  try {
    const inventories = await TenantInventory.findAll({
      include: {
        model: Tenant,
        attributes: ["fullName", "email", "phoneNumber"],
      },
    });
    res.json({ success: true, inventories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get inventory by ID
const getInventoryById = async (req, res) => {
  const { error } = paramsSchema.validate(req.params);
  if (error)
    return res.status(400).json({ success: false, message: error.message });
  try {
    const inventory = await TenantInventory.findByPk(req.params.id, {
      include: {
        model: Tenant,
        attributes: ["fullName", "email", "phoneNumber"],
      },
    });
    if (!inventory)
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });

    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryByTenantId = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const inventory = await TenantInventory.findAll(
      { where: { tenantId: tenantId } },
      {
        include: {
          model: Tenant,
          attributes: ["fullName", "email", "phoneNumber"],
        },
      }
    );
    if (!inventory)
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });

    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant's own inventory records
const getTenantInventories = async (req, res) => {
  try {
    const inventories = await TenantInventory.findAll({
      where: { tenantId: req.user.id },
    });
    res.json({ success: true, inventories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete inventory record (Admins & Employees Only)
const deleteInventory = async (req, res) => {
  try {
    const inventory = await TenantInventory.findByPk(req.params.id);
    if (!inventory)
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });

    await inventory.destroy();
    res
      .status(204)
      .json({ success: true, message: "Inventory deleted successfully" });
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
