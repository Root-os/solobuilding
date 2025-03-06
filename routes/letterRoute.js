const express = require("express");
const router = express.Router();
const letterController = require("../controllers/letterController");


router.post("/", letterController.createLetter); 
router.get("/", letterController.getAllLetters); 
router.get("/:id", letterController.getLetterById); 
router.put("/:id", letterController.updateLetter); 
router.delete("/:id", letterController.deleteLetter);



// Additional routes for letterController



module.exports = router;