const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const nodemailer = require("nodemailer");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const CartSchema=require("../../model/cartModel")
const saltRound = 10;
require("dotenv").config();



// to cancel order
const cancelOrder =  async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.cancellationRequested = true;
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ message: 'Cancellation request submitted successfully. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({ message: 'An error occurred while submitting the cancellation request.' });
    }
};



// order details

const orderDetails = async (req, res) => {
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
    cancelOrder,
    orderDetails
}