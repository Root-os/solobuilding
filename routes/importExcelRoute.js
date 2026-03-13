const express = require("express");
const router = express.Router();
const importTenantExcel = require("../controllers/importTenantExcel");

router.post("/tenants", importTenantExcel.importTenants);

module.exports = router;
