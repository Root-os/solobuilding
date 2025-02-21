const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");

// Create parking record
router.post("/", parkingController.addParking);

// Get all parkings
router.get("/", parkingController.getAllParkings);

// Update parking record by ID (e.g., car leaves)
router.put("/:id", parkingController.updateParking);

// Delete parking record by ID
router.delete("/:id", parkingController.deleteParking);
router.post("/report/all", parkingController.filterParking);
// Get parking records by status
router.get("/by-status/:status", parkingController.getParkingsByStatus);



module.exports = router;
