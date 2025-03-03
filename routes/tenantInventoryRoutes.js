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
} = require("../controllers/tenantInventoryController");

const {
  adminOrEmployeeAuth,
  tenantAuth,
} = require("../middleware/auth");

// Routes
router.get("/", adminOrEmployeeAuth, getAllInventories);
router.get("/tenant", tenantAuth, getTenantInventories);
router.get("/tenant/:tenantId", adminOrEmployeeAuth, getInventoryByTenantId);
router.get("/:id", adminOrEmployeeAuth, getInventoryById);
router.post("/", adminOrEmployeeAuth, createInventory);
router.put("/:id", adminOrEmployeeAuth, updateInventory);
router.delete("/:id", adminOrEmployeeAuth, deleteInventory);

module.exports = router;
