const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  singleSMSController,
  bulkSMSController,
  advancedOtpController,
  webhookController,
} = require("../controllers/smsController");

const router = express.Router();
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-sms", singleSMSController.sendSingleSMS);
router.post("/send-bulk-sms", bulkSMSController.sendBulkSMS);
router.post("/send-otp", otpLimiter, advancedOtpController.sendAdvancedOtp);
router.post("/verify-otp", otpLimiter, advancedOtpController.verifyAdvancedOtp);
router.post("/webhook", webhookController.handleWebhook);

module.exports = router;
