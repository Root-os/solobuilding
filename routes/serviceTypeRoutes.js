const express = require("express");
const router = express.Router();
const serviceTypeController = require("../controllers/serviceTypeController");


router.post("/", serviceTypeController.createServiceType); // Create service type
router.get("/", serviceTypeController.getAllServiceTypes); // Get all service types
router.get("/:id", serviceTypeController.getServiceTypeById); // Get service type by ID
router.put("/:id", serviceTypeController.updateServiceType); // Update service type
router.delete("/:id", serviceTypeController.deleteServiceType);



// Additional routes for serviceTypeController



module.exports = router;