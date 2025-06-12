const LetterResponse = require("../models/letterResponse");
const Letter = require("../models/letter");
const Tenant = require("../models/tenant");
const fs = require("fs");
const path = require("path");

// 1. Create or update (only 1 response per tenant per letter)
exports.createOrUpdateResponse = async (req, res) => {
  try {
    const { tenantId, letterId, message } = req.body;
    const imagePath = req.file ? `/uploads/responses/${req.file.filename}` : null;

    if (!tenantId || !letterId || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await LetterResponse.findOne({ where: { tenantId, letterId } });

    if (existing) {
      // Update existing response
      if (req.file && existing.image) {
        const oldPath = path.join(__dirname, "..", "public", existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await existing.update({
        message,
        image: imagePath || existing.image,
        status: "Pending"
      });

      return res.status(200).json({ message: "Response updated", data: existing });
    }

    // Create new response
    const response = await LetterResponse.create({ tenantId, letterId, message, image: imagePath });

    return res.status(201).json({ message: "Response submitted", data: response });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Get my responses
exports.getMyResponses = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const responses = await LetterResponse.findAll({
      where: { tenantId },
      order: [["createdAt", "DESC"]],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const dataWithFullImageUrl = responses.map((response) => {
      return {
        ...response.toJSON(),
        imageUrl: response.image
          ? `${baseUrl}/${response.image}`.replace(/([^:]\/)\/+/g, "$1")
          : null,
      };
    });

    res.status(200).json({ message: "Your responses", data: dataWithFullImageUrl });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Get single response per letter
exports.getMyResponseByLetter = async (req, res) => {
  try {
    const { tenantId, letterId } = req.params;
    const response = await LetterResponse.findOne({ where: { tenantId, letterId } });

    if (!response) return res.status(404).json({ message: "No response found" });

    const image = response.image
      ? `${req.protocol}://${req.get("host")}/${response.image.replace(/^\/+/, "")}`
      : null;

    res.status(200).json({
      message: "Response retrieved",
      data: {
        ...response.toJSON(),
        image,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. Update (tenant only)
exports.updateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const response = await LetterResponse.findByPk(id);

    if (!response) return res.status(404).json({ message: "Response not found" });

    // Delete old image if a new one is uploaded
    if (req.file && response.image) {
      const oldPath = path.join(__dirname, "..", "public", response.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update response
    await response.update({
      message: message || response.message,
      image: req.file ? `/uploads/responses/${req.file.filename}` : response.image,
      status: "Pending"
    });

    // Build full image URL
    const fullImageURL = response.image
      ? `${req.protocol}://${req.get("host")}/${response.image.replace(/^\/+/, "")}`
      : null;

    res.status(200).json({
      message: "Response updated",
      data: {
        ...response.toJSON(),
        image: fullImageURL
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. Delete
exports.deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await LetterResponse.findByPk(id);

    if (!response) return res.status(404).json({ message: "Response not found" });

    if (response.image) {
      const imagePath = path.join(__dirname, "..", "public", response.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await response.destroy();
    res.status(200).json({ message: "Response deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 6. Admin: Get all responses for a letter
exports.getResponsesByLetter = async (req, res) => {
  try {
    const { letterId } = req.params;
    const responses = await LetterResponse.findAll({
      where: { letterId },
      include: [{ model: Tenant, attributes: ["fullName", "email"] }],
      include: [{ model: Letter, attributes: ["description"] }],
      order: [["createdAt", "DESC"]],
    });

    const formattedResponses = responses.map((response) => {
      const image = response.image
        ? `${req.protocol}://${req.get("host")}/${response.image.replace(/^\/+/, "")}`
        : null;

      return {
        ...response.toJSON(),
        image,
      };
    });

    res.status(200).json({ message: "Responses retrieved", data: formattedResponses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 7. Admin: Accept / Reject
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const response = await LetterResponse.findByPk(id);
    if (!response) return res.status(404).json({ message: "Response not found" });

    await response.update({ status });

    const image = response.image
      ? `${req.protocol}://${req.get("host")}/${response.image.replace(/^\/+/, "")}`
      : null;

    res.status(200).json({
      message: "Status updated",
      data: {
        ...response.toJSON(),
        image,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

