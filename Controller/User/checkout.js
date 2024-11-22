const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const nodemailer = require("nodemailer");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const CartSchema = require("../../model/cartModel");
const Razorpay = require("razorpay");
const offerSchema = require("../../model/offerModel");
const couponSchema = require("../../model/couponModel");
const saltRound = 10;
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: "rzp_test_dC0qiQ7NV9kpms",
  key_secret: process.env.YOUR_RAZORPAY_KEY_SECRET,
});

// checkout page rander
const checkout = async (req, res) => {
  const userId = req.session.user._id;

  const addresses = await addressSchema.find({ user: userId });

  const cartItems = await CartSchema.find({ userId }).populate(
    "items.productId"
  );

  if (!cartItems || cartItems.length === 0) {
    return res.render("user/checkout", {
      user: req.session.user,
      addresses,
      cartItems: [],
      cartSubtotal: 0,
      discount: 0,
      deliveryFee: 50,
      total: 0,
    });
  }

  let cartSubtotal = 0;
  let discount = req.session.couponDiscound ? req.session.couponDiscound : 0;
  let deliveryFee = 50;
  const populatedCartItems = [];

  for (const cart of cartItems) {
    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        continue;
      }

      //  applicable offers
      const productOffers = await offerSchema.find({
        isActive: true,
        targetType: "Product",
        selectedProducts: product._id,
      });

      const categoryOffers = await offerSchema.find({
        isActive: true,
        targetType: "Category",
        selectedCategory: product.categoryID,
      });

      const regularPrice = product.price;
      let bestOfferPrice = regularPrice;

      if (productOffers.length > 0) {
        const productDiscountedPrice = Math.round(
          regularPrice - regularPrice * (productOffers[0].discountAmount / 100)
        );
        bestOfferPrice = Math.min(bestOfferPrice, productDiscountedPrice);
      }

      if (categoryOffers.length > 0) {
        const categoryDiscountedPrice = Math.round(
          regularPrice - regularPrice * (categoryOffers[0].discountAmount / 100)
        );
        bestOfferPrice = Math.min(bestOfferPrice, categoryDiscountedPrice);
      }

      const totalPriceForItem = item.quantity * bestOfferPrice;
      cartSubtotal += totalPriceForItem;

      populatedCartItems.push({
        productName: product.name,
        price: bestOfferPrice,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        totalPrice: totalPriceForItem,
      });
    }
  }

  const cart = await CartSchema.findOne({ userId });
  const totalPrice = cart.totalPrice + deliveryFee;

  let total = cartSubtotal - discount + deliveryFee;

  res.render("user/checkout", {
    user: req.session.user,
    addresses,
    cartItems: populatedCartItems,
    cartSubtotal,
    discount,
    deliveryFee,
    total: totalPrice,
  });
};

// to place the order
const placeOrder = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      selectedAddress,
      fullName,
      address,
      pincode,
      phone,
      paymentMethod,
    } = req.body;

    const cart = await CartSchema.findOne({ userId }).populate(
      "items.productId"
    );
    if (!cart || cart.items.length === 0)
      return res.status(400).send("Your cart is empty");

    const outOfStockProducts = [];
    const orderItems = [];
    const originalPrices = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product.isListed)
        return res
          .status(400)
          .json({ message: `${product.name} is currently unavailble` });
      if (product.stock < item.quantity) {
        outOfStockProducts.push(product.name);
      } else {
        originalPrices.push(product.price * item.quantity);

        product.stock -= item.quantity;
        await product.save();
        orderItems.push({
          productID: product._id,
          quantity: item.quantity,
          price: item.price,
        });
      }
    }
    req.session.couponDiscound = null 

    if (outOfStockProducts.length > 0) {
      return res
        .status(400)
        .json({
          message: `The following products are out of stock: ${outOfStockProducts.join(
            ", "
          )}`,
        });
    }

    const totalAmount = cart.totalPrice + 50;

    let sum = originalPrices.reduce((a, c) => a + c, 0);

    sum -= cart.totalPrice;

    if (paymentMethod == "cashOnDelivery" && totalAmount > 1000)
      return res
        .status(400)
        .json({ message: "Above 1000 can't use cash on delivery" });

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
      paymentMethod: paymentMethod === "bankTransfer" ? "UPI" : "COD",
      orderStatus: "Pending",
      offerDiscount: sum,
      paymentStatus: paymentMethod === "bankTransfer" ? "Failed" : "Pending",
    });

    if (req.session.couponDiscound) {
      newOrder.couponDiscount = req.session.couponDiscound;
    }

    if(req.session.minCartValue){
      newOrder.couponMinLimit=req.session.minCartValue
    }

    if (paymentMethod === "bankTransfer") {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: totalAmount * 100,
          currency: "INR",
          receipt: `receipt_${newOrder._id}`,
        });

        newOrder.razorpayOrderId = razorpayOrder.id;
        await newOrder.save();
        await CartSchema.findOneAndDelete({ userId: userId });

        res.json({
          orderId: newOrder._id,
          razorpayOrderId: razorpayOrder.id,
          totalAmount,
        });
      } catch (error) {
        newOrder.paymentStatus = "Failed";
        await newOrder.save();
        await CartSchema.findOneAndDelete({ userId: userId });
        res
          .status(500)
          .json({
            message: "Payment failed. Please try again.",
            orderId: newOrder._id,
          });
      }
    } else {
      await newOrder.save();
      await CartSchema.findOneAndDelete({ userId: userId });
      res.json({ orderId: newOrder._id });
    }
  } catch (error) {
    res.status(500).send("An error occurred while processing your order");
  }
};

// order conformation
const conformationOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderSchema
      .findById(orderId)
      .populate("items.productID");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const fullAddress = order.shippingAddress.address;
    const [location, city, state] = fullAddress
      .split(",")
      .map((part) => part.trim());

    const orderDetails = {
      orderId: order._id,
      status: order.orderStatus,
      product: order.items.map((item) => item.productID.name).join(", "),
      quantity: order.items.map((item) => item.quantity).join(", "),
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
        phone: order.shippingAddress.phone,
      },
      paymentMethod: order.paymentMethod,
      estimatedDelivery: "3-5 business days",
    };

    res.render("user/orderConfirmation", {
      user: req.session.user,
      order: orderDetails,
    });
  } catch (error) {
    res.status(500).send("An error occurred while fetching the order");
  }
};

// Function to handle Razorpay payment
const handleRazorpayPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    const order = await orderSchema.findOne({ _id: id });

    if (order) {
      order.paymentStatus = "Failed";

      order.razorpayPaymentId = req.body.paymentId;

      if (order.paymentfailcount < 1) {
        for (const item of order.items) {
          const product = await ProductsSchema.findById(item.productID);
          order.paymentfailcount = 1;
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }

      await order.save();
      return res
        .status(200)
        .json({ message: "Payment failure handled successfully." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

//paymentSucess
const paymentSucess = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;

    const order = await orderSchema.findByIdAndUpdate(orderId, {
      paymentStatus: "Success",
    });

    if (order.paymentfailcount >= 1) {
      for (const item of order.items) {
        const product = await ProductsSchema.findById(item.productID);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      }
    }

    res.status(200).json({ message: "Payment successful", paymentId });
  } catch (error) {
    res.status(500).send("Error updating payment status");
  }
};

//retry payment
const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderSchema.findById(orderId);

    if (order.paymentStatus === "Success") {
      return res
        .status(400)
        .json({ message: "Cannot retry payment for this order." });
    }

    // razorpayOrderId to the frontend for retry
    res.json({
      razorpayOrderId: order.razorpayOrderId,
      totalAmount: order.totalAmount,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Error processing retry payment:", error);
    res.status(500).json({ message: "Server error while retrying payment." });
  }
};

//apply coupons
const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.user._id;

  try {
    const coupon = await couponSchema.findOne({ couponCode });

    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    if (new Date(coupon.endDate) < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.usedBy.includes(userId)) {
      return res.status(400).json({ message: "Coupon already used " });
    }

    const cart = await CartSchema.findOne({ userId });

    if (cart.totalPrice < coupon.minAmount) {
      return res
        .status(400)
        .json({
          message: `This coupon is available for purchases more than ${coupon.minAmount}`,
        });
    }

    if (cart.totalPrice > coupon.maxAmount) {
      return res
        .status(400)
        .json({
          message: `This coupon is only applicable for purchases less than ${coupon.maxAmount}`,
        });
    }

    let discount = 0;
    if (coupon.discountType === "Fixed Amount") {
      discount = coupon.discountAmount;
    } else if (coupon.discountType === "Percentage") {
      discount = (cart.totalPrice * coupon.discountAmount) / 100;
    }

    const newTotal = Math.max(cart.totalPrice - discount, 0);

    if (newTotal < 100)
      return res
        .status(400)
        .json({ message: `Cart Minimum Amount is 100 Can't Use This Coupon` });

    await CartSchema.findOneAndUpdate(
      { userId },
      { totalPrice: newTotal },
      { new: true }
    );

    req.session.couponDiscound = discount
    req.session.minCartValue= coupon.minAmount

    coupon.usedBy.push(userId);
    await coupon.save();

    res.status(200).json({ message: "Coupon applied successfully", newTotal });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

module.exports = {
  checkout,
  placeOrder,
  conformationOrder,
  retryPayment,
  paymentSucess,
  handleRazorpayPayment,
  applyCoupon,
};
