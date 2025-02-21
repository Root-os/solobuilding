const { 
    BillPayment, 
    BillType, 
    ElectricCarCharging, 
    Complaint, 
    Email, 
    Expense, 
    ExpenseType, 
    Floor, 
    Item, 
    ItemType, 
    Notification, 
    NotificationType, 
    Parking, 
    PaymentRequest, 
    PaymentType, 
    Tenant,
    TenantPayment, 
    TenantRentCollection, 
    TenantVehicle, 
    Unit, 
    User, 
    WithdrawalRequest,
} = require('./index');


const defineAssociations = () => {
    // Define Relationship

BillPayment.belongsTo(BillType, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
BillType.hasMany(BillPayment, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });

ElectricCarCharging.belongsTo(Tenant, { foreignKey: "tenantId" });
Tenant.hasOne(ElectricCarCharging, { foreignKey: "tenantId" });

Complaint.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Complaint, { foreignKey: "tenantId" });

Complaint.belongsTo(User, { as: "assignedEmployee", foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });
User.hasMany(Complaint, { foreignKey: "assignedEmployeeId" });
Email.belongsTo(User, { as: "sender", foreignKey: "senderId", onDelete: "CASCADE" });
Email.belongsTo(User, { as: "receiver", foreignKey: "receiverId", onDelete: "CASCADE" });
Expense.belongsTo(ExpenseType, { foreignKey: "expenseTypeId", as: "expenseType" });
ExpenseType.hasMany(Expense, { foreignKey: "expenseTypeId", as: "expenses" });
Floor.hasMany(Tenant, { foreignKey: 'floorId'});
Tenant.belongsTo(Floor, { foreignKey: 'floorId' });
Floor.hasMany(Unit, { foreignKey: 'floorId', onDelete: 'CASCADE' });
Unit.belongsTo(Floor, { foreignKey: 'floorId' });
Item.belongsTo(ItemType, { foreignKey: "itemTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
ItemType.hasMany(Item, { foreignKey: "itemTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
Notification.belongsTo(NotificationType, {foreignKey: "type_id",as: "type",});
NotificationType.hasMany(Notification, {foreignKey: "type_id", as: "notifications", });






Unit.hasMany(Tenant, { foreignKey: 'unitId', });
Tenant.belongsTo(Unit, { foreignKey: 'unitId' });



// Correct relationships
Tenant.hasMany(TenantRentCollection, { foreignKey: 'tenantId' });
TenantRentCollection.belongsTo(Tenant, { foreignKey: 'tenantId' });


// Associations
PaymentType.hasMany(TenantPayment, { foreignKey: 'billPaymentTypeId' });
TenantPayment.belongsTo(PaymentType, { foreignKey: 'billPaymentTypeId' });

Tenant.hasMany(TenantPayment, { foreignKey: 'tenantId' });
TenantPayment.belongsTo(Tenant, { foreignKey: 'tenantId' });
// Associations
Parking.belongsTo(Tenant, { foreignKey: "tenantId" });
Tenant.hasOne(Parking, { foreignKey: "tenantId" });


// Associations
  PaymentRequest.belongsTo(Tenant, { foreignKey: 'tenantId' });
  PaymentRequest.belongsTo(PaymentType, { foreignKey: 'PaymentTypeId' });
// Define associations









// Associations for User and Tenant (One-to-One)
User.hasOne(Tenant, { foreignKey: "userId", onDelete: "CASCADE" });
Tenant.belongsTo(User, { foreignKey: "userId" });

// Associations for Tenant and Unit (Many-to-One)
Tenant.belongsTo(Unit, { foreignKey: "unitId", onDelete: "SET NULL" });
Unit.hasMany(Tenant, { foreignKey: "unitId" });

// Associations for Tenant and TenantVehicle (One-to-Many)
Tenant.hasMany(TenantVehicle, { foreignKey: "tenantId", onDelete: "CASCADE" });
TenantVehicle.belongsTo(Tenant, { foreignKey: "tenantId" });

// Associations for Notifications (Sender and Receiver)
Notification.belongsTo(User, { as: "sender", foreignKey: "senderId", onDelete: "CASCADE" });
Notification.belongsTo(User, { as: "receiver", foreignKey: "receiverId", onDelete: "CASCADE" });

// Association for Notification and NotificationType (Many-to-One)
Notification.belongsTo(NotificationType, { foreignKey: "typeId", onDelete: "CASCADE" });
NotificationType.hasMany(Notification, { foreignKey: "typeId" });

// Associations for Emails (Sender and Receiver)

// Associations for PaymentRequest and Tenant (Many-to-One)
PaymentRequest.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(PaymentRequest, { foreignKey: "tenantId" });

// Associations for PaymentRequest and PaymentType (Many-to-One)
PaymentRequest.belongsTo(PaymentType, { foreignKey: "paymentTypeId", onDelete: "SET NULL" });
PaymentType.hasMany(PaymentRequest, { foreignKey: "paymentTypeId" });


// Associations for WithdrawalRequest (Tenant and Assigned Employee)
WithdrawalRequest.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(WithdrawalRequest, { foreignKey: "tenantId" });

WithdrawalRequest.belongsTo(User, { as: "assignedEmployee", foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });
User.hasMany(WithdrawalRequest, { foreignKey: "assignedEmployeeId" });
}

module.exports = defineAssociations;
//defineAssociations();