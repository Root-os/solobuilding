const Joi = require('joi');

const createPermissionSchema = Joi.object({
  name: Joi.string().required(),
});

const assignPermissionSchema = Joi.object({
  roleId: Joi.number().integer().required(),
  permissionIds: Joi.array().items(Joi.number().integer()).min(1).required(),
});

module.exports = {
  createPermissionSchema,
  assignPermissionSchema,
};