const adminSchema = require("../../model/adminModel");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProductsSchema = require("../../model/productModel");
const { log } = require("debug/src/node");
const { logout } = require("../User/userController");

//admin category
const adminCategory = async (req, res) => {
  const message = req.query.message;
  const perPage = 5;
  const page = parseInt(req.query.page, 10) || 1;

  try {
    const categories = await categorySchema
      .find()
      .sort({ _id: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await categorySchema.countDocuments();

    res.render("admin/category", {
      msg: message,
      categories: categories,
      currentPage: page,
      totalPages: Math.ceil(count / perPage),
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

//admin add category
const adminCategoryadd = async (req, res) => {
  const { categoryName } = req.body;

  try {
    const category = await categorySchema.findOne({ categoryName });
    if (category)
      return res.redirect("/admin/category?message=category already exist");
    const newCategory = new categorySchema({ categoryName });
    await newCategory.save();
    res.redirect("/admin/category");
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

//admin category listing  error here
const isCategorylist = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { isListed } = req.body;

    const category = await categorySchema.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category does not exist" });
    }

    category.isListed = isListed;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category status changed`,
      isListed: category.isListed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//admin category editing
const adminCategoryEdit = async (req, res) => {
  const { id } = req.params;
  const { categoryName } = req.body;

  try {
    const category = await categorySchema.findById(id);
    if (!category) {
      return res
        .status(200)
        .json({ success: true, message: "Category not found" });
    }

    const existingCategory = await categorySchema.findOne({ categoryName });
    if (existingCategory) {
      return res
        .status(200)
        .json({ success: true, message: "Category name already exists" });
    }

    category.categoryName = categoryName;
    await category.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  adminCategory,
  adminCategoryEdit,
  adminCategoryadd,
  isCategorylist,
};
