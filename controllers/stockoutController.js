const Stockout=require('../models/stockout');
const Item=require('../models/item');
const {stockOutSchema,paramsSchema} = require('../helpers/schema');


exports.createStockoutRequest = async (req, res) => {
    try {
        const { error } = stockOutSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const requestedBy = req.user.id;
        const { itemId, reason, requestedQuantity, } = req.body;
        // Fetch item to ensure enough stock
        const item = await Item.findByPk(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (requestedQuantity > item.itemAmount) {
            return res.status(400).json({ message: "Not enough stock available" });
        }
        // Create stockout request
        const stockout = await Stockout.create({
            itemId,  reason, requestedQuantity, requestedBy, status: 'pending'
        });

        return res.status(201).json(stockout);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.approveStockout = async (req, res) => {
    try {
const { error } = paramsSchema.validate(req.params);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { stockoutId } = req.params;
        const approvedBy = req.user.id;
        const {  approvedQuantity } = req.body;
if (!approvedQuantity||approvedQuantity<=0) {
    return res.status(400).json({ message: "Approved quantity is required and must be greater than zero" });
}
        // Fetch stockout request
        const stockout = await Stockout.findByPk(stockoutId);
        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        if (stockout.status !== 'pending') {
            return res.status(400).json({ message: "Stockout request has already been processed" });
        }

        // Fetch item
        const item = await Item.findByPk(stockout.itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (approvedQuantity > item.itemAmount) {
            return res.status(400).json({ message: "Insufficient stock for approval" });
        }

        // Deduct stock
        item.itemAmount -= approvedQuantity;
        let isStockLow = false;
        let itemLeft;
        if(item.itemAmount<item.min_amount){
            isStockLow = true;
            itemLeft = item.itemAmount
        }
        await item.save();

        // Update stockout record
        stockout.approvedQuantity = approvedQuantity;
        stockout.approvedBy = approvedBy;
        stockout.approvedAt = new Date();
        stockout.status = 'approved';
        await stockout.save();

        return res.status(200).json({ message: "Stockout approved successfully", stockout });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
