const Stockout=require('../models/stockout');
const Item=require('../models/item');
const {stockOutSchema,paramsSchema} = require('../helpers/schema');
const User = require("../models/user");
const { Op, Sequelize } = require("sequelize");
const fs = require("fs");
const { format } = require("fast-csv");
const generatePDF = require("../helpers/createPdf");
const generateExcel = require("../helpers/createExcel");
const sendNotificationHelper= require('../helpers/sendAlert');

exports.createStockoutRequest = async (req, res) => {
    try {
        const { error } = stockOutSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const requestedBy = req.user.id;
        const { itemId,source, reason, requestedQuantity, } = req.body;
        // Fetch item to ensure enough stock
        const item = await Item.findByPk(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (requestedQuantity > item.itemAmount) {
            return res.status(400).json({ message: "Not enough stock available" });
        }
        // Create stockout request
        const stockout = await Stockout.create({
            itemId,  reason,source, requestedQuantity, requestedBy, status: 'pending'
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
        const { id } = req.params;
        const approvedBy = req.user.id;
        const {  status,approvedQuantity,approvalReason } = req.body;
if (!approvedQuantity||approvedQuantity<=0) {
    return res.status(400).json({ message: "Approved quantity is required and must be greater than zero" });
}
        // Fetch stockout request
        const stockout = await Stockout.findByPk(id);
        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        if (stockout.status !== 'pending') {
            return res.status(400).json({ message: "Stockout request has already been processed" });
        }
if(status==='rejected'){
    if (!approvalReason) {
        return res.status(400).json({ message: "Approval reason is required for rejection" });
    }
    stockout.status = 'rejected';
    stockout.approvedBy = approvedBy;
    stockout.approvedAt = new Date();
    stockout.approvedQuantity = 0;
    stockout.approvalReason = approvalReason;
    await stockout.save();
    return res.status(200).json({ message: "Stockout request rejected successfully", stockout });
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
            sendNotificationHelper({
                adminId: req.user.id,
                title: "Low Stock Alert!",
                body: `Stock of ${item.itemName} is running low. Only ${itemLeft} left, consider restocking.`
            });
            
        }
        await item.save();
        // Update stockout record
        stockout.approvedQuantity = approvedQuantity;
        stockout.approvedBy = approvedBy;
        stockout.approvedAt = new Date();
        stockout.status = 'approved';
        stockout.approvalReason = approvalReason;
        await stockout.save();

        return res.status(200).json({ message: "Stockout approved successfully", stockout });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getStockoutRequests = async (req, res) => {
    try {
        const { status } = req.query; // Optional filter by status
        const whereCondition = status ? { status } : {};

        const stockouts = await Stockout.findAll({
            where: whereCondition,
            include: [{ model: Item, attributes: ["itemName"] }, { model: User, attributes: ["fname","lname","email"] }]
        });

        return res.status(200).json(stockouts);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getStockoutRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const stockout = await Stockout.findByPk(id, {
            include: [{ model: Item, attributes: ["itemName"] }, { model: User, attributes: ["fullName"] }]
        });

        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        return res.status(200).json(stockout);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.mySetStockoutRequest = async (req, res) => {
    try {
        const  id  = req.user.id;
        const stockout = await Stockout.findAll({where:{requestedBy:id}, 
            include: [{ model: Item, attributes: ["itemName"] }, { model: User,  attributes: ["fname","lname"] }]
        });

        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        return res.status(200).json(stockout);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.cancelStockoutRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const stockout = await Stockout.findByPk(id);

        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        if (stockout.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be canceled" });
        }

        await stockout.destroy();
        return res.status(200).json({ message: "Stockout request canceled successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.updateStockoutRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemId, source, reason, requestedQuantity } = req.body;

        // Validate request data
        const { error } = stockOutSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Find stockout request
        const stockout = await Stockout.findByPk(id);
        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        if (stockout.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be updated" });
        }

        // Check stock availability
        const item = await Item.findByPk(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (requestedQuantity > item.itemAmount) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        // Update stockout request
        stockout.itemId = itemId;
        stockout.source = source;
        stockout.reason = reason;
        stockout.requestedQuantity = requestedQuantity;
        await stockout.save();

        return res.status(200).json({ message: "Stockout request updated successfully", stockout });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteStockoutRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const stockout = await Stockout.findByPk(id);

        if (!stockout) return res.status(404).json({ message: "Stockout request not found" });

        if (stockout.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be deleted" });
        }

        await stockout.destroy();
        return res.status(200).json({ message: "Stockout request deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.checkLowStock = async (req, res) => {
    try {
        const lowStockItems = await Item.findAll({ where: { itemAmount: { [Op.lte]: Sequelize.col("min_amount") } } });

        if (lowStockItems.length === 0) {
            return res.status(200).json({ message: "All stock levels are sufficient" });
        }

        // Send notifications for low stock items
        lowStockItems.forEach((item) => {
            sendNotificationHelper(req.user.id, "Low Stock Alert!", `Stock of ${item.itemName} is running low.`);
        });

        return res.status(200).json({ message: "Low stock alerts sent successfully", items: lowStockItems });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


exports.exportStockoutReport = async (req, res) => {
    try {
        const { period, formatType } = req.query; 
        let startDate, endDate;

        if (period === "daily") {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (period === "monthly") {
            startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        } else {
            return res.status(400).json({ message: "Invalid period. Use 'daily' or 'monthly'" });
        }

        // Fetch stockout data
        const stockoutData = await Stockout.findAll({
            where: { createdAt: { [Op.between]: [startDate, endDate] } },
            include: [
                { model: Item, attributes: ["itemName"] },
                { model: User, as: "requester", attributes: ["fullName"] }
            ]
        });

        // Transform data for export
        const reportData = stockoutData.map(data => ([
            data.id.toString(),
            data.Item.itemName,
            data.requestedQuantity.toString(),
            data.source,
            data.reason,
            data.status,
            data.requester.fullName,
            data.createdAt.toISOString()
        ]));

        const headers = ["ID", "Item", "Quantity", "Source", "Reason", "Status", "Requested By", "Created At"];

        if (formatType === "pdf") {
            const pdfDoc = generatePDF(headers, reportData, `Stockout ${period} Report`);
            res.setHeader("Content-Disposition", `attachment; filename=stockout-${period}-report.pdf`);
            res.setHeader("Content-Type", "application/pdf");
            pdfDoc.pipe(res);
        } else if (formatType === "excel") {
            const excelStream = generateExcel(headers, reportData, `Stockout ${period} Report`);
            res.setHeader("Content-Disposition", `attachment; filename=stockout-${period}-report.xlsx`);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            excelStream.pipe(res);
        } else {
            // Default to CSV using fast-csv
            res.setHeader("Content-Disposition", `attachment; filename=stockout-${period}-report.csv`);
            res.setHeader("Content-Type", "text/csv");

            const csvStream = format({ headers: true });
            csvStream.pipe(res);

            stockoutData.forEach(data => {
                csvStream.write({
                    ID: data.id,
                    Item: data.Item.itemName,
                    Quantity: data.requestedQuantity,
                    Source: data.source,
                    Reason: data.reason,
                    Status: data.status,
                    RequestedBy: data.requester.fullName,
                    CreatedAt: data.createdAt.toISOString()
                });
            });

            csvStream.end();
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getStockMovementOverview = async (req, res) => {
    try {
        const movements = await Stockout.findAll({
            attributes: [
                "source",
                [Sequelize.fn("SUM", Sequelize.col("requestedQuantity")), "totalStockout"]
            ],
            group: ["source"],
            order: [[Sequelize.col("totalStockout"), "DESC"]]
        });

        return res.status(200).json(movements);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getStockoutLogs = async (req, res) => {
    try {
        const { startDate, endDate, status, source } = req.query;
        const whereCondition = {};

        if (startDate && endDate) {
            whereCondition.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        } else if (startDate) {
            whereCondition.createdAt = { [Op.gte]: new Date(startDate) }; // Get logs from startDate onward
        } else if (endDate) {
            whereCondition.createdAt = { [Op.lte]: new Date(endDate) }; // Get logs up to endDate
        }

        if (status) whereCondition.status = status;
        if (source) whereCondition.source = source;

        const logs = await Stockout.findAll({
            where: whereCondition,
            include: [{ model: Item, attributes: ["itemName"] }, { model: User, as: "requester", attributes: ["fullName"] }],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
