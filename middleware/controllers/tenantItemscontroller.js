const TenantItem = require("../models/tenanItem");
const TenantInventory = require("../models/tenantInventory");
const Tenant = require("../models/tenant");
const { Op } = require("sequelize");


exports.getTenantItemsByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Fetch all move-in items for the tenant
    const items = await TenantItem.findAll({
      attributes: ["itemName", "quantity"],
      include: [
        {
          model: TenantInventory,
          attributes: [],
          where: { type: "move-in" },
          include: [
            {
              model: Tenant,
              attributes: ["phoneNumber"],
              where: { phoneNumber }, // Filter by phone
            },
          ],
        },
      ],
    });

    if (!items.length) {
      return res.status(404).json({
        success: false,
        message: "No items found for this tenant.",
      });
    }

    // Aggregate items by itemName
    const aggregatedItems = {};
    items.forEach((item) => {
      if (!aggregatedItems[item.itemName]) {
        aggregatedItems[item.itemName] = 0;
      }
      aggregatedItems[item.itemName] += item.quantity;
    });

    const formattedItems = Object.entries(aggregatedItems).map(
      ([itemName, quantity]) => ({ itemName, quantity })
    );

    res.json({
      success: true,
      tenants: [
        {
          phoneNumber,
          items: formattedItems,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching items by phone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tenant items by phone.",
    });
  }
};

exports.getTenantItems = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const inventories = await TenantInventory.findAll({
      where: { tenantId, type: "move-in", },
      include: [
        {
          model: TenantItem,
          required: false,
          where: {
            status: "Available",
            quantity: { [Op.gt]: 0 },
          },
        },
      ],
    });

    const items = inventories.flatMap(inv =>
      (inv.TenantItems || []).map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        inventoryId: inv.id,
        inventoryType: inv.type,
      }))
    );

    return res.json({ items });
  } catch (error) {
    console.error("❌ Error fetching tenant items:", error);
    res.status(500).json({ error: "Failed to fetch tenant items" });
  }
};

//==================================================
exports.getAllTenantItemsForAdmin = async (req, res) => {
  try {
    const items = await TenantItem.findAll();
    res.json(items);
  } catch (error) {
    console.error("Admin fetch error:", error);
    res.status(500).json({ error: "Failed to retrieve all tenant items." });
  }
};

