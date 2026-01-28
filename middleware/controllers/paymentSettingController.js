const PaymentSetting = require("../models/paymentSetting");

/**
 * Create a new payment setting
 */
exports.createPaymentSetting = async (req, res) => {
  try {
    const { paymentMethod, receiverName, receiverAccountNumber } = req.body;

    // Validate required fields
    if (!paymentMethod || !receiverName || !receiverAccountNumber) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Create new payment setting record
    const paymentSetting = await PaymentSetting.create({
      paymentMethod,
      receiverName,
      receiverAccountNumber,
    });

    return res.status(201).json({
      message: "Payment setting created successfully",
      data: paymentSetting,
    });
  } catch (error) {
    console.error("Error creating payment setting:", error);
    return res.status(500).json({
      message: "Failed to create payment setting",
    });
  }
};

/**
 * Get all payment settings
 */
exports.getAllPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSetting.findAll();

    return res.status(200).json({
      data: settings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch payment settings",
    });
  }
};

/**
 * Get single payment setting by ID
 */
exports.getPaymentSettingById = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await PaymentSetting.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        message: "Payment setting not found",
      });
    }

    return res.status(200).json({
      data: setting,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch payment setting",
    });
  }
};

/**
 * Update payment setting
 */
exports.updatePaymentSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, recieverName, recieverAccountNumber } = req.body;

    const setting = await PaymentSetting.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        message: "Payment setting not found",
      });
    }

    await setting.update({
      paymentMethod,
      recieverName,
      recieverAccountNumber,
    });

    return res.status(200).json({
      message: "Payment setting updated successfully",
      data: setting,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update payment setting",
    });
  }
};

/**
 * Delete payment setting
 */
exports.deletePaymentSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await PaymentSetting.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        message: "Payment setting not found",
      });
    }

    await setting.destroy();

    return res.status(200).json({
      message: "Payment setting deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete payment setting",
    });
  }
};
