const Punishment = require("../models/punishment");
const Tenant = require("../models/tenant");
const { Op } = require("sequelize");


exports.createPunishment = async (req, res) => {
  try {
    const { tenantId, amount, negotiatedAmount, description, status } =
      req.body;

    // check tenant exists
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    // negotiated validation
    if (
      status !== "negotiated" &&
      negotiatedAmount !== null &&
      negotiatedAmount !== undefined &&
      negotiatedAmount !== ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Negotiated amount can only be provided when status is negotiated",
      });
    }

    if (
      status === "negotiated" &&
      (!negotiatedAmount || negotiatedAmount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Negotiated amount is required when status is negotiated",
      });
    }

    const punishment = await Punishment.create({
      tenantId,
      amount,
      negotiatedAmount,
      description,
      status,
    });

    res.status(201).json({
      message: "Punishment created successfully",
      punishment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPunishments = async (req, res) => {
  try {
    const { status, tenantId } = req.query;

    const whereClause = {};

    // filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // filter by tenantId if provided
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const punishments = await Punishment.findAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(punishments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getPunishmentsByTenantId = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const punishments = await Punishment.findAll({
      where: { tenantId },
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName"],
        },
      ],
    });

    if (!punishments || punishments.length === 0) {
      return res
        .status(404)
        .json({ message: "No punishments found for this tenant" });
    }

    res.status(200).json(punishments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePunishment = async (req, res) => {
  try {
    const { id } = req.params;

    const punishment = await Punishment.findByPk(id);

    if (!punishment) {
      return res.status(404).json({
        message: "Punishment not found",
      });
    }

    const { tenantId, amount, negotiatedAmount, description, status } =
      req.body;

    // optional tenant validation
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }
    }

    // negotiated validation
    if (
      status !== "negotiated" &&
      negotiatedAmount !== null &&
      negotiatedAmount !== undefined &&
      negotiatedAmount !== ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Negotiated amount can only be provided when status is negotiated",
      });
    }

    if (
      status === "negotiated" &&
      (!negotiatedAmount || negotiatedAmount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Negotiated amount is required when status is negotiated",
      });
    }

    await punishment.update({
      tenantId: tenantId !== undefined ? tenantId : punishment.tenantId,
      amount: amount !== undefined ? amount : punishment.amount,
      negotiatedAmount:
        negotiatedAmount !== undefined
          ? negotiatedAmount
          : punishment.negotiatedAmount,
      description:
        description !== undefined ? description : punishment.description,
      status: status !== undefined ? status : punishment.status,
    });

    res.status(200).json({
      message: "Punishment updated successfully",
      punishment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePunishment = async (req, res) => {
  try {
    const { id } = req.params;
    const punishment = await Punishment.findByPk(id);

    if (!punishment) {
      return res.status(404).json({ message: "Punishment not found" });
    }

    await punishment.destroy();
    res.status(200).json({ message: "Punishment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
