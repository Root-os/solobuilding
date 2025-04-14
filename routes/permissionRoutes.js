const express = require('express');
const {
  createPermission,
  assignPermissionToRole,
  getAllPermissions,
  removePermissionsFromRole,
  updatePermission,
  deletePermission,
} = require('../controllers/permissionController');
const {
  createPermissionSchema,
  assignPermissionSchema,
} = require('../validators/permissionValidator');
const authMiddleware = require('../middleware/authMiddleware');
// const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

router.post(
  '/',
  authMiddleware,
//   permissionMiddleware('manage_permissions'),
  validate(createPermissionSchema),
  createPermission
);
router.post(
  '/assign',
  authMiddleware,
//   permissionMiddleware('manage_permissions'),
  validate(assignPermissionSchema),
  assignPermissionToRole
);
router.post(
  '/revoke-permissions',
  authMiddleware,
//   permissionMiddleware('manage_permissions'),
  validate(assignPermissionSchema),
  removePermissionsFromRole
);
router.get('/', authMiddleware, getAllPermissions);
router.put('/:id', authMiddleware,  validate(createPermissionSchema),
updatePermission);
router.delete('/:id', authMiddleware,deletePermission);

module.exports = router;