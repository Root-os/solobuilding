const Order = require('../models/order');
const OrderType = require('../models/orderType');
const Tenant = require('../models/tenant');
const { orderValidationSchema, paramsSchema } = require('../helpers/schema');

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
      receiptImagePath = req.file.path; // Store the uploaded file path in the database
    }

    // Get order type to calculate total price
    const orderType = await OrderType.findByPk(value.orderTypeId);
    if (!orderType) {
      return res.status(404).json({ error: 'Order type not found' });
    }

    const totalprice = value.amount * orderType.price;

    // Create the order, using tenantId from the token (not from the request body)
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
        { model: Tenant },
        { model: OrderType },
      ],
    });
    res.status(200).json(orders);
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

    res.status(200).json(orders);
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

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order
exports.updateOrder = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { id } = req.params;
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

    res.status(200).json(order);
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
