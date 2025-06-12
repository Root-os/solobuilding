const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");
const upload = require("../middleware/settingUpload"); // Import multer config

// Get All Settings
router.get("/", settingController.getAllSettings);

// Get Setting by ID
router.get("/:id", settingController.getSettingById);
router.post(
  "/",
  upload.fields([{ name: 'logos', maxCount: 1 }, { name: 'seal', maxCount: 1 }, { name: 'qrImage', maxCount: 1 }, ]),
  settingController.createSetting
);
router.put(
  "/:id",
  upload.fields([
    { name: 'logos', maxCount: 1 },
    { name: 'seal', maxCount: 1 },
    { name: 'qrImage', maxCount: 1 },
  ]),
  settingController.updateSetting
);
router.delete("/:id", settingController.deleteSetting);

module.exports = router;
