const express = require('express');
const { createRole, getAllRoles } = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
// const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

router.post(
  '/',
  // authMiddleware,
//   permissionMiddleware('manage_roles'),
  createRole
);
router.get('/', authMiddleware, getAllRoles);

module.exports = router;