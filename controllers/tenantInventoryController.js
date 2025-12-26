const TenantInventory = require("../models/tenantInventory");
const Tenant = require("../models/tenant");
const Unit = require("../models/unit");
const Floor = require("../models/floor");
const {
  inventorySchema,
  paramsSchema,
  UpdateinventorySchema,
} = require("../helpers/schema");
const TenantItem = require("../models/tenanItem");
const sequelize = require("../config/database");
const { Op } = require("sequelize");


// Create inventory record (Admins & Employees Only)
const createInventory = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { error } = inventorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const checkedBy = req.user.id;
    const { tenantId, type, items, notes } = req.body;

    if (!tenantId || !type || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "tenantId, type, and items are required",
      });
    }

    const tenant = await Tenant.findByPk(tenantId, { transaction });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // 1️⃣ Find or create inventory (unique by tenantId + type)
    let inventory = await TenantInventory.findOne({
      where: { tenantId, type },
      transaction,
    });

    if (!inventory) {
      inventory = await TenantInventory.create(
        { tenantId, type, checkedBy, notes },
        { transaction }
      );
    }

    // 2️⃣ Merge items into TenantItem
    for (const item of items) {
      const existingItem = await TenantItem.findOne({
        where: {
          inventoryId: inventory.id,
          itemName: item.name,
        },
        transaction,
      });

      if (existingItem) {
        existingItem.quantity += item.quantity;
        await existingItem.save({ transaction });
      } else {
        await TenantItem.create(
          {
            inventoryId: inventory.id,
            itemName: item.name,
            quantity: item.quantity,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      inventoryId: inventory.id,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update inventory record (Admins & Employees Only)
const updateInventory = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Validate params & body
    const { error: errorParams } = paramsSchema.validate(req.params);
    if (errorParams) return res.status(400).json({ success: false, message: errorParams.details[0].message });

    const { error: errorBody } = UpdateinventorySchema.validate(req.body);
    if (errorBody) return res.status(400).json({ success: false, message: errorBody.details[0].message });

    if (!req.user?.id) return res.status(401).json({ success: false, message: "Unauthorized" });

    const checkedBy = req.user.id;

    // Fetch the inventory with its items
    const inventory = await TenantInventory.findByPk(req.params.id, { include: [TenantItem], transaction });
    if (!inventory) return res.status(404).json({ success: false, message: "Inventory not found" });

    const { items: rawItems, type: newType, ...updateData } = req.body;
    const items = Array.isArray(rawItems) ? rawItems : [];

    // Set checkedBy if changed
    if (inventory.checkedBy !== checkedBy) updateData.checkedBy = checkedBy;

    // Handle type change: merge with existing inventory of same tenantId & type
    if (newType && newType !== inventory.type) {
      const existingInventory = await TenantInventory.findOne({
        where: {
          tenantId: inventory.tenantId,
          type: newType,
          id: { [Op.not]: inventory.id },
        },
        include: [TenantItem],
        transaction,
      });

      if (existingInventory) {
        // Merge items into existing inventory
        for (const item of items) {
          const existingItem = existingInventory.TenantItems.find((i) => i.itemName === item.name);
          if (existingItem) {
            existingItem.quantity += item.quantity;
            await existingItem.save({ transaction });
          } else {
            await TenantItem.create({
              inventoryId: existingInventory.id,
              itemName: item.name,
              quantity: item.quantity,
            }, { transaction });
          }
        }

        // Delete old inventory after merging
        await TenantInventory.destroy({ where: { id: inventory.id }, transaction });
        await transaction.commit();

        const updatedInventory = await TenantInventory.findByPk(existingInventory.id, { include: [TenantItem] });
        return res.json({ success: true, inventory: updatedInventory });
      } else {
        // No existing inventory → just update type normally
        await inventory.update({ ...updateData, type: newType }, { transaction });
      }
    } else {
      // Type unchanged → update normally
      await inventory.update({ ...updateData, type: inventory.type }, { transaction });
    }

    // Handle items: remove deleted items and upsert
    const incomingNames = items.map((i) => i.name);

    // Delete removed items
    await TenantItem.destroy({
      where: { inventoryId: inventory.id, itemName: { [Op.notIn]: incomingNames } },
      transaction,
    });

    // Upsert items, preventing duplicates
    for (const item of items) {
      const existingItem = await TenantItem.findOne({
        where: { inventoryId: inventory.id, itemName: item.name },
        transaction,
      });

      if (existingItem) {
        existingItem.quantity = item.quantity;
        await existingItem.save({ transaction });
      } else {
        await TenantItem.create({
          inventoryId: inventory.id,
          itemName: item.name,
          quantity: item.quantity,
        }, { transaction });
      }
    }

    await transaction.commit();

    const updatedInventory = await TenantInventory.findByPk(inventory.id, { include: [TenantItem] });
    return res.json({ success: true, inventory: updatedInventory });

  } catch (error) {
    await transaction.rollback();
    console.error("Update Inventory Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all inventory records
const getAllInventories = async (req, res) => {
  try {
    const inventories = await TenantInventory.findAll({
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName", "email", "phoneNumber"],
          include: [
            {
              model: Unit,
              attributes: ["unitNumber"],
            },
            {
              model: Floor,
              attributes: ["floorNumber"],
            },
          ],
        },
        {
          model: TenantItem,
          attributes: ["itemName", "quantity", "status"],
        },
      ],
      order: [
        ["id", "DESC"],
        [TenantItem, "id", "ASC"],
      ],
    });

    // 🔹 Group by person (phoneNumber)
    const groupedByPhone = {};

    inventories.forEach((inventory) => {
      const tenant = inventory.Tenant;
      const phone = tenant.phoneNumber;

      // 1️⃣ Create profile group if not exists
      if (!groupedByPhone[phone]) {
        groupedByPhone[phone] = {
          phoneNumber: phone,
          fullName: tenant.fullName,
          email: tenant.email,
          units: [],
          summaryItems: {},
        };
      }

      // 2️⃣ Push inventory with unit & floor info
      groupedByPhone[phone].units.push({
        tenantId: inventory.tenantId,
        inventoryId: inventory.id,
        type: inventory.type,
        notes: inventory.notes,

        unitNumber: tenant.Unit?.unitNumber || null,
        floorNumber: tenant.Floor?.floorNumber || null,

        items: inventory.TenantItems.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          status: item.status,
        })),
      });

      // 3️⃣ (Optional for now) Aggregate items per person
      inventory.TenantItems.forEach((item) => {
        if (!groupedByPhone[phone].summaryItems[item.itemName]) {
          groupedByPhone[phone].summaryItems[item.itemName] = 0;
        }
        groupedByPhone[phone].summaryItems[item.itemName] += item.quantity;
      });
    });

    // 4️⃣ Convert summaryItems object → array
    const response = Object.values(groupedByPhone).map((tenant) => ({
      phoneNumber: tenant.phoneNumber,
      fullName: tenant.fullName,
      email: tenant.email,
      units: tenant.units,
      summaryItems: Object.entries(tenant.summaryItems).map(
        ([itemName, totalQuantity]) => ({
          itemName,
          totalQuantity,
        })
      ),
    }));

    res.json({ success: true, tenants: response });
  } catch (error) {
    console.error("Error fetching inventories:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenantInventoryByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const inventories = await TenantInventory.findAll({
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName", "email", "phoneNumber"],
          where: { phoneNumber },
          include: [
            {
              model: Unit,
              attributes: ["unitNumber"],
            },
            {
              model: Floor,
              attributes: ["floorNumber"],
            },
          ],
        },
        {
          model: TenantItem,
          attributes: ["itemName", "quantity", "status"],
        },
      ],
      order: [
        ["id", "DESC"],
        [TenantItem, "id", "ASC"],
      ],
    });

    if (!inventories.length) {
      return res.status(200).json({
        success: false,
        message: "No inventory found for this tenant",
      });
    }

    const tenant = inventories[0].Tenant;

    const units = inventories.map((inventory) => ({
      tenantId: inventory.tenantId,
      inventoryId: inventory.id,
      type: inventory.type,
      notes: inventory.notes,
      unitNumber: inventory.Tenant.Unit?.unitNumber || null,
      floorNumber: inventory.Tenant.Floor?.floorNumber || null,
      items: inventory.TenantItems.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        status: item.status,
      })),
    }));


    res.json({
      success: true,
      tenant: {
        phoneNumber: tenant.phoneNumber,
        fullName: tenant.fullName,
        email: tenant.email,
        units,
      },
    });
  } catch (error) {
    console.error("Get tenant inventory by phone error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tenant inventory",
    });
  }
};

// Get tenant's own inventory records
const getTenantInventories = async (req, res) => {
  try {
    const phoneNumber = req.user.phone; // get from token

    const inventories = await TenantInventory.findAll({
      include: [
        {
          model: Tenant,
          attributes: ['id'], // skip tenant profile
          where: { phoneNumber },
          include: [
            {
              model: Unit,
              attributes: ["unitNumber"],
            },
            {
              model: Floor,
              attributes: ["floorNumber"],
            },
          ],
        },
        {
          model: TenantItem,
          attributes: ["itemName", "quantity", "status"],
        },
      ],
      order: [
        ["id", "DESC"],
        [TenantItem, "id", "ASC"],
      ],
    });

    if (!inventories.length) {
      return res.status(200).json({
        success: false,
        message: "No inventories found for this tenant",
      });
    }

    const formattedInventories = inventories.map((inventory) => ({
      inventoryId: inventory.id,
      type: inventory.type,
      notes: inventory.notes,
      unitNumber: inventory.Tenant?.Unit?.unitNumber || null,
      floorNumber: inventory.Tenant?.Floor?.floorNumber || null,
      items: inventory.TenantItems.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        status: item.status,
      })),
    }));

    res.json({
      success: true,
      inventories: formattedInventories,
    });
  } catch (error) {
    console.error("Get tenant inventories by phone error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tenant inventories",
    });
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

//=======================================================

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

module.exports = {
  getAllInventories,
  getInventoryById,
  getTenantInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByTenantId,
  getTenantInventoryByPhoneNumber,
};
