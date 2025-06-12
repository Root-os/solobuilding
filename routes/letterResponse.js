const express = require("express");
const router = express.Router();
const controller = require("../controllers/letterResponseController");
const { responseUpload } = require("../middleware/upload");

// Tenant routes
router.post("/", responseUpload.single("image"), controller.createOrUpdateResponse);
router.get("/my/:tenantId", controller.getMyResponses);
router.get("/my/:tenantId/:letterId", controller.getMyResponseByLetter);
router.put("/:id", responseUpload.single("image"), controller.updateResponse);
router.delete("/:id", controller.deleteResponse);

// Admin routes
router.get("/admin/:letterId", controller.getResponsesByLetter);
router.patch("/admin/status/:id", controller.updateStatus); // Accept/Reject

module.exports = router;
