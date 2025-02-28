const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

router.post("/", itemController.createItem); // Create item
router.get("/", itemController.getAllItems); // Get all items
router.get("/:id", itemController.getItemById); // Get item by ID
router.get("/category/:id", itemController.getItemByCategoryId);

router.put("/:id", itemController.updateItem); // Update item
router.delete("/:id", itemController.deleteItem); // Delete item
router.delete("/expired-items", itemController.getExpiredItems); // Delete item

module.exports = router;
