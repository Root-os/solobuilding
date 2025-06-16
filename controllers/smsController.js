const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");
const createBulkSMSUtil = require("../utils/sendBulkSMSUtil");
const createAdvancedOtpUtil = require("../utils/advancedOtpUtil");
const logger = require("pino")();
const Tenant = require("../models/tenant");
const User = require("../models/user");
const Message = require("../models/message");
const { Op } = require("sequelize");

const singleSMSController = {
  async sendSingleSMS(req, res, next) {
    try {
      const { referenceType, referenceId, msg, shortcode_id, callback } =
        req.body;
      if (!referenceType || !referenceId || !msg)
        throw new Error("Reference type, ID, and message are required");
      if (!["Tenant", "User"].includes(referenceType))
        throw new Error("Reference type must be Tenant or User");

      const Model = referenceType === "Tenant" ? Tenant : User;
      logger.info(`Fetching ${referenceType} with ID ${referenceId} for SMS`);
      const modelInstance = await Model.findByPk(referenceId);
      if (!modelInstance) throw new Error(`${referenceType} not found`);

      const phoneField = referenceType === "Tenant" ? "phoneNumber" : "phone";
      if (!modelInstance[phoneField])
        throw new Error(`${referenceType} has no phone number`);

      let phone = modelInstance[phoneField];
      if (phone.startsWith("09")) {
        phone = phone.replace(/^09/, "2519");
      } else if (phone.startsWith("07")) {
        phone = phone.replace(/^07/, "2517");
      } else if (!phone.startsWith("251")) {
        throw new Error("Phone number must start with 09, 07, or 251");
      }
      if (!phone.match(/^251(9|7)\d{7,8}$/))
        throw new Error("Phone must be in format 251[9|7]xxxxxxxx[x]");
      logger.info(`Normalized phone number: ${phone}`);

      // Save SMS as pending
      const message = await Message.create({
        phoneNumber: phone,
        message: msg,
        status: "pending",
        referenceType,
        referenceId,
        type: "single",
      });

      const singleSMSUtil = createSingleSMSUtil({
        token: process.env.GEEZSMS_TOKEN,
      });
      const result = await singleSMSUtil.sendSingleSMS({
        phone,
        msg,
        shortcode_id,
        callback: callback || process.env.GEEZSMS_WEBHOOK_URL,
      });

      // Update SMS status and apiLogId
      await message.update({
        status: result.error ? "failed" : "sent",
        apiLogId: result.data?.api_log_id,
      });

      logger.info(
        { referenceType, referenceId, apiLogId: result.data?.api_log_id },
        "Single SMS sent"
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error(
        {
          error: error.message,
          referenceType: req.body.referenceType,
          referenceId: req.body.referenceId,
        },
        "Failed to send single SMS"
      );
      next(error);
    }
  },
};

const bulkSMSController = {
  async sendBulkSMS(req, res, next) {
    try {
      const { references, msg, sender_id, notify_url } = req.body;
      if (!references || !msg)
        throw new Error("References and message are required");
      if (!Array.isArray(references) || references.length === 0)
        throw new Error("References must be a non-empty array");

      const contacts = [];
      const messageRecords = [];
      for (const { referenceType, referenceId } of references) {
        if (!["Tenant", "User"].includes(referenceType))
          throw new Error("Reference type must be Tenant or User");
        const Model = referenceType === "Tenant" ? Tenant : User;
        const modelInstance = await Model.findByPk(referenceId);
        if (!modelInstance)
          throw new Error(`${referenceType} ID ${referenceId} not found`);

        const phoneField = referenceType === "Tenant" ? "phoneNumber" : "phone";
        if (!modelInstance[phoneField])
          throw new Error(
            `${referenceType} ID ${referenceId} has no phone number`
          );

        let phone = modelInstance[phoneField];
        if (phone.startsWith("09")) {
          phone = phone.replace(/^09/, "2519");
        } else if (phone.startsWith("07")) {
          phone = phone.replace(/^07/, "2517");
        } else if (!phone.startsWith("251")) {
          throw new Error(
            `Phone number for ${referenceType} ID ${referenceId} must start with 09, 07, or 251`
          );
        }
        if (!phone.match(/^251(9|7)\d{7,8}$/))
          throw new Error(
            `Invalid phone format for ${referenceType} ID ${referenceId}`
          );
        contacts.push(phone);

        // Save each SMS as pending
        const message = await Message.create({
          phoneNumber: phone,
          message: msg,
          status: "pending",
          referenceType,
          referenceId,
          type: "bulk",
        });
        messageRecords.push(message);
      }

      const bulkSMSUtil = createBulkSMSUtil({
        token: process.env.GEEZSMS_TOKEN,
      });
      const result = await bulkSMSUtil.sendBulkSMS({
        contacts,
        msg,
        sender_id,
        notify_url: notify_url || process.env.GEEZSMS_WEBHOOK_URL,
      });

      // Update message records
      if (!result.error && result.data?.api_log_id) {
        for (const message of messageRecords) {
          await message.update({
            status: "sent",
            apiLogId: result.data.api_log_id,
          });
        }
      } else {
        for (const message of messageRecords) {
          await message.update({ status: "failed" });
        }
      }

      logger.info(
        { contacts, apiLogId: result.data?.api_log_id },
        "Bulk SMS sent"
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error(
        { error: error.message, references: req.body.references },
        "Failed to send bulk SMS"
      );
      next(error);
    }
  },
};

const advancedOtpController = {
  async sendAdvancedOtp(req, res, next) {
    try {
      const { referenceType, referenceId, shortcode_id, callback } = req.body;
      if (!referenceType || !referenceId)
        throw new Error("Reference type and ID are required");
      if (!["Tenant", "User"].includes(referenceType))
        throw new Error("Reference type must be Tenant or User");

      const advancedOtpUtil = createAdvancedOtpUtil({
        token: process.env.GEEZSMS_TOKEN,
        otpLength: parseInt(process.env.OTP_LENGTH) || 6,
        otpExpirationSeconds:
          parseInt(process.env.OTP_EXPIRATION_SECONDS) || 300,
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
        lockoutSeconds: parseInt(process.env.OTP_LOCKOUT_SECONDS) || 1800,
      });
      const result = await advancedOtpUtil.generateAndSendOtp({
        referenceType,
        referenceId,
        shortcode_id,
        callback: callback || process.env.GEEZSMS_WEBHOOK_URL,
      });

      // Save OTP SMS
      await Message.create({
        phoneNumber: result.phoneNumber,
        message: `Your OTP is ${result.token}. It expires in ${
          parseInt(process.env.OTP_EXPIRATION_SECONDS) / 60
        } minutes.`,
        status: "sent",
        referenceType: "System",
        referenceId: null,
        type: "otp",
        apiLogId: result.apiLogId,
      });

      logger.info(
        { referenceType, referenceId, action: "send_advanced_otp" },
        "OTP sent"
      );
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        expiresIn: parseInt(process.env.OTP_EXPIRATION_SECONDS) || 300,
      });
    } catch (error) {
      logger.error(
        {
          error: error.message,
          referenceType: req.body.referenceType,
          referenceId: req.body.referenceId,
        },
        "Failed to send OTP"
      );
      next(error);
    }
  },

  async verifyAdvancedOtp(req, res, next) {
    try {
      const { referenceType, referenceId, token } = req.body;
      if (!referenceType || !referenceId || !token)
        throw new Error("Reference type, ID, and token are required");
      if (!["Tenant", "User"].includes(referenceType))
        throw new Error("Reference type must be Tenant or User");

      const advancedOtpUtil = createAdvancedOtpUtil({
        token: process.env.GEEZSMS_TOKEN,
        otpLength: parseInt(process.env.OTP_LENGTH) || 6,
        otpExpirationSeconds:
          parseInt(process.env.OTP_EXPIRATION_SECONDS) || 300,
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
        lockoutSeconds: parseInt(process.env.OTP_LOCKOUT_SECONDS) || 1800,
      });
      const result = await advancedOtpUtil.verifyOtp({
        referenceType,
        referenceId,
        token,
      });
      logger.info(
        { referenceType, referenceId, action: "verify_advanced_otp" },
        "OTP verified"
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error(
        {
          error: error.message,
          referenceType: req.body.referenceType,
          referenceId: req.body.referenceId,
        },
        "Failed to verify OTP"
      );
      next(error);
    }
  },
};

const webhookController = {
  async handleWebhook(req, res, next) {
    try {
      const { message_status, phone, api_log_id, message } = req.body;
      if (!phone || !api_log_id || !message_status)
        throw new Error("Phone, api_log_id, and message_status are required");

      const messageRecord = await Message.findOne({
        where: { phoneNumber: phone, apiLogId: api_log_id },
      });
      if (!messageRecord) throw new Error("Message not found");

      // Map GeezSMS status to Message status
      const statusMap = {
        success: "delivered",
        failed: "failed",
        pending: "pending",
      };
      const newStatus = statusMap[message_status.toLowerCase()] || "failed";

      await messageRecord.update({ status: newStatus });
      logger.info(
        { phone, apiLogId: api_log_id, status: newStatus },
        "SMS status updated via webhook"
      );
      res
        .status(200)
        .json({ success: true, message: "Webhook processed successfully" });
    } catch (error) {
      logger.error(
        { error: error.message, payload: req.body },
        "Failed to process webhook"
      );
      next(error);
    }
  },
};

const messageController = {
  async getMessages(req, res, next) {
    try {
      const { userId, role } = req.user;
      let messages;

      if (role.toLowerCase() === "admin") {
        // Admins get all Tenant messages
        messages = await Message.findAll({
          // where: {
          //   referenceType: "Tenant",
          // },
          include: [
            {
              model: Tenant,
              as: "tenant",
              attributes: ["fullName"],
              required: false,
              where: { id: { [Op.col]: "Message.referenceId" } },
            },
            {
              model: User,
              as: "user",
              attributes: ["fname", "lname"],
              required: false,
              where: { id: { [Op.col]: "Message.referenceId" } },
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      } else if (role.toLowerCase() === "tenant") {
        // Tenants get only their own messages
        messages = await Message.findAll({
          where: {
            referenceType: "Tenant",
            referenceId: userId,
          },
          order: [["createdAt", "DESC"]],
        });
      } else {
        throw new Error("Unauthorized role for accessing messages");
      }

      logger.info(
        { userId, role, count: messages.length },
        "Messages retrieved"
      );
      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      logger.error(
        { error: error.message, userId: req.user?.userId },
        "Failed to retrieve messages"
      );
      next(error);
    }
  },

  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const message = await Message.findByPk(id);
      if (!message) {
        throw new Error("Message not found");
      }

      if (role.toLowerCase() === "admin") {
        // Admins can delete any Tenant message
        // if (message.referenceType !== "Tenant") {
        //   throw new Error("Admins can only delete Tenant messages");
        // }
      } else if (role.toLowerCase() === "tenant") {
        // Tenants can only delete their own messages
        if (
          message.referenceType !== "Tenant" ||
          message.referenceId !== userId
        ) {
          throw new Error("Unauthorized to delete this message");
        }
      } else {
        throw new Error("Unauthorized role for deleting messages");
      }

      await message.destroy();
      logger.info({ userId, role, messageId: id }, "Message deleted");
      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      logger.error(
        {
          error: error.message,
          userId: req.user?.userId,
          messageId: req.params.id,
        },
        "Failed to delete message"
      );
      next(error);
    }
  },
};
module.exports = {
  singleSMSController,
  bulkSMSController,
  advancedOtpController,
  webhookController,
  messageController,
};
