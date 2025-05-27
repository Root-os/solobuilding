const express = require('express');
const router = express.Router();
const controller = require('../controllers/buildingLawController');

router.post('/', controller.createRule);
router.get('/', controller.getAllRules);
router.get('/:id', controller.getRuleById);
router.put('/:id', controller.updateRule);
router.delete('/:id', controller.deleteRule);

module.exports = router;
