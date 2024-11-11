const adminSchema = require("../../model/adminModel");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProductsSchema = require("../../model/productModel");
const { log } = require("debug/src/node");
const { logout } = require("../User/userController");

// admin products
const adminProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const totalProducts = await ProductsSchema.countDocuments();
    const category = await categorySchema.find();

    const products = await ProductsSchema.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryID");

    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products", {
      products,
      currentPage: page,
      totalPages,
      categories: category,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// admin add product post
const adminAddProduct = async (req, res) => {
  try {
    const { name, categoryID, price, stock, colors, description } = req.body;

    const newProduct = new ProductsSchema({
      name,
      categoryID,
      price,
      stock,
      colors: colors ? colors.split(",") : [],
      description,
      images: req.files.map((file) => file.filename),
    });

    await newProduct.save();

    res.status(201).redirect("/admin/products");
  } catch (error) {
    res.status(500).send("An error occurred while adding the product.");
  }
};

//admin edit modal render
const edit_product = async (req, res) => {
  try {
    const product = await ProductsSchema.findById(req.params.id).populate({
      path: "categoryID",
      select: "name",
    });

    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

// Handle product editing
const editProductModal = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await ProductsSchema.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.categoryID = req.body.categoryID || product.categoryID;
    product.stock = req.body.stock || product.stock;
    product.price = req.body.price || product.price;
    product.colors = JSON.parse(req.body.colors) || product.colors;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        if (i < product.images.length) {
          product.images[i] = req.files[i].filename;
        } else {
          product.images.push(req.files[i].filename);
        }
      }
    }

    await product.save();

    res.status(200).json(product);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// is product listed
const isProductListed = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isListed } = req.body;

    if (typeof isListed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid listing status provided",
      });
    }

    const product = await ProductsSchema.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "The product does not exist" });
    }

    product.isListed = isListed;
    await product.save();

    res.status(200).json({
      success: true,
      message: `The product listing status has been changed`,
      isListed: product.isListed,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

module.exports = {
  adminProducts,
  isProductListed,
  editProductModal,
  edit_product,
  adminAddProduct,
};
