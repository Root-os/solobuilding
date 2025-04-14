const Joi = require('joi');

const createTaskSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
});

const assignTaskSchema = Joi.object({
  userId: Joi.number().integer().required(),
  taskId: Joi.number().integer().required(),
});

module.exports = {
  createTaskSchema,
  assignTaskSchema,
};