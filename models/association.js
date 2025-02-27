const {
    BillPayment, 
    BillType,
    ElectricCarCharging, 
    Complaint, 
    Email, 
    Expense, 
    ExpenseType, 
    Floor, 
    ItemType, 
    Item, 
    NotificationType, 
    Notification, 
    Parking, 
    PaymentType, 
    PaymentRequest, 
    Tenant,
    TenantPayment, 
    TenantRentCollection, 
    TenantVehicle, 
    Unit, 
    User, 
    WithdrawalRequest,
} = require('./index');

const defineAssociations = () => {
    // Define Relationships
    BillPayment.belongsTo(BillType, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
    BillType.hasMany(BillPayment, { foreignKey: "billTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });

    ElectricCarCharging.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(ElectricCarCharging, { foreignKey: "tenantId", onDelete: "CASCADE" });
    
    Complaint.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(Complaint, { foreignKey: "tenantId", onDelete: "CASCADE" });

    Complaint.belongsTo(User, { as: "assignedEmployee", foreignKey: "assignedEmployeeId", onDelete: "SET NULL" });
    User.hasMany(Complaint, { foreignKey: "assignedEmployeeId" });

    Email.belongsTo(User, { as: "sender", foreignKey: "senderId", onDelete: "CASCADE" });
    Email.belongsTo(User, { as: "receiver", foreignKey: "receiverId", onDelete: "CASCADE" });

    Expense.belongsTo(ExpenseType, { foreignKey: "expenseTypeId", as: "expenseType", onDelete: "CASCADE" });
    ExpenseType.hasMany(Expense, { foreignKey: "expenseTypeId", as: "expenses", onDelete: "CASCADE" });

    Floor.hasMany(Tenant, { foreignKey: 'floorId', onDelete: "CASCADE" });
    Tenant.belongsTo(Floor, { foreignKey: 'floorId', onDelete: "CASCADE" });

    Floor.hasMany(Unit, { foreignKey: 'floorId', onDelete: 'CASCADE' });
    Unit.belongsTo(Floor, { foreignKey: 'floorId', onDelete: 'CASCADE' });

    Item.belongsTo(ItemType, { foreignKey: "itemTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });
    ItemType.hasMany(Item, { foreignKey: "itemTypeId", onDelete: "CASCADE", onUpdate: "CASCADE" });

    Notification.belongsTo(NotificationType, { foreignKey: "type_id", as: "type", onDelete: "CASCADE" });
    NotificationType.hasMany(Notification, { foreignKey: "type_id", as: "notifications", onDelete: "CASCADE" });
    // Notification.belongsTo(User, { as: "sender", foreignKey: "senderId", onDelete: "CASCADE" });
    Notification.belongsTo(User, {
        as: "receiverStaff",
        foreignKey: "receiver_id",
        onDelete: "CASCADE",
        scope: { receiver_type: "staff" },
      });
      
      Notification.belongsTo(Tenant, {
        as: "receiverTenant",
        foreignKey: "receiver_id",
        onDelete: "CASCADE",
        scope: { receiver_type: "tenant" },
      });
      
    
    Parking.belongsTo(Tenant, { foreignKey: "tenantId", onDelete: "CASCADE" });
    Tenant.hasMany(Parking, { foreignKey: "tenantId", onDelete: "CASCADE" });

    PaymentRequest.belongsTo(Tenant, { foreignKey: 'tenantId', onDelete: "CASCADE" });
    PaymentRequest.belongsTo(PaymentType, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });

    PaymentType.hasMany(TenantPayment, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });
    TenantPayment.belongsTo(PaymentType, { foreignKey: 'paymentTypeId', onDelete: "CASCADE" });

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
};

module.exports = defineAssociations;
