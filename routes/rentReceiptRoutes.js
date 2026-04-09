const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/rentReceiptController");

router.post("/", receiptController.createReceipt);
router.get("/", receiptController.getAllReceipts);
router.get("/:id", receiptController.getReceiptById);
router.put("/:id", receiptController.updateReceipt);
router.delete("/:id", receiptController.deleteReceipt);

module.exports = router;