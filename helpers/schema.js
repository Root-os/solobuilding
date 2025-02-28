const Joi = require("joi");
const NotificationType = require("../models/notificationType");

const paramsSchema = Joi.object({
  id: Joi.number().integer().min(0).required(),
});

const staffRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(25).required(),
  fname: Joi.string().min(3).max(20).trim().required(),
  lname: Joi.string().min(3).max(20).trim().required(),
  role: Joi.string().valid("admin", "employee").optional(),
  phone: Joi.string().pattern(/^[0-9]+$/).optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]+$/),
    password: Joi.string().required(),
  }).xor('email', 'phone');


const updateStaffSchema = Joi.object({
  fname: Joi.string().min(2).max(20).trim().optional(),
  lname: Joi.string().min(2).max(20).trim().optional(),
  role: Joi.string().valid("admin", "employee").optional(),
  phone: Joi.string().pattern(/^[0-9]+$/).optional(),
});

const tokenParamsSchema = Joi.object({
  token: Joi.string().required(),
});
const passwordSchema = Joi.object({
  password: Joi.string().min(6).max(25).trim().required(),
});
const changePasswordSchema = Joi.object({
 currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(25).trim().required(),
});
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const dayBetweenSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

const WithdrawalRequestStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected", "processed")
    .required(),
});
const unitFloorStatusSchema = Joi.object({
  status: Joi.string()
    .valid('available', 'occupied', 'under_maintenance')
    .required(),
});
const complaintUrgencySchema = Joi.object({
  status: Joi.string()
    .valid("low", "medium", "high")
    .required(),
});
const billRentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Paid', 'Pending', 'Overdue')
    .required(),
});
const tenantPaymentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('paid', 'due', 'overdue')
    .required(),
});
const paymentRequestStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .required(),
});
const parkingStatusSchema = Joi.object({
  status: Joi.string()
    .valid("completed", "onparking", "ready to out")
    .required(),
});
const chargingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('charging', 'completed', 'pending')
    .required(),
});

const singleEmailSchema = Joi.object({
receiverId: Joi.number().integer().min(0).required(),
  subject: Joi.string().required(),
  content: Joi.string().required(),
  status: Joi.string().valid("sent", "read").optional(),
});
const groupEmailSchema = Joi.object({
    subject: Joi.string().required(),
    content: Joi.string().required(),
    status: Joi.string().valid("sent", "read").optional(),
  });
const isActiveSchema = Joi.object({
  isActive: Joi.boolean().optional(),
});
const userRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "employee").optional(),
});
const getNotificationTypes = async () => {
  try {
    const types = await NotificationType.findAll(); 
    return types.map(type => ({ id: type.id, name: type.name }));
  } catch (error) {
    console.error('Error fetching notification types:', error);
    throw new Error('Unable to fetch notification types');
  }
};
const notificationTypeSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
});
// receiverId, 
const notificationSchema = Joi.object({
    receiver_type: Joi.string()
    .valid("staff", "tenant")
    .required(),
    receiver_id: Joi.number().integer().min(0).optional(),
    senderId: Joi.number().integer().min(0).optional(),
  title: Joi.string()
    .min(3)
    .max(100)
    .required(),
  
  body: Joi.string()
    .min(10)
    .max(500)
    .required(),
  type_id: Joi.number()
    .integer()
    .required()
    .external(async (value, helpers) => {
      const validTypes = await getNotificationTypes(); 
      const validTypeIds = validTypes.map(type => type.id); // Extract only the ids
      const validTypeNames = validTypes.map(type => type.name); // Extract the names

      if (!validTypeIds.includes(value)) {
        throw new Error(`Invalid "type_id". Allowed values are: ${validTypeNames.join(', ')}`);
      }

      return value;
    })
    .messages({
      'number.base': '"type_id" must be a number',
      'number.integer': '"type_id" must be an integer',
      'any.required': '"type_id" is required',
    }),
    isRead: Joi.boolean().optional(),

});

const billPaymentSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(500).required(),
    amount: Joi.number().min(0).required(),
    billTypeId:Joi.number().integer().min(0).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    status: Joi.string().valid("pending", "paid", "overdue").optional(),
    paymentMethod: Joi.string().optional(),
    });
const billTypeSchema = Joi.object({
    typeName: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(500).optional(),
    });
const chargingSchema = Joi.object({
    carPlate: Joi.string().min(3).max(20).optional(),
    carName: Joi.string().min(3).max(20).optional(),
    isTenant: Joi.boolean().required(),
    tenantId: Joi.number().integer().min(0).optional(),
    driverName: Joi.string().min(3).max(30).optional(),
    driverPhone: Joi.string().pattern(/^[0-9]+$/).optional(),
    chargingStartTime: Joi.date().required(),
    chargingEndTime: Joi.date().optional(),
    chargingCost: Joi.number().min(0).optional(),
    status: Joi.string().valid('charging', 'completed', 'pending').optional(),
});

const complaintSchema = Joi.object({
    assignedEmployeeId: Joi.number().integer().min(0).optional(),
    tenantId: Joi.number().integer().min(0).required(),
    description: Joi.string().min(10).max(500).required(),
    urgency: Joi.string().valid("low", "medium", "high").optional(),
    status: Joi.string().valid("pending", "in_progress", "resolved").optional(),
    images: Joi.array().items(Joi.string()).optional(),
    tenantFeedback: Joi.string().valid("satisfied", "not_satisfied").optional(),
});
const expenseSchema = Joi.object({
    amount: Joi.number().min(0).required(),
    date: Joi.date().required(),
    description: Joi.string().min(10).max(500).optional(),
    expenseTypeId: Joi.number().integer().min(0).required(),
});
const expenseTypeSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(500).optional(),
});
const floorSchema = Joi.object({
    floorNumber: Joi.string().required(),
    noUnits: Joi.string().optional(),
    status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional(),
});
const itemTypeSchema = Joi.object({
    typeName: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(500).optional(),
});
const itemSchema = Joi.object({
    itemName: Joi.string().min(3).max(50).required(),
    expirationDate: Joi.date().optional(),
    itemAmount: Joi.number().min(0).required(),
    unit: Joi.string().required(),
    itemCategory: Joi.string().required(),
    itemDetails: Joi.string().min(10).max(500).optional(),
});
const parkingSchema = Joi.object({
    parkingSpaceId: Joi.number().integer().min(0).optional(),
    carPlate: Joi.string().min(3).max(20).optional(),
    carName: Joi.string().min(3).max(20).optional(),
    driverName: Joi.string().min(3).max(30).optional(),
    driverPhone: Joi.string().pattern(/^[0-9]+$/).optional(),
    tenantId: Joi.number().integer().min(0).optional(),
    timeIn: Joi.date().required(),
    timeOut: Joi.date().optional(),
    price: Joi.string().optional(),
    isTenant: Joi.boolean().optional(),
    status: Joi.string().valid('completed', 'onparking', 'ready to out').optional(),
});

const paymentRequestSchema = Joi.object({
    tenantId: Joi.number().integer().min(0).required(),
    message: Joi.string().min(10).max(500).optional(),
    level: Joi.string().valid("low", "medium", "high").optional(),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    amount: Joi.number().min(0.01).required(),
    dueDate: Joi.date().required(),
    repeatedFor: Joi.string().optional(),
    paymentTypeId: Joi.number().integer().min(0).required(),
    receipt: Joi.string().optional(),
});
const paymentTypeSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
});
const settingSchema = Joi.object({
    key: Joi.string().required(),
    value: Joi.string().required(),
    unit: Joi.string().optional(),
    description: Joi.string().optional(),
});

const tenatSchema= Joi.object({
    fullName: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().pattern(/^[0-9]+$/).required(),
    nationalId: Joi.string().required(),
    leaseStartDate: Joi.date().required(),
    leaseEndDate: Joi.date().optional(),
    paymentStatus: Joi.string().valid('paid', 'due', 'overdue').optional(),
    additionalNotes: Joi.string().min(10).max(500).optional(),
    advance: Joi.number().min(0).required(),
    tin: Joi.string().required(),
    password: Joi.string().min(6).max(25).optional(),
    document: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    floorId: Joi.number().integer().min(0).required(),
    unitId: Joi.number().integer().min(0).required(),
});
const tenantPaymentSchema= Joi.object({
    tenantId: Joi.number().integer().min(0).required(),
    amountPaid: Joi.number().min(0).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    paymentMethod: Joi.string().required(),
    paymentDate: Joi.date().required(),
    status: Joi.string().valid('paid', 'due', 'overdue').optional(),
    proofOfPayment: Joi.string().optional(),
});

const tenantRentCollectionSchema = Joi.object({
    tenantId: Joi.number().integer().min(0).required(),
    amountPaid: Joi.number().min(0).required(),
    paymentDate: Joi.date().required(),
    paidDays: Joi.string().required(),
    paymentMethod: Joi.string().required(),
    paymentFrequency: Joi.string().valid('Monthly', 'Quarterly', 'Yearly').required(),
    nextDueDate: Joi.date().required(),
    status: Joi.string().valid('Paid', 'Pending', 'Overdue').optional(),
    proofOfPayment: Joi.string().optional(),
});
const tenantVehicleSchema = Joi.object({
    tenantId: Joi.number().integer().min(0).required(),
    carPlate: Joi.string().min(3).max(20).required(),
    carName: Joi.string().min(3).max(20).required(),
    driverName: Joi.string().min(3).max(30).required(),
    driverPhone: Joi.string().pattern(/^[0-9]+$/).required(),
    status: Joi.string().valid('active', 'inactive').optional(),
});
const unitSchema = Joi.object({
    unitNumber: Joi.string().required(),
    floorId: Joi.number().integer().min(0).required(),
    status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional(),
    size: Joi.number().min(0).required(),
    availableEquipments: Joi.array().items(Joi.string()).optional(),
    problems: Joi.array().items(Joi.string()).optional(),
    rentedDate: Joi.date().optional(),
    vacatedDate: Joi.date().optional(),
});

const withdrawalRequestSchema = Joi.object({
    tenantId: Joi.number().integer().min(0).required(),
    terminationDate: Joi.date().required(),
    reason: Joi.string().min(10).max(500).required(),
    status: Joi.string().valid("pending", "approved", "rejected", "processed").optional(),
    adminResponse: Joi.string().optional(),
    tenantFeedback: Joi.string().optional(),
    assignedEmployeeId: Joi.number().integer().min(0).optional(),
    depositRefundStatus: Joi.string().valid("not_processed", "partial", "full").optional(),
    processedAt: Joi.date().optional(),
});

module.exports = {
    paramsSchema,
    staffRegistrationSchema,
    loginSchema,
    updateStaffSchema,
    tokenParamsSchema,
    passwordSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    dayBetweenSchema,
    WithdrawalRequestStatusSchema,
    unitFloorStatusSchema,
    complaintUrgencySchema,
    billRentStatusSchema,
    tenantPaymentStatusSchema,
    paymentRequestStatusSchema,
    parkingStatusSchema,
    chargingStatusSchema,
    singleEmailSchema,
    groupEmailSchema,
    isActiveSchema,
    userRoleSchema,
    paymentTypeSchema,
    settingSchema,
    tenatSchema,
    tenantPaymentSchema,
    tenantRentCollectionSchema,
    tenantVehicleSchema,
    unitSchema,
    withdrawalRequestSchema,
    getNotificationTypes,
    notificationTypeSchema,
    notificationSchema,
    billPaymentSchema,
    billTypeSchema,
    chargingSchema,
    complaintSchema,
    expenseSchema,
    expenseTypeSchema,
    floorSchema,
    itemTypeSchema,
    itemSchema,
    parkingSchema,
    paymentRequestSchema
  };
  