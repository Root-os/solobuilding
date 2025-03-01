// routes/ItemCategoryRoutes.js
const express = require("express");
const router = express.Router();
const ItemCategoryController = require("../controllers/itemCategoryController");

// Route to create a new item type
router.post("/", ItemCategoryController.createItemCategory);

// Route to get all item types
router.get("/", ItemCategoryController.getAllItemCategorys);

// Route to get an item type by ID
router.get("/:id", ItemCategoryController.getItemCategoryById);


// Route to update an item type by ID
router.put("/:id", ItemCategoryController.updateItemCategory);

// Route to delete an item type by ID
router.delete("/:id", ItemCategoryController.deleteItemCategory);


module.exports = router;
