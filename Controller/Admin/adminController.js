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

// admin loginpage
const loadAdminLogin = (req, res) => {
  const message = req.query.message;
  res.render("admin/login", { msg: message });
};

// admin login page authentication
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminSchema.findOne({ email });

    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Password incorrect" });
    }

    req.session.admin = true;
    return res.status(200).json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Sorry, something went wrong" });
  }
};

//admin dashboard
const adminDashBoard = (req, res) => {
  res.render("admin/dashboard");
};

const logoutAdmin = (req, res) => {
  req.session.admin = false;
  res.redirect("/admin/login");
};

//-------------------------------------------------------------Admin user-------------------------------------------------------------------

//admin user
const adminUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await userSchema.countDocuments();

    const users = await userSchema.find().skip(skip).limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/user", { users, currentPage: page, totalPages });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

//user blocking
const isBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBlocked } = req.body;
    const User = await userSchema.findById(userId);
    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "The user is not exists" });
    }
    User.isBlocked = isBlocked;

    // if(isBlocked){
    //   req.session.user=null
    // }
    await User.save();
    res.status(200).json({
      success: true,
      message: `The user status is changed`,
      isBlocked: User.isBlocked,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

module.exports = {
  loadAdminLogin,
  adminLogin,
  adminDashBoard,
  adminUser,
  isBlock,
  logoutAdmin,
};
