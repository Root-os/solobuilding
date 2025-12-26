const TenantItem = require("../models/tenanItem");
const TenantInventory = require("../models/tenantInventory");
const Tenant = require("../models/tenant");

exports.getTenantItems = async (req, res) => {
  try {
    let items;

    if (req.user.role === "admin") {
      // Admin sees all items
      items = await TenantItem.findAll();
    } else if (req.user.role === "tenant") {
      // Tenant sees only their items
      items = await TenantItem.findAll({
        where: { tenantId: req.user.id },
      });
    } else {
      return res.status(403).json({ error: "Unauthorized access." });
    }
    res.json(items);
  } catch (error) {
    console.error("Fetch items error:", error);
    res.status(500).json({ error: "Failed to retrieve items." });
  }
};

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

exports.getAllTenantItemsForAdmin = async (req, res) => {
  try {
    const items = await TenantItem.findAll();
    res.json(items);
  } catch (error) {
    console.error("Admin fetch error:", error);
    res.status(500).json({ error: "Failed to retrieve all tenant items." });
  }
};