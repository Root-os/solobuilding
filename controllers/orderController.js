const Order = require('../models/order');
const OrderType = require('../models/orderType');
const Tenant = require('../models/tenant');
const { orderValidationSchema, paramsSchema } = require('../helpers/schema');
const { BASE_URL } = require('../config/config');
const sendNotificationHelper= require('../helpers/sendAlert');
const Role = require('../models/role');
const User = require('../models/user');
const sendEmailMessage = require('../services/sendEmailMessage');

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { error, value } = orderValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Handle file upload (receiptImage)
    let receiptImagePath = null;
    if (req.file) {
      receiptImagePath = req.file.path;
    }

    // Get order type to calculate total price
    const orderType = await OrderType.findByPk(value.orderTypeId);
    if (!orderType) {
      return res.status(404).json({ error: 'Order type not found' });
    }

    const totalprice = value.amount * orderType.price;

    const { orderDate, amount, status, notes, orderTypeId } = value;

    const newOrder = await Order.create({
      orderDate,
      amount,
      status,
      notes,
      receiptImage: receiptImagePath,
      tenantId,
      orderTypeId,
      totalprice,
    });

    // Find all admin users
    const admins = await User.findAll({
      include: [{
        model: Role,
        where: { name: 'admin' },
      }],
    });

    // Send notification to all admins
    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: 'New Order Submitted',
            body: `A new order has been placed by tenant ${req.user.fullName ?? ''}. Please review it.`,
            type: 'New Order',
            receiver_type: 'admin',
          })
        )
      );
    }

    res.status(201).json(newOrder);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get All Orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Tenant }, // Include tenant details
        { model: OrderType }, // Include order type details
      ],
    });

    // Add full URL for receiptImage
    const ordersWithFullUrl = orders.map(order => ({
      ...order.toJSON(),
      receiptImage: order.receiptImage ? `${BASE_URL}/${order.receiptImage}` : null,
    }));

    res.status(200).json(ordersWithFullUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Order by ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  const { error } = paramsSchema.validate({ id });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const order = await Order.findByPk(id, {
      include: [
        { model: OrderType },
        { model: Tenant },

      ],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Tenant ID
exports.getOrdersByTenantId = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const orders = await Order.findAll({
      where: { tenantId },
      include: [
        { model: OrderType },
      ],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this tenant' });
    }

    // Add full URL for receiptImage
    const ordersWithFullUrl = orders.map(order => ({
      ...order.toJSON(),
      receiptImage: order.receiptImage ? `${BASE_URL}/${order.receiptImage}` : null,
    }));

    res.status(200).json(ordersWithFullUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders for Current Tenant
exports.getOrdersForCurrentTenant = async (req, res) => {
  try {
    const tenantId = req.user.id;
    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized: Tenant ID missing" });
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const orders = await Order.findAll({
      where: { tenantId },
      include: [
        { model: OrderType },
      ],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this tenant' });
    }

    // Add full URL for receiptImage
    const ordersWithFullUrl = orders.map(order => ({
      ...order.toJSON(),
      receiptImage: order.receiptImage ? `${BASE_URL}/${order.receiptImage}` : null,
    }));

    res.status(200).json(ordersWithFullUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order
exports.updateOrder = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { id } = req.params;
    console.log(JSON.stringify(req.body))
    const { error, value } = orderValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let receiptImagePath = null;
    if (req.file) {
      receiptImagePath = req.file.path; 
    }

    const order = await Order.findByPk(id);

    if (!order || order.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Order not found or unauthorized access' });
    }

    // Update the order
    const { orderDate, amount, status, notes, orderTypeId } = value;

    order.orderDate = orderDate || order.orderDate;
    order.amount = amount || order.amount;
    order.status = status || order.status;
    order.notes = notes || order.notes;
    order.orderTypeId = orderTypeId || order.orderTypeId;
    if (receiptImagePath) {
      order.receiptImage = receiptImagePath; // Update receipt image if a new one is uploaded
    }

    // Recalculate totalPrice if amount or orderTypeId is updated
    if (amount || orderTypeId) {
      const orderType = await OrderType.findByPk(order.orderTypeId);
      order.totalPrice = order.amount * orderType.price;
    }

    await order.save(); // Save updated order

    // Include tenant and order type in the response
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Tenant },
        { model: OrderType },
      ],
    });

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve Order
exports.approveOrder = async (req, res) => {
  try {
    // Ensure the user is an admin (or adjust based on your logic)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admins can approve orders' });
    }

    // Extract order ID from URL params and status from the request body
    const { id } = req.params;
    const { status } = req.body;

    // Validate the incoming status to ensure it's one of the allowed values
    if (!status || !['pending', 'completed', 'canceled','ready','approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Allowed values are "pending", "completed", "canceled".' });
    }

    // Find the order by ID
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order's status
    order.status = status;

    // Recalculate totalPrice if necessary (based on your logic)
    if (order.amount || order.orderTypeId) {
      const orderType = await OrderType.findByPk(order.orderTypeId);
      if (orderType) {
        order.totalprice = order.amount * orderType.price;
      }
    }

    // Save the updated order
    await order.save();

    // Notify the tenant about the order approval
    const tenant = await Tenant.findByPk(order.tenantId);
    console.log('Tenant:', tenant.id);
    if (tenant) {
  const orderType = await OrderType.findByPk(order.orderTypeId);
  const orderTypeName = orderType ? orderType.name : 'your service';

  await sendNotificationHelper({
    adminId: tenant.id, // Using adminId field based on helper signature
    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    body: `Your order (ID: ${order.id}) for ${order.amount} has been marked as ${status}.`,
    type: 'Order Status Update',
    receiver_type: 'tenant',
  });
}





    // Include tenant and order type in the response
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Tenant },
        { model: OrderType },
      ],
    });

    res.status(200).json(updatedOrder);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const { error } = paramsSchema.validate({ id });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.destroy();
    res.status(200).json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Own Order (Tenant can delete only their own order)
exports.deleteOwnOrder = async (req, res) => {
  try {
    const tenantId = req.user.id; // Get tenant ID from the token
    const { id } = req.params; // Order ID from URL params

    // Validate order ID
    const { error } = paramsSchema.validate({ id });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find the order by ID
    const order = await Order.findByPk(id);

    // Check if the order exists and belongs to the current tenant
    if (!order || order.tenantId !== tenantId) {
      return res.status(404).json({ message: "Order not found or unauthorized access" });
    }

    // Delete the order
    await order.destroy();
    res.status(200).json({ message: "Your order has been deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
