const category = require("../../model/category");
const orderSchema = require("../../model/orderModel");
const ProductsSchema = require("../../model/productModel");
const mongoose = require("mongoose");

const dashboardData = async (req, res) => {
    try {
       
        const period = req.query.period || 'monthly';
        let dateFilter;

       
        const now = new Date();
        switch (period) {
            case 'daily':
                dateFilter = { $gte: new Date(now.setDate(now.getDate() - 1)) };
                break;
            case 'weekly':
                dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
                break;
            case 'monthly':
                dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
                break;
            case 'yearly':
                dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
                break;
            default:
                dateFilter = {};
        }

        // Sales summary with date filter
        const salesSummary = await orderSchema.aggregate([
            { $match: { createdAt: dateFilter } },
            {
                $group: {
                    _id: null,
                    totalSalesCount: { $sum: { $size: "$items" } },
                    totalRevenue: { $sum: "$totalAmount" },
                    totalDiscount: { $sum: "$discountAmount" }
                }
            }
        ]);

        // Best selling products with date filter
        const bestSellingProducts = await orderSchema.aggregate([
            { $match: { createdAt: dateFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productID",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    name: "$productInfo.name"
                }
            }
        ]);

        // Best selling categories with date filter
        const bestSellingCategories = await orderSchema.aggregate([
            { $match: { createdAt: dateFilter } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productID',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup : {
                    from : 'categories' ,
                    localField : 'productInfo.categoryID' ,
                    foreignField : '_id',
                    as :'categoryInfo'
                }
            },

            {
                $group: {
                    _id: {
                        category : '$categoryInfo.categoryName'
                    },
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalSold: 1,
                    name: "$productInfo.name",
                    categoryName : '$_id.category'
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            salesSummary: salesSummary[0] || { totalSalesCount: 0, totalRevenue: 0, totalDiscount: 0 },
            bestSellingProducts,
            bestSellingCategories
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

module.exports = { dashboardData };
