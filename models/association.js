const {
    BillPayment, 
    BillType,
    ElectricCarCharging, 
    Complaint, 
    Email, 
    Expense, 
    ExpenseType, 
    Floor, 
    ItemCategory, 
    Item, 
    NotificationType, 
    Notification, 
    Parking, 
    PaymentType, 
    PaymentRequest, 
    TenantPayment, 
    TenantRentCollection, 
    TenantVehicle, 
    Unit, 
    Message,
    Tenant,
    User, 
    WithdrawalRequest,
    Purchase,
    purchaseRequest,
    itemAssignments,
    Maintenance,
    Vendor,
    ServiceType,
    Return,
    payment,
    LetterType,
    Letter,
    Role,
    Permission,
    Task,
    LetterResponse,
    
} = require('./index');

const defineAssociations = () => {
  //association for user and role
  User.belongsTo(Role, { foreignKey: 'roleId' });
  Role.hasMany(User, { foreignKey: 'roleId' });
  Role.belongsToMany(Permission, { through: 'RolePermissions', foreignKey: 'roleId' });
  Permission.belongsToMany(Role, { through: 'RolePermissions', foreignKey: 'permissionId' });
  User.belongsToMany(Task, { through: 'UserTasks', foreignKey: 'userId' });
  Task.belongsToMany(User, { through: 'UserTasks', foreignKey: 'taskId' });

  // Define Relationships
    Item.belongsTo(ItemCategory, { foreignKey: "itemCategoryId", onDelete: "CASCADE", onUpdate: "CASCADE" });
    ItemCategory.hasMany(Item, { foreignKey: "itemCategoryId", onDelete: "CASCADE", onUpdate: "CASCADE" });

    BillPayment.belongsTo(BillType, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
    BillType.hasMany(BillPayment, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });

    ElectricCarCharging.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(ElectricCarCharging, { foreignKey: "tenantId", onDelete: "CASCADE" });
    
    Complaint.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(Complaint, { foreignKey: "tenantId", onDelete: "CASCADE" });

    Complaint.belongsTo(User, { as: "assignedEmployee", foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });
    User.hasMany(Complaint, { foreignKey: "assignedEmployeeId" });

    Email.belongsTo(User, { as: "sender", foreignKey: "senderId", onDelete: "CASCADE" });
    Email.belongsTo(Tenant, { as: "receiver", foreignKey: "receiverId", onDelete: "CASCADE" });

    Expense.belongsTo(ExpenseType, { foreignKey: "expenseTypeId", as: "expenseType", onDelete: "CASCADE" });
    ExpenseType.hasMany(Expense, { foreignKey: "expenseTypeId", as: "expenses", onDelete: "CASCADE" });

    Floor.hasMany(Tenant, { foreignKey: 'floorId', onDelete: "CASCADE" });
    Tenant.belongsTo(Floor, { foreignKey: 'floorId', onDelete: "CASCADE" });

    Floor.hasMany(Unit, { foreignKey: 'floorId', onDelete: 'CASCADE' });
    Unit.belongsTo(Floor, { foreignKey: 'floorId', onDelete: 'CASCADE' });

      // association.js (relevant section)
    Notification.belongsTo(NotificationType, { foreignKey: "type_id", as: "type", onDelete: "CASCADE" });
    NotificationType.hasMany(Notification, { foreignKey: "type_id", as: "notifications", onDelete: "CASCADE" });

    // Polymorphic associations
    Notification.belongsTo(User, {
      as: "receiverStaff",
      foreignKey: "receiver_id",
      constraints: false, // Disable FK constraint for polymorphism
    });

    Notification.belongsTo(Tenant, {
      as: "receiverTenant",
      foreignKey: "receiver_id",
      constraints: false, // Disable FK constraint for polymorphism
    });
      
    
    Parking.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(Parking, { foreignKey: "tenantId", onDelete: "CASCADE" });

    PaymentRequest.belongsTo(Tenant, { foreignKey: 'tenantId', onDelete: "CASCADE" });
    PaymentRequest.belongsTo(PaymentType, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });

    BillType.hasMany(TenantPayment, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });
    TenantPayment.belongsTo(BillType, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });

    Tenant.hasMany(TenantPayment, { foreignKey: 'tenantId', onDelete: "CASCADE" });
    TenantPayment.belongsTo(Tenant, { foreignKey: 'tenantId', onDelete: "CASCADE" });

    Tenant.hasMany(TenantRentCollection, { foreignKey: 'tenantId', onDelete: "CASCADE" });
    TenantRentCollection.belongsTo(Tenant, { foreignKey: 'tenantId', onDelete: "CASCADE" });

    Unit.hasMany(Tenant, { foreignKey: 'unitId', onDelete: "CASCADE" });
    Tenant.belongsTo(Unit, { foreignKey: 'unitId', onDelete: "CASCADE" });

    Tenant.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
    User.hasOne(Tenant, { foreignKey: "userId", onDelete: "CASCADE" });

    Tenant.hasMany(TenantVehicle, { foreignKey: "tenantId", onDelete: "CASCADE" });
    TenantVehicle.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "SETNULL" });

    WithdrawalRequest.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(WithdrawalRequest, { foreignKey: "tenantId", onDelete: "CASCADE" });

    WithdrawalRequest.belongsTo(User, { as: "assignedEmployee", foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });
    User.hasMany(WithdrawalRequest, { foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });

    //modification on fub 27 start
// purchase
    Purchase.belongsTo(Item, { foreignKey: "itemId", onDelete: "CASCADE" });
    Item.hasMany(Purchase, { foreignKey: "itemId", onDelete: "CASCADE" });

    Purchase.belongsTo(ItemCategory, { foreignKey: "ItemCategoryId", onDelete: "CASCADE" });
    ItemCategory.hasMany(Purchase, { foreignKey: "ItemCategoryId", onDelete: "CASCADE" });

    purchaseRequest.belongsTo(Item, { foreignKey: "itemId",as: 'item', onDelete: "CASCADE" });
    Item.hasMany(purchaseRequest, { foreignKey: "itemId",as: 'item', onDelete: "CASCADE" });
    
    purchaseRequest.belongsTo(User, { foreignKey: "requestedBy", as: "requestedby", onDelete: "CASCADE" });
    User.hasMany(purchaseRequest, { foreignKey: "requestedBy", as: "requests", onDelete: "CASCADE" });
    
    purchaseRequest.belongsTo(User, { foreignKey: "approvedBy", as: "approvedby", onDelete: "CASCADE" });
    User.hasMany(purchaseRequest, { foreignKey: "approvedBy", as: "approvals", onDelete: "CASCADE" });

    itemAssignments.belongsTo(Item, { foreignKey: 'itemId',as:'item' ,onDelete: 'CASCADE' });
    Item.hasMany(itemAssignments, { foreignKey: 'itemId',as:'items', onDelete: 'CASCADE' });

    itemAssignments.belongsTo(User, { foreignKey: 'assignedId',as:'assignto', onDelete: 'CASCADE' });
    User.hasMany(itemAssignments, { foreignKey: 'assignedId',as:'assignto', onDelete: 'CASCADE' });

    Maintenance.belongsTo(Item, { foreignKey: 'itemId', as: 'maintenanceItem', onDelete: 'CASCADE' });
    Item.hasMany(Maintenance, { foreignKey: 'itemId', as: 'itemMaintenances', onDelete: 'CASCADE' });

    Maintenance.belongsTo(Unit, { foreignKey: 'unitId', as: 'maintenanceUnit', onDelete: 'CASCADE' });
    Unit.hasMany(Maintenance, { foreignKey: 'unitId', as: 'unitMaintenances', onDelete: 'CASCADE' });

   //association for purchase and payment 
  Purchase.hasMany(payment, { foreignKey: 'purchaseId' });
  payment.belongsTo(Purchase, { foreignKey: 'purchaseId' });
    
    // Vendor to ServiceType
   Vendor.belongsTo(ServiceType, { foreignKey: 'serviceTypeId', onDelete: "CASCADE" });
   ServiceType.hasMany(Vendor, { foreignKey: 'serviceTypeId', onDelete: "CASCADE" });

   // Vendor to payment
   payment.belongsTo(Vendor, { foreignKey: 'vendorId', onDelete: "CASCADE" });
   Vendor.hasMany(payment, { foreignKey: 'vendorId', onDelete: "CASCADE" });

   // Vendor to Return
   Return.belongsTo(Vendor, { foreignKey: 'vendorId', onDelete: "CASCADE" });
   Vendor.hasMany(Return, { foreignKey: 'vendorId', onDelete: "CASCADE" });

   // Vendor to Purchase
   Purchase.belongsTo(Vendor, { foreignKey: 'vendorId', onDelete: "CASCADE" });
   Vendor.hasMany(Purchase, { foreignKey: 'vendorId', onDelete: "CASCADE" });

   // Return to Item
   Return.belongsTo(Item, { foreignKey: 'itemId', onDelete: "CASCADE" });
   Item.hasMany(Return, { foreignKey: 'itemId', onDelete: "CASCADE" });

   // Purchase to Item
   Purchase.belongsTo(Item, { foreignKey: 'itemId', onDelete: "CASCADE" });
   Item.hasMany(Purchase, { foreignKey: "itemId", onDelete: "CASCADE" });


   //letter with lettor type
    Letter.belongsTo(LetterType, { foreignKey: 'letterTypeId', onDelete: "CASCADE" });
    LetterType.hasMany(Letter, { foreignKey: 'letterTypeId', onDelete: "CASCADE" });

    //letter with tenant
    Letter.belongsTo(Tenant, { foreignKey: 'tenantId', onDelete: "CASCADE" });
    Tenant.hasMany(Letter, { foreignKey: 'tenantId', onDelete: "CASCADE" });


    //purchaseRequest with vendor
    purchaseRequest.belongsTo(Vendor, { foreignKey: 'vendorId',as:"vendor", onDelete: "CASCADE" });
    Vendor.hasMany(purchaseRequest, { foreignKey: 'vendorId',as:"vendor", onDelete: "CASCADE" });


    LetterResponse.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(LetterResponse, { foreignKey: "tenantId", onDelete: "CASCADE" });

    LetterResponse.belongsTo(Letter, { foreignKey: "letterId", onDelete: "CASCADE" });
    Letter.hasMany(LetterResponse, { foreignKey: "letterId", onDelete: "CASCADE" });

    Message.belongsTo(Tenant, {
  foreignKey: 'referenceId',
  targetKey: 'id',
  as: 'tenant',
  constraints: false, // disables FK constraint for polymorphism
});

Message.belongsTo(User, {
  foreignKey: 'referenceId',
  targetKey: 'id',
  as: 'user',
  constraints: false, // disables FK constraint for polymorphism
}); 
  
};

module.exports = defineAssociations;
