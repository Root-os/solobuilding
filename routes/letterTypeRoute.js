const express = require("express");
const router = express.Router();
const letterTypeController = require("../controllers/letterTypeController");


router.post("/", letterTypeController.createLetterType); // Create service type
router.get("/", letterTypeController.getAllLetterTypes); // Get all service types
router.get("/:id", letterTypeController.getLetterTypeById); // Get service type by ID
router.put("/:id", letterTypeController.updateLetterType); // Update service type
router.delete("/:id", letterTypeController.deleteLetterType);



// Additional routes for letterTypeController



module.exports = router;