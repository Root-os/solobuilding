const express = require("express");
const router = express.Router();
const controller = require("../controllers/calenderController");

router.get("/convert", controller.convertCalendar);

module.exports = router;
