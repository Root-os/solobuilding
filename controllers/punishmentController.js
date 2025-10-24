const Punishment = require("../models/punishment");
const Tenant = require("../models/tenant");


exports.getAllPunishments = async (req, res) => {
  try {
    const punishments = await Punishment.findAll({
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName"],
        },
      ],
      attributes: ["id", "tenantId", "amount", "description", "status"],
    });

    res.status(200).json(punishments);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      return res.status(404).json({ message: "No punishments found for this tenant" });
    }

    res.status(200).json(punishments);
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
