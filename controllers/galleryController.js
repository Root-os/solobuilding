const path = require("path");
const multer = require("multer");
const Gallery = require("../models/gallery");
const { Op } = require("sequelize");

// Use your BASE_URL from .env
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/gallery"); // save in /uploads/gallery
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB per file
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).array("images", 5); // max 5 images per upload

// Create a new gallery image (upload)
exports.createGalleryImage = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.log("Multer error:", err);
      return res.status(400).json({ message: err.message });
    }

    try {
      const files = req.files;
      console.log("req.files:", files);

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      const savedImages = [];
      for (const file of files) {
        const url = `${BASE_URL}/uploads/gallery/${file.filename}`; // full URL
        const galleryImage = await Gallery.create({ imageUrl: url });
        savedImages.push(galleryImage);
      }

      return res.status(201).json({
        message: "Images uploaded successfully",
        data: savedImages,
      });
    } catch (error) {
      console.error("Error saving images:", error);
      return res.status(500).json({ message: "Failed to save images" });
    }
  });
};

// Delete a gallery image by ID
exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Gallery.findByPk(id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    await image.destroy();

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return res.status(500).json({ message: "Failed to delete image" });
  }
};

// Get all gallery images (with full URLs)
exports.getAllGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.findAll({  });
    const selected = images.find(img => img.isSelected) || null;

    const imagesWithFullUrl = images.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      isSelected: img.isSelected
    }));

    return res.status(200).json({
      message: "Gallery images fetched successfully",
      data: imagesWithFullUrl,
      selectedBackground: selected ? selected.imageUrl : null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch images" });
  }
};


exports.selectLoginBackground = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: "Image id is required",
      });
    }

    // Reset all images
    await Gallery.update(
      { isSelected: false },
      { where: {} }
    );

    // Set the selected image
    const [updatedCount] = await Gallery.update(
      { isSelected: true },
      { where: { id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    return res.status(200).json({
      message: "Login background selected successfully",
    });
  } catch (error) {
    console.error("Select background error:", error);
    return res.status(500).json({
      message: "Failed to select background",
    });
  }
};

