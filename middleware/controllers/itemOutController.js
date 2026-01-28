const TenantOutRequest = require("../models/itemOutRequest");
const ApprovedOutRequest = require("../models/approvedItemOutRequest");

const Tenant = require("../models/tenant");
const Unit = require("../models/unit");
const Floor = require("../models/floor");
const TenantInventory = require('../models/tenantInventory');
const TenantItem = require("../models/tenanItem");
const { Op } = require("sequelize");

exports.createRequest = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res
        .status(403)
        .json({ error: "Only tenants can create requests." });
    }

    const { tenantId, tenantItemId, name, quantity } = req.body;
    const requestedQty = quantity || 1;

    if (!Number.isInteger(requestedQty) || requestedQty < 1) {
      return res
        .status(400)
        .json({ error: "Quantity must be a valid positive integer." });
    }

    // Verify tenantId belongs to this user (multi-unit support)
    const tenant = await Tenant.findOne({
      where: { id: tenantId, phoneNumber: req.user.phone },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found for this user." });
    }

    const requestData = {
      tenantId: tenant.id,
      quantity: requestedQty,
    };

    let tenantItem = null;

    if (Number.isInteger(tenantItemId)) {
      // Find TenantItem through TenantInventory (linked to tenant)
      tenantItem = await TenantItem.findOne({
        where: { id: tenantItemId },
        include: {
          model: TenantInventory,
          where: { tenantId: tenant.id },
        },
      });

      if (!tenantItem) {
        return res.status(404).json({ error: "Tenant item not found for this tenant." });
      }

      if (tenantItem.quantity < requestedQty) {
        return res.status(400).json({
          error: `Requested quantity (${requestedQty}) exceeds available quantity (${tenantItem.quantity}).`,
        });
      }

      requestData.tenantItemId = tenantItemId;
    } else if (typeof name === "string" && name.trim() !== "") {
      // Custom item request
      requestData.name = name.trim();
    } else {
      return res.status(400).json({
        error:
          "You must provide either a valid tenantItemId or a name for the item.",
      });
    }

    // Create the request
    const newItem = await TenantOutRequest.create(requestData);

    res.status(201).json({
      ...newItem.toJSON(),
      tenantName: tenant.fullName || "Unknown Tenant",
      item: tenantItem
        ? { id: tenantItem.id, itemName: tenantItem.itemName }
        : requestData.name
        ? { itemName: requestData.name }
        : null,
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: "Failed to create item." });
  }
};

// tenant only update request
exports.updateRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);

    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Only tenants can update requests." });
    }

    // 1️⃣ Find the request and include the tenant's phone
    const existingRequest = await TenantOutRequest.findOne({
      where: { id: requestId, status: "Pending" },
      include: {
        model: Tenant,
        attributes: ["id", "phoneNumber"],
      },
    });

    // 2️⃣ Authorization by phone
    if (!existingRequest || existingRequest.Tenant.phoneNumber !== req.user.phone) {
      return res.status(403).json({ error: "Access denied." });
    }

    const updates = {};

    // 3️⃣ Quantity update
    if (req.body.quantity !== undefined) {
      const newQuantity = parseInt(req.body.quantity, 10);

      if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
        return res.status(400).json({ error: "Quantity must be a valid positive integer." });
      }

      if (existingRequest.tenantItemId) {
        const tenantItem = await TenantItem.findOne({
          where: { id: existingRequest.tenantItemId },
          include: {
            model: TenantInventory,
            where: { tenantId: existingRequest.tenantId },
          },
        });

        if (!tenantItem) {
          return res.status(404).json({ error: "Tenant item not found." });
        }

        if (newQuantity > tenantItem.quantity) {
          return res.status(400).json({
            error: `Requested quantity (${newQuantity}) exceeds available quantity (${tenantItem.quantity}).`,
          });
        }
      }

      updates.quantity = newQuantity;
    }

    // 4️⃣ Change item source
    if (req.body.tenantItemId !== undefined) {
      const newTenantItemId = parseInt(req.body.tenantItemId, 10);

      if (!Number.isInteger(newTenantItemId)) {
        return res.status(400).json({ error: "tenantItemId must be a valid integer." });
      }

      const tenantItem = await TenantItem.findOne({
        where: { id: newTenantItemId },
        include: {
          model: TenantInventory,
          where: { tenantId: existingRequest.tenantId },
        },
      });

      if (!tenantItem) {
        return res.status(404).json({ error: "Tenant item not found." });
      }

      const qtyToCheck = updates.quantity !== undefined ? updates.quantity : existingRequest.quantity;
      if (qtyToCheck > tenantItem.quantity) {
        return res.status(400).json({
          error: `Requested quantity (${qtyToCheck}) exceeds available quantity (${tenantItem.quantity}).`,
        });
      }

      updates.tenantItemId = newTenantItemId;
      updates.name = null; // Ensure mutual exclusivity
    }

    if (req.body.name !== undefined) {
      const trimmedName = req.body.name?.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "Item name cannot be empty." });
      }
      updates.name = trimmedName;
      updates.tenantItemId = null; // Ensure mutual exclusivity
    }

    // 5️⃣ Apply updates
    await existingRequest.update(updates);

    // 6️⃣ Build response item
    let item = null;
    if (existingRequest.tenantItemId) {
      const tenantItem = await TenantItem.findByPk(existingRequest.tenantItemId, {
        attributes: ["id", "itemName"],
      });
      if (tenantItem) {
        item = { id: tenantItem.id, itemName: tenantItem.itemName };
      }
    } else if (existingRequest.name) {
      item = { itemName: existingRequest.name };
    }

    res.json({
      ...existingRequest.toJSON(),
      item,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update request." });
  }
};


//  tenant sees only their own
exports.getAllRequests = async (req, res) => {
  try {
    const userPhone = req.user.phone; 
    if (!userPhone) {
      return res.status(400).json({ error: "Phone number missing in token" });
    }

    // 1️⃣ Get all tenants with this phone number
    const tenants = await Tenant.findAll({
      where: { phoneNumber: userPhone },
      attributes: ["id", "fullName", "email", "unitId", "floorId"],
      include: [
        { model: Unit, attributes: ["unitNumber"] },
        { model: Floor, attributes: ["floorNumber"] },
      ],
    });

    const tenantIds = tenants.map((t) => t.id);
    if (tenantIds.length === 0) return res.json([]);

    // 2️⃣ Fetch all requests for these tenantIds
    const requests = await TenantOutRequest.findAll({
      where: { tenantId: tenantIds },
      order: [["createdAt", "DESC"]],
    });

    // 3️⃣ Format requests with proper item object
    const formattedRequests = await Promise.all(
      requests.map(async (r) => {
        const tenant = tenants.find((t) => t.id === r.tenantId);

        let item = null;

        if (r.tenantItemId) {
          // fetch TenantItem details
          const tenantItem = await TenantItem.findByPk(r.tenantItemId, {
            attributes: ["id", "itemName", "quantity"],
          });

          if (tenantItem) {
            item = {
              id: tenantItem.id,
              itemName: tenantItem.itemName,
              quantity: tenantItem.quantity,
            };
          }
        } else if (r.name) {
          // use the custom name from the request
          item = {
            itemName: r.name,
            quantity: r.quantity,
          };
        }

        return {
          id: r.id,
          tenantId: r.tenantId,
          unitNumber: tenant?.Unit?.unitNumber || null,
          floorNumber: tenant?.Floor?.floorNumber || null,
          name: r.name,
          quantity: r.quantity,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          item,
        };
      })
    );

    // 4️⃣ Group under single person
    const result = [
      {
        tenantName: tenants[0]?.fullName || "Unknown Tenant",
        phoneNumber: userPhone,
        email: tenants[0]?.email || null,
        requests: formattedRequests,
      },
    ];

    res.json(result);
  } catch (error) {
    console.error("Fetch tenant requests error:", error);
    res.status(500).json({ error: "Failed to fetch requests.", details: error.message });
  }
};



//Admin can see all
exports.getAllRequestsForAdmin = async (req, res) => {
  try {
    // Fetch all requests
    const requests = await TenantOutRequest.findAll({
      order: [["id", "DESC"]],
    });

    // Group requests by tenant profile (phoneNumber)
    const groupedByTenant = {};

    for (const request of requests) {
      // Fetch tenant info for this tenantId
      const tenant = await Tenant.findOne({
        where: { id: request.tenantId },
        attributes: ["id", "fullName", "phoneNumber", "email"],
        include: [
          { model: Unit, attributes: ["unitNumber"] },
          { model: Floor, attributes: ["floorNumber"] },
        ],
      });

      if (!tenant) continue;

      const phone = tenant.phoneNumber;

      // Initialize tenant group if not exists
      if (!groupedByTenant[phone]) {
        groupedByTenant[phone] = {
          tenantName: tenant.fullName,
          phoneNumber: tenant.phoneNumber,
          email: tenant.email,
          requests: [],
        };
      }

      // Prepare item info
      let tenantItem = null;
      if (request.tenantItemId) {
        tenantItem = await TenantItem.findByPk(request.tenantItemId, {
          attributes: ["id", "itemName"],
        });
      }

      const item = request.tenantItemId && tenantItem
        ? { id: tenantItem.id, itemName: tenantItem.itemName, quantity: request.quantity }
        : request.name
        ? { itemName: request.name, quantity: request.quantity }
        : null;

      // Push request to tenant group
      groupedByTenant[phone].requests.push({
        id: request.id,
        tenantId: request.tenantId,
        unitNumber: tenant.Unit?.unitNumber || null,
        floorNumber: tenant.Floor?.floorNumber || null,
        name: request.name,
        quantity: request.quantity,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        item,
      });
    }

    // Convert grouped object to array
    const response = Object.values(groupedByTenant);

    res.json(response);
  } catch (error) {
    console.error("Fetch all admin error:", error);
    res.status(500).json({
      error: "Failed to fetch requests.",
      details: error.message,
    });
  }
};


// Get single item (tenant can access only their own)
exports.getItemById = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    console.log("Fetching item ID:", itemId, "for user ID:", req.user.id);

    const item = await TenantOutRequest.findByPk(itemId);

    if (!item) {
      console.log("Item not found");
      return res.status(404).json({ error: "Item not found." });
    }

    if (req.user.role === "tenant" && item.tenantId !== req.user.id) {
      console.log("Access denied for tenant:", req.user.id);
      return res.status(403).json({ error: "Access denied." });
    }

    res.json(item);
  } catch (error) {
    console.error("Fetch by ID error:", error); // this should show us the real issue
    res.status(500).json({ error: "Failed to fetch item." });
  }
};

// Admin-only status update
exports.updateStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update status." });
    }

    const item = await TenantOutRequest.findByPk(req.params.id);
    if (!item)
      return res.status(404).json({ error: "Request of item out not found." });

    const { status } = req.body;
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    // Only handle deduction if approving and item is linked to TenantItem
    if (status === "Approved" && item.tenantItemId) {
      const tenantItem = await TenantItem.findByPk(item.tenantItemId);
      if (!tenantItem) {
        return res.status(404).json({ error: "Tenant item not found." });
      }

      if (item.quantity > tenantItem.quantity) {
        return res.status(400).json({ error: "Requested quantity exceeds available quantity." });
      }

      if (item.quantity === tenantItem.quantity) {
        tenantItem.quantity = 0;
        tenantItem.status = "out_of_stock";
        await tenantItem.save();
      } else {
        tenantItem.quantity -= item.quantity;
        await tenantItem.save();
      }

      await ApprovedOutRequest.create({
        tenantId: item.tenantId,
        tenantItemId: item.tenantItemId,
        name: item.name,
        quantity: item.quantity,
        status: "Approved",
      });
    }

    // Update status for both TenantItem-linked or custom items
    await item.update({ status });

    res.json({ message: "Status updated successfully.", item });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
};

// Delete: tenant (only their own) or admin (any)
exports.deleteItem = async (req, res) => {
  try {
    const item = await TenantOutRequest.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    const isTenant = req.user.role === "tenant";
    const isAdmin = req.user.role === "admin";

    // If tenant, check phone number ownership
    if (isTenant) {
      // 1️⃣ Get all tenantIds for this phone number
      const tenantRecords = await Tenant.findAll({
        where: { phoneNumber: req.user.phone },
        attributes: ["id"],
      });
      const tenantIds = tenantRecords.map(t => t.id);

      // 2️⃣ Check if this item belongs to one of these tenantIds
      const isOwner = tenantIds.includes(item.tenantId);

      if (!isOwner) {
        return res.status(403).json({ error: "Not authorized to delete this item." });
      }

      // 3️⃣ Only allow pending requests
      if (item.status !== "Pending") {
        return res.status(400).json({ error: "Only pending requests can be deleted." });
      }
    }

    // Admin: can delete anything
    if (!isTenant && !isAdmin) {
      return res.status(403).json({ error: "Not authorized." });
    }

    await item.destroy();
    res.json({ message: "Item deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete item." });
  }
};
