const adminSchema = require("../../model/adminModel");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProductsSchema = require("../../model/productModel");
const { log } = require("debug/src/node");
const orderSchema = require("../../model/orderModel");
const { logout } = require("../User/userController");
const walletSchema = require("../../model/walletModel");

// to render order management
const order = async (req, res, next) => {
  const currentPage = parseInt(req.query.page) || 1;
  const itemsPerPage = 10;

  try {
    const totalOrders = await orderSchema.countDocuments();
    const orders = await orderSchema
      .find()
      .populate("userID")
      .sort({ _id: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    const currentPageStock = parseInt(req.query.pageStock) || 1;
    const totalStockItems = await ProductsSchema.countDocuments();
    const products = await ProductsSchema.find()
      .skip((currentPageStock - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPagesStock = Math.ceil(totalStockItems / itemsPerPage);

    res.render("admin/orders", {
      orders,
      products,
      currentPage,
      totalPages,
      currentPageStock,
      totalPagesStock,
    });
  } catch (error) {
    res.status(500).send("Server Error");
    // next()
  }
};

//change status
const changeItemStatus = (req, res) => {
  const { orderId, productId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  orderSchema
    .findById(orderId)
    .then((order) => {
      if (!order) {
        return res.status(404).send({ message: "Order not found" });
      }

      // Find the specific item in the order
      const item = order.items.find(
        (i) => i.productID.toString() === productId
      );
      if (!item) {
        return res.status(404).send({ message: "Item not found in the order" });
      }

      // Update the item's status
      item.Status = status; // Change the item status

      // Save the updated order
      return order.save();
    })
    .then((updatedOrder) => res.send(updatedOrder))
    .catch((err) =>
      res
        .status(500)
        .send({ message: "Failed to update item status", error: err })
    );
};

//approve cancelltion
const approveProductCancellation = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find((i) => i.productID.toString() === productId);
    if (!item) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    if (!item.cancellationRequested) {
      return res
        .status(400)
        .json({ message: "No cancellation request for this product" });
    }

    item.cancelled = true;
    item.Status = "Cancelled";
    item.cancellationRequested = false;

    //to find the product fund
    const totalAmount = item.price * item.quantity;
    if (order.paymentMethod === "UPI" && order.paymentStatus === "Success") {
      item.Status = "Refund";
      await refundToWallet(order.userID, totalAmount, orderId, productId);
    }

    await ProductsSchema.findByIdAndUpdate(
      productId,
      { $inc: { stock: item.quantity } },
      { new: true }
    );

    await order.save();

    res
      .status(200)
      .json({ message: "Product cancellation approved successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while approving the cancellation." });
  }
};

// Approve Return Request
const approveProductReturn = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find((i) => i.productID.toString() === productId);
    if (!item) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    if (!item.returnRequested) {
      return res
        .status(400)
        .json({ message: "No return request for this product" });
    }

    item.returned = true;
    item.Status = "Returned";
    item.returnRequested = false;

    const totalAmount = item.price * item.quantity;
    if (order.paymentMethod === "UPI" && order.paymentStatus === "Success") {
      item.Status = "Refund";
      await refundToWallet(order.userID, totalAmount, orderId, productId);
    }

    await ProductsSchema.findByIdAndUpdate(
      productId,
      { $inc: { stock: item.quantity } },
      { new: true }
    );

    await order.save();

    res.status(200).json({ message: "Product return approved successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while approving the return." });
  }
};

//refund to wallet
const refundToWallet = async (userId, amount, orderId, productId) => {
  try {
    const wallet = await walletSchema.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            type: "credit",
            amount: amount,
            description: "Refund for cancelled order",
          },
        },
      },
      { new: true, upsert: true }
    );

    await orderSchema.findOneAndUpdate(
      { _id: orderId, "items.productID": productId }, // Match orderId and specific productID
      { $set: { "items.$.Status": "Refund" } }, // Update the Status of the matched item
      { new: true } // Return the updated document
    );
  } catch (error) {
    throw new Error("Refund to wallet failed");
  }
};

//order details
const orderDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await orderSchema
      .findById(orderId)
      .populate("items.productID");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderid: order._id,
      orderedDate: order.createdAt,
      orderStatus: order.orderStatus,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the order details" });
  }
};

module.exports = {
  order,
  approveProductCancellation,
  changeItemStatus,
  orderDetails,
  approveProductReturn,
};
