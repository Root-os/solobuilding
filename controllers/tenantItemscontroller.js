const TenantItem = require("../models/tenanItem");

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
exports.getTenantItemsByTenantId = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access this resource.' });
    }

    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required.' });
    }

    const items = await TenantItem.findAll({
      where: { tenantId },
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching tenant items by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve tenant items.' });
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