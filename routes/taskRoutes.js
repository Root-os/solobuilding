const express = require('express');
const {
  createTask,
  assignTaskToUser,
  getUserTasks,
} = require('../controllers/taskController');
const { createTaskSchema, assignTaskSchema } = require('../validators/taskValidator');
const authMiddleware = require('../middleware/authMiddleware');
// const permissionMiddleware = require('../middleware/permissionMiddleware');
const Joi = require('joi');

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
//   permissionMiddleware('manage_tasks'),
  validate(createTaskSchema),
  createTask
);
router.post(
  '/assign',
  authMiddleware,
//   permissionMiddleware('manage_tasks'),
  validate(assignTaskSchema),
  assignTaskToUser
);
router.get('/user', authMiddleware, getUserTasks);

module.exports = router;