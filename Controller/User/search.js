const mongoose = require("mongoose");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const CartSchema = require("../../model/cartModel");

const search = async (req, res) => {
  const query = req.query.query;

  try {
    const results = await ProductsSchema.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  search,
};
