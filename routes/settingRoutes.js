const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");

router.get("/", settingController.getAllSettings);
router.get("/:key", settingController.getSettingByKey);
router.post("/", settingController.createSetting);
router.put("/:key", settingController.updateSetting);
router.delete("/:key", settingController.deleteSetting);

module.exports = router;
