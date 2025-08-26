const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  singleSMSController,
  bulkSMSController,
  advancedOtpController,
  webhookController,
  messageController,
} = require("../controllers/smsController");
const {
  adminAuth,
  tenantAuth,
  AdminOrTenantAuth,
  adminOrEmployeeAuth,
} = require("../middleware/auth");

const router = express.Router();
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-sms", adminOrEmployeeAuth, singleSMSController.sendSingleSMS);

router.post("/send-bulk-sms", adminOrEmployeeAuth, bulkSMSController.sendBulkSMS);
router.post(
  "/send-otp",
  AdminOrTenantAuth,
  otpLimiter,
  advancedOtpController.sendAdvancedOtp
);
router.post(
  "/verify-otp",
  AdminOrTenantAuth,
  otpLimiter,
  advancedOtpController.verifyAdvancedOtp
);
router.post("/webhook", webhookController.handleWebhook);
router.get("/",  messageController.getMessages);
router.delete("/:id",  messageController.deleteMessage);

module.exports = router;
