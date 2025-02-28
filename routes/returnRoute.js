const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");


router.post("/", returnController.createReturn); // Create return
router.get("/", returnController.getAllReturns); // Get all returns
router.get("/:id", returnController.getReturnById); // Get return by ID
router.put("/:id", returnController.updateReturn); // Update return
router.delete("/:id", returnController.deleteReturn); // Delete return







module.exports = router;