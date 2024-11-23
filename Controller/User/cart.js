const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const nodemailer = require("nodemailer");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const CartSchema = require("../../model/cartModel");
const saltRound = 10;
require("dotenv").config();

// to rener cart page
const cart = async (req, res) => {
  const user = req.session.user._id;

  const pages = 5;
  const page = parseInt(req.query.page) || 1;

  if (!mongoose.Types.ObjectId.isValid(user)) {
    return res.status(400).send("Invalid user ID");
  }

  const cartItems = await CartSchema.find({ userId: user })
    .skip((page - 1) * pages)
    .limit(pages)
    .lean();

  let cartTotal = 0;
  let filteredCartItems = [];

  for (const cartItem of cartItems) {
    let validItems = [];

    for (const item of cartItem.items) {
      const product = await ProductsSchema.findOne({
        _id: item.productId,
      }).lean();

      if (product) {
        validItems.push(item);
        cartTotal += item.quantity * item.price;
      }
    }

    if (validItems.length > 0) {
      cartItem.items = validItems;
      filteredCartItems.push(cartItem);
    }
  }

  const totalItems = await CartSchema.countDocuments({ userId: user });
  const totalPages = Math.ceil(totalItems / pages);

  const cart = await CartSchema.findOneAndUpdate(
    { userId: user },
    { totalPrice: cartTotal },
    { new: true }
  );

  res.render("user/shopingCart", {
    user: req.session.user || null,
    cartItems: filteredCartItems,
    cartTotal,
    currentPage: page,
    totalPages: totalPages,
  });
};

//add to cart
const addCart = async (req, res) => {
  const { productId, name, price, quantity, imageUrl } = req.body;
  const user = req.session.user ? req.session.user._id : null;

  try {
    const product = await ProductsSchema.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await CartSchema.findOne({ userId: user });

    if (!cart) {
      cart = new CartSchema({
        userId: user,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    let currentCartQuantity = 0;

    if (existingItemIndex > -1) {
      currentCartQuantity = cart.items[existingItemIndex].quantity;
    }

    const totalRequestedQuantity = currentCartQuantity + quantity;

    if (totalRequestedQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} units are available in stock. You currently have ${currentCartQuantity} in your cart.`,
      });
    }

    if (totalRequestedQuantity > 5) {
      return res.status(400).json({
        message: `You can only add up to 5 units of this product. You currently have ${totalRequestedQuantity} in your cart.`,
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = totalRequestedQuantity;
    } else {
      cart.items.push({
        productId,
        productName: name,
        price,
        quantity,
        imageUrl,
      });
    }

    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//check stock
const check_stock = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const userId = req.session.user._id;

    const product = await ProductsSchema.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await CartSchema.findOne({ userId });
    let userQuantity = 0;

    if (cart) {
      const item = cart.items.find(
        (item) => item.productId.toString() === productId
      );
      if (item) {
        userQuantity = item.quantity;
      }
    }

    if (product.stock <= 0) {
      return res.status(200).json({
        inStock: false,
        userQuantity,
        availableStock: 0,
      });
    } else {
      return res.status(200).json({
        inStock: true,
        userQuantity,
        availableStock: product.stock,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// remove from cart
const removeCart = async (req, res) => {
  const user = req.params.id;
  const itemId = req.body.itemId;

  if (
    !mongoose.Types.ObjectId.isValid(user) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).send("Invalid user or item ID");
  }

  try {
    const cart = await CartSchema.findOne({ userId: user });

    if (cart) {
      cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

      await cart.save();

      res
        .status(200)
        .json({ success: true, message: "Item removed from cart" });
    } else {
      res.status(404).send("Cart not found");
    }
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).send("Internal Server Error");
  }
};

// increse and decrease cart items
const updateCart = async (req, res) => {
  const userId = req.params.userId;
  const { itemId, quantity } = req.body;

  try {
    const cart = await CartSchema.findOne({ userId: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    let itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex !== -1) {
      cart.items[itemIndex].quantity = quantity;

      cart.totalPrice = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

      await cart.save();

      return res.json({ success: true, message: "Item quantity updated" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const cartCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await CartSchema.findOne({ userId });

    const itemCount = cart ? cart.items.length : 0;

    res.status(200).json({ itemCount });
  } catch (error) {
    console.error("Error fetching cart item count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  cart,
  updateCart,
  removeCart,
  check_stock,
  addCart,

  cartCount,
};
