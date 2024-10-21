const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const nodemailer = require("nodemailer");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const CartSchema=require("../../model/cartModel")
const Razorpay = require('razorpay');
const saltRound = 10;
require("dotenv").config();


const razorpay = new Razorpay({
    key_id: 'rzp_test_dC0qiQ7NV9kpms',
    key_secret: 'lNbFwodNBJLZyZe6rXMinYJr'
});




// checkout page rander
const checkout = async (req, res) => {

    const userId = req.params.id;

    const addresses = await addressSchema.find({ user: userId });

    const cartItems = await CartSchema.find({ userId }).populate('items.productId');
    
    if (!cartItems || cartItems.length === 0) {
        return res.render('user/checkout', {
            user: req.session.user,
            addresses,
            cartItems: [], 
            cartSubtotal: 0,
            discount: 0,
            deliveryFee: 50, 
            total: 0
        });
    }

    let cartSubtotal = 0;
    let discount = 0.5; 
    let deliveryFee = 50; 



    const populatedCartItems = cartItems.flatMap(cart => {
        return cart.items.map(item => {
            const product = item.productId; 

            const totalPriceForItem = item.quantity * product.price;
            cartSubtotal += totalPriceForItem; 

            return {
                productName: product.name, 
                price: product.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl, 
                totalPrice: totalPriceForItem
            };
        });
    });

   
    let total = cartSubtotal - discount + deliveryFee;

    console.log(populatedCartItems);


    res.render('user/checkout', {
        user: req.session.user,
        addresses, 
        cartItems: populatedCartItems,
        cartSubtotal, 
        discount, 
        deliveryFee, 
        total
});

}



// to place the order
const placeOrder =  async (req, res) => {
    try {
        const userId = req.params.id;
        const { selectedAddress, fullName, address, pincode, phone, paymentMethod } = req.body;

        const cart = await CartSchema.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).send('Your cart is empty');
        }

        const outOfStockProducts = [];
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.productId;

            if (product.stock < item.quantity) {
                outOfStockProducts.push(product.name);
            } else {
                product.stock -= item.quantity;
                await product.save();

                
                orderItems.push({
                    productID: product._id,
                    quantity: item.quantity,
                    price: item.price,
                    cancelled: false, 
                });
            }
        }

        if (outOfStockProducts.length > 0) {
            return res.status(400).json({
                message: `The following products are out of stock: ${outOfStockProducts.join(', ')}`,
            });
        }

        const totalAmount = orderItems.reduce((total, item) => {
            return total + item.quantity * item.price;
        }, 0);

        const newOrder = new orderSchema({
            userID: userId,
            items: orderItems,
            totalAmount: totalAmount,
            shippingAddress: {
                fullname: selectedAddress ? fullName : req.body.fullName,
                address: selectedAddress ? address : req.body.address,
                pincode: selectedAddress ? pincode : req.body.pincode,
                phone: selectedAddress ? phone : req.body.phone,
            },
            paymentMethod: paymentMethod === 'bankTransfer' ? 'UPI' : 'COD',
            orderStatus: 'Pending',
            paymentStatus: paymentMethod === 'bankTransfer' ? 'Failed' : 'Pending'
        });

        if (paymentMethod === 'bankTransfer') {
            // Handle UPI (bankTransfer) payment method
            try {
                const razorpayOrder = await razorpay.orders.create({
                    amount: totalAmount * 100, // Convert to paise
                    currency: 'INR',
                    receipt: `receipt_${newOrder._id}`
                });

                newOrder.razorpayOrderId = razorpayOrder.id; 
                await newOrder.save();
                await CartSchema.findOneAndDelete({ userId: userId });

                
                res.json({ orderId: newOrder._id, razorpayOrderId: razorpayOrder.id, totalAmount });

            } catch (error) {
                newOrder.paymentStatus = 'Failed'; 
                await newOrder.save();
                await CartSchema.findOneAndDelete({ userId: userId });
                res.status(500).json({ message: 'Payment failed. Please try again.', orderId: newOrder._id });
            }
        } else {
            // Handle COD orders
            await newOrder.save();
            await CartSchema.findOneAndDelete({ userId: userId }); 
            res.json({ orderId: newOrder._id });
        }

    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).send('An error occurred while processing your order');
    }
};



// order conformation
const conformationOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await orderSchema.findById(orderId).populate('items.productID'); 
    
        if (!order) {
            return res.status(404).send('Order not found');
        }
    
        const fullAddress = order.shippingAddress.address;
        const [location, city, state] = fullAddress.split(',').map(part => part.trim());
    
        const orderDetails = {
            orderId: order._id,
            status: order.orderStatus,
            product: order.items.map(item => item.productID.name).join(', '),
            quantity: order.items.map(item => item.quantity).join(', '),
            totalPrice: order.totalAmount,
            userId: {
                name: req.session.user.username,
                email: req.session.user.email,
            },
            shippingAddress: {
                location,  
                city,      
                state,     
                pincode: order.shippingAddress.pincode, 
                phone: order.shippingAddress.phone      
            },
            paymentMethod: order.paymentMethod,
            estimatedDelivery: '3-5 business days', 
        };
    
        console.log(orderDetails);
    
        
        res.render('user/orderConfirmation', {
            user: req.session.user,
            order: orderDetails,
        });
    
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('An error occurred while fetching the order');
 }

}


// Function to handle Razorpay payment
const handleRazorpayPayment = async (req, res) => {
    try {
        console.log("hai njan ivide ethiii ");
        
        const { id } = req.params;
        const {orderId}=req.body
        console.log("gaihouijejwhs",id);
        
        const order = await orderSchema.findOne({ razorpayOrderId: orderId });
        console.log("hai",order)
        
        if (order) {
            order.paymentStatus = 'Failed';
            console.log( order.paymentStatus);
            
            order.razorpayPaymentId = req.body.paymentId; // Handle the failure payload

            await order.save();
            return res.status(200).json({ message: 'Payment failure handled successfully.' });
        }

        
    } catch (error) {
        console.error('Error handling Razorpay payment failure:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}


const paymentSucess =async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentId } = req.body;

        // Find the order and update the payment status to 'Success'
        await orderSchema.findByIdAndUpdate(orderId, { paymentStatus: 'Success' });

        res.status(200).json({ message: 'Payment successful', paymentId });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).send('Error updating payment status');
    }
}


const retryPayment=async (req, res) => {
    console.log("endhlla viswshem");
    try {
        const { orderId } = req.params;
        console.log(orderId);
        
        
        // Find the order by orderId
        const order = await orderSchema.findById(orderId);
        console.log(order);
        console.log(order.paymentStatus);
        

        if ( order.paymentStatus === 'Success') {
            return res.status(400).json({ message: 'Cannot retry payment for this order.' });
        }

        // Send the razorpayOrderId to the frontend for retry
        res.json({
            razorpayOrderId: order.razorpayOrderId,
            totalAmount: order.totalAmount,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error processing retry payment:', error);
        res.status(500).json({ message: 'Server error while retrying payment.' });
    }
}





module.exports={
    checkout,
    placeOrder,
    conformationOrder,
    retryPayment,
    paymentSucess,
    handleRazorpayPayment


}