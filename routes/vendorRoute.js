const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const fileUpload = require("../middleware/fileUpload");

router.post("/",fileUpload, vendorController.createVendor); // Create vendor
router.get("/", vendorController.getAllVendors); // Get all vendors
router.get("/:id", vendorController.getVendorById); // Get vendor by ID
router.put("/:id", fileUpload, vendorController.updateVendor); // Update vendor
router.delete("/:id", vendorController.deleteVendor); // Delete vendor


module.exports = router;