const express = require('express');
const router = express.Router();
const controller = require('../controllers/buildingLawController');
const { ruleImageUpload } = require('../middleware/upload');

router.post('/', ruleImageUpload.single('image'), controller.createRule);
router.get('/', controller.getAllRules);
router.get('/:id', controller.getRuleById);
router.put('/:id',ruleImageUpload.single('image'), controller.updateRule);
router.delete('/:id', controller.deleteRule);

module.exports = router;
