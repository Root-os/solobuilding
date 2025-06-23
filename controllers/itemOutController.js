const TenantOutRequest = require("../models/itemOutRequest");
const ApprovedOutRequest = require("../models/approvedItemOutRequest");

const Tenant = require("../models/tenant");
const TenantItem = require("../models/tenanItem");
const { Op } = require("sequelize");

exports.createRequest = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res
        .status(403)
        .json({ error: "Only tenants can create requests." });
    }

    const { tenantItemId, name, quantity } = req.body;
    const requestedQty = quantity || 1;

    if (!Number.isInteger(requestedQty) || requestedQty < 1) {
      return res
        .status(400)
        .json({ error: "Quantity must be a valid positive integer." });
    }

    const requestData = {
      tenantId: req.user.id,
      quantity: requestedQty,
    };

    let tenantItem = null;

    if (Number.isInteger(tenantItemId)) {
      // Handle request for existing item
      tenantItem = await TenantItem.findOne({
        where: { tenantId: req.user.id, id: tenantItemId },
      });

      if (!tenantItem) {
        return res.status(404).json({ error: "Tenant item not found." });
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

    const tenant = await Tenant.findByPk(req.user.id, {
      attributes: ["fullName"],
    });

    res.status(201).json({
      ...newItem.toJSON(),
      tenantName: tenant?.fullName || "Unknown Tenant",
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

//tenant only update request
exports.updateRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);

    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Only tenants can update requests." });
    }

    const existingRequest = await TenantOutRequest.findOne({
      where: {
        id: requestId,
        tenantId: req.user.id,
        status: "Pending",
      },
    });

    if (!existingRequest) {
      return res.status(404).json({ error: "Pending request not found or access denied." });
    }

    const updates = {};
    let updatedQuantity = existingRequest.quantity;

    // Only validate quantity if tenantItemId is already set OR being set
    const tenantItemId = req.body.tenantItemId !== undefined 
      ? parseInt(req.body.tenantItemId, 10) 
      : existingRequest.tenantItemId;

    if (req.body.quantity !== undefined) {
      const newQuantity = parseInt(req.body.quantity, 10);
      if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
        return res.status(400).json({ error: "Quantity must be a positive integer." });
      }

      // If linked to a tenantItemId, validate against inventory
      if (tenantItemId) {
        const tenantItem = await TenantItem.findOne({
          where: { id: tenantItemId, tenantId: req.user.id },
        });

        if (!tenantItem) {
          return res.status(404).json({ error: "Tenant item not found." });
        }

        if (tenantItem.quantity < newQuantity) {
          return res.status(400).json({
            error: `Requested quantity (${newQuantity}) exceeds available quantity (${tenantItem.quantity}).`,
          });
        }
      }

      updatedQuantity = newQuantity;
      updates.quantity = newQuantity;
    }

    // If tenantItemId is changing
    if (req.body.tenantItemId !== undefined) {
      if (!Number.isInteger(tenantItemId)) {
        return res.status(400).json({ error: "tenantItemId must be a valid integer." });
      }

      const newTenantItem = await TenantItem.findOne({
        where: { id: tenantItemId, tenantId: req.user.id },
      });

      if (!newTenantItem) {
        return res.status(404).json({ error: "New tenant item not found." });
      }

      // Validate updated quantity against new item
      if (newTenantItem.quantity < updatedQuantity) {
        return res.status(400).json({
          error: `Requested quantity (${updatedQuantity}) exceeds available quantity in new item (${newTenantItem.quantity}).`,
        });
      }

      updates.tenantItemId = tenantItemId;
    }

    // Allow name to be changed freely
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }

    await existingRequest.update(updates);

    // Return updated item details
    const tenantItem = await TenantItem.findByPk(existingRequest.tenantItemId);

    res.json({
      ...existingRequest.toJSON(),
      item: tenantItem
        ? { id: tenantItem.id, itemName: tenantItem.itemName }
        : existingRequest.name
        ? { itemName: existingRequest.name }
        : null,
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update request." });
  }
};


//  tenant sees only their own
exports.getAllRequests = async (req, res) => {
  try {
    const where = req.user.role === "tenant" ? { tenantId: req.user.id } : {};
    const requests = await TenantOutRequest.findAll({ where });

    // Format response with tenantName and item details
    const formattedRequests = await Promise.all(
      requests.map(async (request) => {
        // Fetch tenant fullName
        const tenant = await Tenant.findByPk(request.tenantId, {
          attributes: ["fullName"],
        });

        // Fetch tenantItem if tenantItemId exists
        let tenantItem = null;
        if (request.tenantItemId) {
          tenantItem = await TenantItem.findOne({
            where: { id: request.tenantItemId, tenantId: request.tenantId },
            attributes: ["id", "itemName"],
          });
        }

        // Format item field
        const item = tenantItem
          ? { id: tenantItem.id, itemName: tenantItem.itemName }
          : request.name
          ? { itemName: request.name }
          : null;

        return {
          ...request.toJSON(),
          tenantName: tenant?.fullName || "Unknown Tenant",
          item,
        };
      })
    );

    res.json(formattedRequests);
  } catch (error) {
    console.error("Fetch all error:", error);
    res.status(500).json({ error: "Failed to fetch requests.", details: error.message });
  }
};

//Admin can see all
exports.getAllRequestsForAdmin = async (req, res) => {
  try {
    // Ensure only admins can access
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    // Fetch all requests
    const requests = await TenantOutRequest.findAll();

    // Format each request with tenant name and item details
    const formattedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get tenant's full name
        const tenant = await Tenant.findByPk(request.tenantId, {
          attributes: ["fullName"],
        });

        // Get item details if tenantItemId exists
        let tenantItem = null;
        if (request.tenantItemId) {
          tenantItem = await TenantItem.findOne({
            where: { id: request.tenantItemId, tenantId: request.tenantId },
            attributes: ["id", "itemName"],
          });
        }

        // Prepare item field
        const item = tenantItem
          ? { id: tenantItem.id, itemName: tenantItem.itemName }
          : request.name
          ? { itemName: request.name }
          : null;

        return {
          ...request.toJSON(),
          tenantName: tenant?.fullName || "Unknown Tenant",
          item,
        };
      })
    );

    res.json(formattedRequests);
  } catch (error) {
    console.error("Fetch all admin error:", error);
    res.status(500).json({ error: "Failed to fetch requests.", details: error.message });
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

    // Only handle deduction if approving
    if (status === "Approved") {
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
    const isOwner = item.tenantId === req.user.id;

    // Tenant: must be owner and status must be 'Pending'
    if (isTenant) {
      if (!isOwner) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this item." });
      }
      if (item.status !== "Pending") {
        return res
          .status(400)
          .json({ error: "Only pending requests can be deleted." });
      }
    }

    // Admin: allowed to delete any request, no status restriction
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
