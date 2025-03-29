const OrderType  = require('../models/orderType'); // Adjust path if needed
const Joi = require('joi');
const { orderTypeValidationSchema } = require('../helpers/schema');
const { paramsSchema } = require('../helpers/schema');


exports.createOrderType = async (req, res) => {
   
    const { error } = orderTypeValidationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation Error', details: error.details });
    }

    try {
        const { name, description, price } = req.body;

        // Check if required fields are present (in case Joi schema allows optional fields)
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Check if OrderType with same name already exists (assuming name should be unique)
        const existingOrderType = await OrderType.findOne({ where: { name } });
        if (existingOrderType) {
            return res.status(409).json({ message: 'OrderType with this name already exists' });
        }

        const newOrderType = await OrderType.create({ name, description, price });
        return res.status(201).json(newOrderType);
    } catch (error) {
        console.error('Create OrderType Error:', error.name, error.message, error.stack);
        return res.status(500).json({ 
            message: 'Error creating OrderType', 
            error: { 
                name: error.name, 
                message: error.message 
            } 
        });
    }
};

exports.getAllOrderTypes = async (req, res) => {
    try {
        const orderTypes = await OrderType.findAll();
        return res.status(200).json(orderTypes);
    } catch (error) {
        console.error('Get All OrderTypes Error:', error.name, error.message);
        return res.status(500).json({ 
            message: 'Error fetching OrderTypes', 
            error: { 
                name: error.name, 
                message: error.message 
            } 
        });
    }
};

// Get a single OrderType by ID
exports.getOrderTypeById = async (req, res) => {
    const { id } = req.params;

    const { error } = paramsSchema.validate({ id });
    if (error) {
        return res.status(400).json({ message: 'Invalid ID parameter', details: error.details });
    }

    try {
        const orderType = await OrderType.findByPk(id);
        if (!orderType) {
            return res.status(404).json({ message: 'OrderType not found' });
        }
        return res.status(200).json(orderType);
    } catch (error) {
        console.error('Get OrderType Error:', error.name, error.message);
        return res.status(500).json({ 
            message: 'Error fetching OrderType', 
            error: { 
                name: error.name, 
                message: error.message 
            } 
        });
    }
};


exports.updateOrderType = async (req, res) => {
    const { id } = req.params;

    const { error: paramsError } = paramsSchema.validate({ id });
    if (paramsError) {
        return res.status(400).json({ message: 'Invalid ID parameter', details: paramsError.details });
    }

    const { error } = orderTypeValidationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation Error', details: error.details });
    }

    try {
        const orderType = await OrderType.findByPk(id);
        if (!orderType) {
            return res.status(404).json({ message: 'OrderType not found' });
        }

        const { name, description, price } = req.body;

        // Check for duplicate name if it’s being updated
        if (name && name !== orderType.name) {
            const existingOrderType = await OrderType.findOne({ where: { name } });
            if (existingOrderType) {
                return res.status(409).json({ message: 'OrderType with this name already exists' });
            }
        }

        orderType.name = name || orderType.name;
        orderType.description = description || orderType.description;
        orderType.price = price || orderType.price;

        await orderType.save();

        return res.status(200).json(orderType);
    } catch (error) {
        console.error('Update OrderType Error:', error.name, error.message);
        return res.status(500).json({ 
            message: 'Error updating OrderType', 
            error: { 
                name: error.name, 
                message: error.message 
            } 
        });
    }
};


exports.deleteOrderType = async (req, res) => {
    const { id } = req.params;

    const { error } = paramsSchema.validate({ id });
    if (error) {
        return res.status(400).json({ message: 'Invalid ID parameter', details: error.details });
    }

    try {
        const orderType = await OrderType.findByPk(id);
        if (!orderType) {
            return res.status(404).json({ message: 'OrderType not found' });
        }

        await orderType.destroy();
        return res.status(200).json({ message: 'OrderType deleted successfully' });
    } catch (error) {
        console.error('Delete OrderType Error:', error.name, error.message);
        return res.status(500).json({ 
            message: 'Error deleting OrderType', 
            error: { 
                name: error.name, 
                message: error.message 
            } 
        });
    }
};