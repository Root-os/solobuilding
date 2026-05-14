const express = require('express');
const router = express.Router();
const punishmentController = require("../controllers/punishmentController");

router.post("/", punishmentController.createPunishment);
router.get("/", punishmentController.getAllPunishments);
router.get("/:tenantId", punishmentController.getPunishmentsByTenantId);
router.put("/:id", punishmentController.updatePunishment);
router.delete("/:id", punishmentController.deletePunishment);

module.exports = router;