const express = require('express');
const router = express.Router();
const {
  createAssetType,
  getAllAssetTypes,
  getAssetType,
  updateAssetType,
  deleteAssetType
} = require('../controllers/assetType');

router.post('/', createAssetType);
router.get('/', getAllAssetTypes);
router.get('/:id', getAssetType);
router.put('/:id', updateAssetType);
router.delete('/:id', deleteAssetType);

module.exports = router;
