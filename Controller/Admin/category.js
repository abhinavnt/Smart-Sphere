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
    const page = parseInt(req.query.page, 10) || 1; // Ensure page is an integer
  
    try {
      const categories = await categorySchema
        .find().sort({ _id: -1 })
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
      console.error(err);
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
      console.error(err);
      res.status(500).send("Server Error");
    }
  };
  
  
  
  
  //admin category listing  error here
  const isCategorylist = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { isListed } = req.body; // Grab isListed from the body
  
      const category = await categorySchema.findById(categoryId);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category does not exist" });
      }
  
      // Toggle the category's isListed status
      category.isListed = isListed; // Set it based on the request body
      await category.save();
  
      res.status(200).json({
        success: true,
        message: `Category status changed`,
        isListed: category.isListed,
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  
  
  
  
  //admin category editing
  const adminCategoryEdit = async (req, res) => {
    const { id } = req.params; // Get category ID from route parameters
    const { categoryName } = req.body; // Get the new category name from the form submission
  
    try {
      // Find the category by ID
      const category = await categorySchema.findById(id);
      if (!category) {
        return res
          .status(200)
          .json({ success: true, message: "Category not found" });
      }
  
      // Check if the new category name already exists in the database
      const existingCategory = await categorySchema.findOne({ categoryName });
      if (existingCategory) {
        return res
          .status(200)
          .json({ success: true, message: "Category name already exists" });
      }
  
      // Update the category name
      category.categoryName = categoryName;
      await category.save();
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).send("Internal Server Error");
    }
  };

  
  module.exports={
    adminCategory,
    adminCategoryEdit,
    adminCategoryadd,
    isCategorylist
  }