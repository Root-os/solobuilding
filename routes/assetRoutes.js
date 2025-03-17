const express = require('express');
const router = express.Router();
const {
  createAssetAudit,
  getAllAssetAudits,
  getAssetAudit,
  updateAssetAudit,
  deleteAssetAudit,
  getAssetAuditsByDate,
  getAssetAuditsByStatus,
  getAssetAuditsByStatusAndDateRange,
} = require('../controllers/assetController');

router.post('/', createAssetAudit);
router.get('/', getAllAssetAudits);
router.get('/:id', getAssetAudit);
router.put('/:id', updateAssetAudit);
router.delete('/:id', deleteAssetAudit);
router.post('/date', getAssetAuditsByDate);
router.post('/status', getAssetAuditsByStatus);
router.post('/status/date-range', getAssetAuditsByStatusAndDateRange);

module.exports = router;
