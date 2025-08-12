const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const upload = require('../middleware/unitIUpload');

router.post('/', upload.array('images', 10), unitController.createUnit);
router.get('/', unitController.getAllUnits);
router.get('/:id', unitController.getUnitById);
router.get('/floor/:floorId', unitController.getUnitsByFloorId); // New route to get units by floorId
router.put('/:id', upload.array('images', 10), unitController.updateUnit);
router.delete('/:id', unitController.deleteUnit);
router.get('/rented/units', unitController.getRentedUnits);
router.get('/free/units', unitController.getFreeUnits);
router.get('/status/data/report', unitController.getUnitStatusReport); 

module.exports = router;

