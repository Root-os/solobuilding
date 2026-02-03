const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");

// Create a new gallery image
router.post("/", galleryController.createGalleryImage);
router.get("/", galleryController.getAllGalleryImages);
router.delete("/:id", galleryController.deleteGalleryImage);
router.post("/select", galleryController.selectLoginBackground);

module.exports = router;
