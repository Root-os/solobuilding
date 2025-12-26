const express = require("express");
const router = express.Router();
const {
  getAllInventories,
  getInventoryById,
  getTenantInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByTenantId,
  getTenantInventoryByPhoneNumber,
} = require("../controllers/tenantInventoryController");

const {
  adminOrEmployeeAuth,
  tenantAuth,
} = require("../middleware/auth");

// Routes
router.get("/", getAllInventories);
router.get("/tenant", tenantAuth, getTenantInventories);
router.get("/tenant/:tenantId", getInventoryByTenantId);
router.get("/:id", adminOrEmployeeAuth, getInventoryById);
router.post("/", adminOrEmployeeAuth, createInventory);
router.put("/:id", adminOrEmployeeAuth, updateInventory);
router.delete("/:id", adminOrEmployeeAuth, deleteInventory);
router.get("/phone/:phoneNumber", getTenantInventoryByPhoneNumber);

module.exports = router;
