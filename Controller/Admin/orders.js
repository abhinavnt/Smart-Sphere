const adminSchema = require("../../model/adminModel");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProductsSchema = require("../../model/productModel");
const { log } = require("debug/src/node");
const orderSchema=require("../../model/orderModel")
const { logout } = require("../User/userController");



// to render order management
const order = async (req, res,next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10; 

    try {
        const totalOrders = await orderSchema.countDocuments();
        const orders = await orderSchema.find()
            .populate('userID').sort({ _id: -1 }) 
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        const currentPageStock = parseInt(req.query.pageStock) || 1;
        const totalStockItems = await ProductsSchema.countDocuments();
        const products = await ProductsSchema.find()
            .skip((currentPageStock - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPagesStock = Math.ceil(totalStockItems / itemsPerPage);

        res.render('admin/orders', {
            orders,
            products,
            currentPage,
            totalPages,
            currentPageStock,
            totalPagesStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
        // next()
    }
}



// to change order status
const changeStatus = (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    console.log(status);
    
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).send({ message: 'Invalid status' });
    }

    orderSchema.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true })
        .then(updatedOrder => res.send(updatedOrder))
        .catch(err => res.status(500).send({ message: 'Failed to update order status', error: err }));
}


// to approve cancel request
const approveCancellation = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findOneAndUpdate(
            { _id: orderId },
            { 
                orderStatus: 'Cancelled',
                cancellationRequested: false 
            },
            { new: true } // This option returns the updated document
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order cancelled successfully.' });
    } catch (error) {
        console.error('Error approving cancellation:', error);
        res.status(500).json({ message: 'An error occurred while cancelling the order.' });
}
};


//order details
const orderDetails=async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findById(orderId).populate('items.productID'); 

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            orderedDate: order.createdAt, 
            orderStatus: order.orderStatus,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'An error occurred while fetching the order details' });
}
}


module.exports={
    order,
    changeStatus,
    approveCancellation,
    orderDetails
}