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
  phone: Joi.string()
    .pattern(/^[0-9]+$/)
    .optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]+$/),
  password: Joi.string().required(),
}).xor("email", "phone");

const updateStaffSchema = Joi.object({
  fname: Joi.string().min(2).max(20).trim().optional(),
  lname: Joi.string().min(2).max(20).trim().optional(),
  role: Joi.string().valid("admin", "employee").optional(),
  phone: Joi.string()
    .pattern(/^[0-9]+$/)
    .optional(),
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
    .valid("available", "occupied", "under_maintenance")
    .required(),
});
const complaintUrgencySchema = Joi.object({
  status: Joi.string().valid("low", "medium", "high").required(),
});
const billRentStatusSchema = Joi.object({
  status: Joi.string().valid("Paid", "Pending", "Overdue").required(),
});
const tenantPaymentStatusSchema = Joi.object({
  status: Joi.string().valid("paid", "due", "overdue").required(),
});
const paymentRequestStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "approved", "rejected").required(),
});
const parkingStatusSchema = Joi.object({
  status: Joi.string()
    .valid("completed", "onparking", "ready to out")
    .required(),
});
const chargingStatusSchema = Joi.object({
  status: Joi.string().valid("charging", "completed", "pending").required(),
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
    return types.map((type) => ({ id: type.id, name: type.name }));
  } catch (error) {
    console.error("Error fetching notification types:", error);
    throw new Error("Unable to fetch notification types");
  }
};
const notificationTypeSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
});
// receiverId,
const notificationSchema = Joi.object({
  receiver_type: Joi.string().valid("staff", "tenant").required(),
  receiver_id: Joi.number().integer().min(0).optional(),
  title: Joi.string().min(3).max(100).required(),

  body: Joi.string().min(10).max(500).required(),
  type_id: Joi.number()
    .integer()
    .required()
    .external(async (value, helpers) => {
      const validTypes = await getNotificationTypes();
      const validTypeIds = validTypes.map((type) => type.id); // Extract only the ids
      const validTypeNames = validTypes.map((type) => type.name); // Extract the names

      if (!validTypeIds.includes(value)) {
        throw new Error(
          `Invalid "type_id". Allowed values are: ${validTypeNames.join(", ")}`
        );
      }

      return value;
    })
    .messages({
      "number.base": '"type_id" must be a number',
      "number.integer": '"type_id" must be an integer',
      "any.required": '"type_id" is required',
    }),
  isRead: Joi.boolean().optional(),
});

const billPaymentSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().min(10).max(500).required(),
  amount: Joi.number().min(0).required(),
  billTypeId: Joi.number().integer().min(0).required(),
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
  driverPhone: Joi.string()
    .pattern(/^[0-9]+$/)
    .optional(),
  chargingStartTime: Joi.date().required(),
  chargingEndTime: Joi.date().optional(),
  chargingCost: Joi.number().min(0).optional(),
  status: Joi.string().valid("charging", "completed", "pending").optional(),
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
  status: Joi.string()
    .valid("available", "occupied", "under_maintenance")
    .optional(),
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
  tenantId: Joi.number().integer().min(0).optional(),
  timeIn: Joi.date().required(),
  timeOut: Joi.date().optional(),
  price: Joi.string().optional(),
  isTenant: Joi.boolean().required(), // Make this required so conditional logic works

  status: Joi.string()
    .valid("completed", "onparking", "ready to out")
    .optional(),

  driverName: Joi.when("isTenant", {
    is: false,
    then: Joi.string().min(3).max(30).required(),
    otherwise: Joi.string().allow("").optional(),
  }),

  driverPhone: Joi.when("isTenant", {
    is: false,
    then: Joi.string()
      .pattern(/^[0-9]+$/)
      .required(),
    otherwise: Joi.string().allow("").optional(),
  }),
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
  punishmentPercentage: Joi.number().required(),
  phoneNumber: Joi.string()
    .pattern(/^(09|07)\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must start with 09 or 07 and be exactly 10 digits long",
      "string.empty": "Phone number is required",
    }),
});

const tenatSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]+$/)
    .required(),
  nationalId: Joi.string().required(),
  leaseStartDate: Joi.date().required(),
  leaseEndDate: Joi.date().optional(),
  additionalNotes: Joi.string().allow().optional(),
  amount: Joi.number().min(0).required(),
  advance: Joi.number().min(0).required(),
  tin: Joi.string().required(),
  password: Joi.string().min(6).max(25).optional(),
  document: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive", "terminated").optional(),
  floorId: Joi.number().integer().min(0).required(),
  unitId: Joi.number().integer().min(0).required(),

  //optional car details
  carPlate: Joi.string().min(3).max(20).optional(),
  carName: Joi.string().min(3).max(20).optional(),
  color: Joi.string().optional(),
});
const tenantPaymentSchema = Joi.object({
  tenantId: Joi.number().integer().min(0).required(),
  amountPaid: Joi.number().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
  paymentMethod: Joi.string().required(),
  paymentDate: Joi.date().required(),
  status: Joi.string().valid("paid", "due", "overdue").optional(),
  proofOfPayment: Joi.string().optional(),
});

const tenantRentCollectionSchema = Joi.object({
  tenantId: Joi.number().integer().min(0).required(),
  paymentDate: Joi.date().required(),
  paidDays: Joi.string().optional(),
  paymentMethod: Joi.string().required(),
  nextDueDate: Joi.date().required(),
  status: Joi.string().valid("Paid", "Pending", "Overdue").optional(),
  proofOfPayment: Joi.string().optional(),
  punishment: Joi.number().optional().default(0),
  isPaid: Joi.boolean().required()

});
const tenantVehicleSchema = Joi.object({
  tenantId: Joi.number().integer().min(0).required(),
  carPlate: Joi.string().min(3).max(20).required(),
  carName: Joi.string().min(3).max(20).required(),
  driverName: Joi.string().min(3).max(30).required(),
  driverPhone: Joi.string()
    .pattern(/^[0-9]+$/)
    .required(),
  status: Joi.string().valid("active", "inactive").optional(),
});
const unitSchema = Joi.object({
  unitNumber: Joi.string().required(),
  floorId: Joi.number().integer().min(0).required(),
  status: Joi.string()
    .valid("available", "occupied", "under_maintenance")
    .optional(),
  size: Joi.number().min(0).required(),
  availableEquipments: Joi.array().items(Joi.string()).optional(),
  problems: Joi.array().items(Joi.string()).optional(),
  rentedDate: Joi.date().optional(),
  vacatedDate: Joi.date().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  pricePerSquare: Joi.number().min(0).required(),
  rentAmount: Joi.number().required(),
  taxedRentAmount: Joi.number().required()
});

const withdrawalRequestSchema = Joi.object({
  tenantId: Joi.number().integer().min(0).required(),
  terminationDate: Joi.date().required(),
  reason: Joi.string().min(10).max(500).required(),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "processed")
    .optional(),
  adminResponse: Joi.string().optional(),
  tenantFeedback: Joi.string().optional(),
  assignedEmployeeId: Joi.number().integer().min(0).optional(),
  depositRefundStatus: Joi.string()
    .valid("not_processed", "partial", "full")
    .optional(),
  processedAt: Joi.date().optional(),
});

const salaryPaymentSchema = Joi.object({
  employeeId: Joi.number().integer().min(0).required(),
  amount: Joi.number().min(0).optional(),
  paymentMethod: Joi.string().optional(),
  status: Joi.string().valid("Paid", "Pending", "Failed").optional(),
  paymentFromDate: Joi.date().required(),
  paymentToDate: Joi.date().required(),
  allowance: Joi.number().min(0).optional(),
});
const refundStatusSchema = Joi.object({
  depositRefundStatus: Joi.string()
    .valid("not_processed", "partial", "full")
    .required(),
  requestId: Joi.number().integer().min(0).required(),
});
const stockOutSchema = Joi.object({
  source: Joi.string().valid("store", "warehouse", "supplier").required(),
  itemId: Joi.number().integer().min(0).required(),
  reason: Joi.string().min(10).max(500).required(),
  requestedQuantity: Joi.number().min(0).required(),
});
const itemAssignmentSchema = Joi.object({
  assignType: Joi.string().valid("Unit", "User").required(),
  assignDate: Joi.date().required(),
  amount: Joi.number().precision(2).min(0).required(),
  description: Joi.string().optional(),
  itemId: Joi.number().integer().min(1).required(), // itemId must exist and be a positive integer
  assignedId: Joi.number().integer().min(1).required(), // assignedId must exist and be a positive integer
});

const maintenanceValidationSchema = Joi.object({
  date: Joi.date().required(),
  description: Joi.string().required(),
  cost: Joi.number().required(),
  isItem: Joi.boolean().required(),

  itemId: Joi.number().when("isItem", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  unitId: Joi.number().when("isItem", {
    is: true,
    then: Joi.optional(), // Not required when isItem is true
    otherwise: Joi.required(), // Required when isItem is false
  }),

  name: Joi.string().when("isItem", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

// Define the Joi schema for Purchase validation
const purchaseValidationSchema = Joi.object({
  vendorId: Joi.number().integer().required(),
  amount: Joi.number().positive().precision(2).required(),
  date: Joi.date().required(),
  price: Joi.number().positive().precision(2).required(),
  description: Joi.string().optional().allow(null),
  expirationDate: Joi.date().optional().allow(null, ""),
  itemId: Joi.number().integer().required(),
  ItemCategoryId: Joi.number().integer().required(),
});
// Define the Joi schema for PurchaseRequest validation
const purchaseRequestValidationSchema = Joi.object({
  itemId: Joi.number().integer().required(),
  requestedBy: Joi.number().integer().required(),
  amount: Joi.number().positive().precision(2).required(),
  requestDate: Joi.date().required(),
  reason: Joi.string().optional().allow(null),
  approvedBy: Joi.number().integer().optional().allow(null),
  vendorId: Joi.number().integer().optional().allow(null),
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
  approvedAmount: Joi.number().positive().precision(2).optional().allow(null),
});

// Define the Joi schema for Payment validation
const paymentValidationSchema = Joi.object({
  vendorId: Joi.number().integer().required(),
  price: Joi.number().positive().required(),
  paymentMethod: Joi.string()
    .valid("cash", "credit", "bank transfer", "other")
    .required(),
  paymentDate: Joi.date().optional(),
  status: Joi.string().valid("complete", "partial", "pending").required(),
  item: Joi.string().optional(), // <-- added
  description: Joi.string().optional(), // <-- added
  purchaseId: Joi.number().integer().required(),
});

const updatePaymentValidationSchema = Joi.object({
  vendorId: Joi.number().required(),
  price: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('cash', 'credit', 'bank transfer', 'other').required(),
  status: Joi.string().valid('complete', 'partial', 'pending').required(),
  paymentDate: Joi.date().required(),
  description: Joi.string().optional(),
});

const serviceTypeValidationSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().optional().allow(""),
});
// Define the Joi schema for Return validation
const returnValidationSchema = Joi.object({
  vendorId: Joi.number().integer().required(),
  itemId: Joi.number().integer().required(),
  quantity: Joi.number().integer().positive().required(),
  reason: Joi.string().optional().allow(""),
  returnDate: Joi.date().optional(),
});
// Define the Joi schema for Vendor validation
const vendorValidationSchema = Joi.object({
  fname: Joi.string().min(1).required(),
  lname: Joi.string().min(1).required(),
  phone: Joi.string().min(1).required().messages({
    "string.base": "Phone must be a string",
    "string.empty": "Phone cannot be empty",
    "any.required": "Phone is required",
  }),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  contractTerms: Joi.string().optional(),
  serviceTypeId: Joi.number().integer().required(),
});
const vendorUpdateSchema = Joi.object({
  fname: Joi.string().min(1).optional(),
  lname: Joi.string().min(1).optional(),
  phone: Joi.string().min(1).optional().messages({
    "string.base": "Phone must be a string",
    "string.empty": "Phone cannot be empty",
  }),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  contractTerms: Joi.string().optional(),
  serviceTypeId: Joi.number().integer().optional(),
}).min(1); // Ensure at least one field is provided
const inventorySchema = Joi.object({
  tenantId: Joi.number().integer().required(),
  type: Joi.string().valid("move-in", "move-out").required(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        condition: Joi.string().optional().allow(""),
      })
    )
    .min(1)
    .required(),
  notes: Joi.string().optional().allow(""),
});
const UpdateinventorySchema = Joi.object({
  tenantId: Joi.number().integer().optional(),
  type: Joi.string().valid("move-in", "move-out").optional(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        condition: Joi.string().optional().allow(""),
      })
    )
    .min(1)
    .optional(),
  notes: Joi.string().optional().allow(""),
});
//letter Type validation
const letterTypeValidationSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().optional().allow(""),
});
// Define the Joi schema for Letter validation
const letterValidationSchema = Joi.object({
  letterTypeId: Joi.number().integer().required(),
  tenantId: Joi.number().integer().required(),
  letterDate: Joi.date().required(),
  description: Joi.string().required(),
});
//orderType validation
const orderTypeValidationSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().optional().allow(""),
  price: Joi.number().positive().required(),
});
// order validation
const orderValidationSchema = Joi.object({
  orderDate: Joi.date().required(),
  amount: Joi.number().positive().precision(2).required(),
  status: Joi.string()
    .valid("pending", "completed", "canceled", "ready", "approved")
    .optional(),
  notes: Joi.string().optional().allow(""),
  receiptImage: Joi.string().optional().allow(""),
  orderTypeId: Joi.number().integer().positive().required(),
});

// { startDate, endDate } validation
const dayBetweenQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().greater(Joi.ref("startDate")),
});

module.exports = {
  dayBetweenQuerySchema,
  UpdateinventorySchema,
  inventorySchema,
  stockOutSchema,
  refundStatusSchema,
  salaryPaymentSchema,
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
  paymentRequestSchema,
  itemAssignmentSchema,
  maintenanceValidationSchema,
  purchaseValidationSchema,
  purchaseRequestValidationSchema,
  paymentValidationSchema,
  updatePaymentValidationSchema,
  serviceTypeValidationSchema,
  returnValidationSchema,
  vendorValidationSchema,
  vendorUpdateSchema,
  letterTypeValidationSchema,
  letterValidationSchema,
  orderTypeValidationSchema,
  orderValidationSchema,
};
