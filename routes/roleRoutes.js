const express = require('express');
const { createRole, getAllRoles, updateRole,deleteRole} = require('../controllers/roleController');
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
router.put('/:id',  authMiddleware,updateRole);
router.delete('/:id',  authMiddleware,deleteRole);

module.exports = router;