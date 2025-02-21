// routes/itemTypeRoutes.js
const express = require("express");
const router = express.Router();
const itemTypeController = require("../controllers/itemTypeController");

// Route to create a new item type
router.post("/", itemTypeController.createItemType);

// Route to get all item types
router.get("/", itemTypeController.getAllItemTypes);

// Route to get an item type by ID
router.get("/:id", itemTypeController.getItemTypeById);

// Route to update an item type by ID
router.put("/:id", itemTypeController.updateItemType);

// Route to delete an item type by ID
router.delete("/:id", itemTypeController.deleteItemType);

module.exports = router;
