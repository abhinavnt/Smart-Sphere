const mongoose = require("mongoose");

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        cancelled: {
          type: Boolean,
          default: false,
        },
        cancellationRequested: {
          type: Boolean,
          default: false,
        },
        cancellationReason: {
          type: String,
          default: null,
        },
        returnRequested: { type: Boolean, default: false },
        returnReason: String,
        returned: { type: Boolean, default: false },
        Status: {
          type: String,
          enum: [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Refund",
            "Returned",
          ],
          default: "Processing",
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullname: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },

      phone: { type: String, required: true },
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    couponDiscount: { type: Number },
    offerDiscount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    paymentfailcount: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
