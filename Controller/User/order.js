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



const cancelProductInOrder = async (req, res) => { 
    const { orderId, productId } = req.params;
    const { reason } = req.body;
    console.log(reason);
    
    try {
        
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        
        const item = order.items.find(i => i.productID.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }

       
        if (item.cancelled) {
            return res.status(400).json({ message: 'Product has already been cancelled' });
        }
        if (item.cancellationRequested) {
            return res.status(400).json({ message: 'Cancellation already requested for this product.' });
        }

        
        item.cancellationRequested = true;
        item.cancellationReason = reason;

        
        await order.save();

        res.status(200).json({ message: 'Cancellation request for the product submitted successfully. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({ message: 'An error occurred while submitting the cancellation request.' });
    }
};



// Handle Return Product Request
const returnProductInOrder = async (req, res) => {
    const { orderId, productId } = req.params;
    const { reason } = req.body;
    
    try {
        // Find the order
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the specific product in the order
        const item = order.items.find(i => i.productID.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }

        // Check if the product has already been returned or if a return request is pending
        if (item.returned) {
            return res.status(400).json({ message: 'Product has already been returned' });
        }
        if (item.returnRequested) {
            return res.status(400).json({ message: 'Return already requested for this product.' });
        }

        // Set return request details
        item.returnRequested = true;
        item.returnReason = reason;

        // Save changes
        await order.save();

        res.status(200).json({ message: 'Return request for the product submitted successfully. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({ message: 'An error occurred while submitting the return request.' });
    }
};






module.exports={
    
    cancelProductInOrder,
    returnProductInOrder
}