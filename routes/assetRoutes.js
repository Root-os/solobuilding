const express = require('express');
const router = express.Router();
const {
  createAssetAudit,
  getAllAssetAudits,
  getAssetAudit,
  updateAssetAudit,
  deleteAssetAudit
} = require('../controllers/assetController');

router.post('/', createAssetAudit);
router.get('/', getAllAssetAudits);
router.get('/:id', getAssetAudit);
router.put('/:id', updateAssetAudit);
router.delete('/:id', deleteAssetAudit);

module.exports = router;
