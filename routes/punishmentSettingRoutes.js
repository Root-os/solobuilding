const express = require("express");
const router = express.Router();
const punishmentSettingcontroller = require("../controllers/punishmentSettingController");

router.get("/", punishmentSettingcontroller.getPunishmentSetting);
router.post("/", punishmentSettingcontroller.createPunishmentSetting);
router.put("/", punishmentSettingcontroller.updatePunishmentSetting);
router.delete("/", punishmentSettingcontroller.deletePunishmentSetting);

module.exports = router;
