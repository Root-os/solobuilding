const express = require("express");
const router = express.Router();
const paymentSettingController = require("../controllers/paymentSettingController");

router.post("/", paymentSettingController.createPaymentSetting);
router.get("/", paymentSettingController.getAllPaymentSettings);
router.get("/payment-methods", paymentSettingController.getAllPaymentMethods);
router.get("/:id", paymentSettingController.getPaymentSettingById);
router.put("/:id", paymentSettingController.updatePaymentSetting);
router.delete("/:id", paymentSettingController.deletePaymentSetting);

module.exports = router;
