const express = require('express');
const router = express.Router();
const punishmentController = require("../controllers/punishmentController");

router.get("/", punishmentController.getAllPunishments);
router.get("/:tenantId", punishmentController.getPunishmentsByTenantId);
router.delete("/:id", punishmentController.deletePunishment);

module.exports = router;