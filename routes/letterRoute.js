const express = require("express");
const router = express.Router();
const letterController = require("../controllers/letterController");
const { adminOrEmployeeAuth, tenantAuth } = require("../middleware/auth");


router.post("/", letterController.createLetter); 
router.get("/", letterController.getAllLetters); 
router.get("/my-letters",tenantAuth, letterController.getMyLetters);
router.get("/:id", letterController.getLetterById); 
router.put("/:id", letterController.updateLetter); 
router.delete("/:id", letterController.deleteLetter);


// Additional routes for letterController



module.exports = router;