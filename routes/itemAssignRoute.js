const express = require('express');
const router = express.Router();
const ItemAssController = require('../controllers/ItemAssController');

router.post('/', ItemAssController.createItemAssignment);
router.get('/', ItemAssController.getAllItemAssignments);
router.get('/:id', ItemAssController.getItemAssignmentById);
router.put('/:id', ItemAssController.updateItemAssignment);
router.delete('/:id', ItemAssController.deleteItemAssignment);
router.post('/report', ItemAssController.generateReport);





module.exports = router;
