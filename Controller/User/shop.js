const { models } = require("mongoose");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");







//---------------------------------------------shoprender-----------------------------------------------------------------------------------------
const shopRender = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 16;
    const skip = (page - 1) * limit;
  
    const excludedCategories = await categorySchema
      .find({ isListed: false })
      .select("_id");
  
    const products = await ProductsSchema.find({
      isListed: true,
      categoryID: { $nin: excludedCategories.map((cat) => cat._id) },
    })
      .skip(skip)
      .sort({ _id: -1 })
      .limit(limit)
      .populate({ path: "categoryID", select: "name" });
  
    const totalProducts = await ProductsSchema.countDocuments({
      isListed: true,
      categoryID: { $nin: excludedCategories.map((cat) => cat._id) },
    });
    const totalPages = Math.ceil(totalProducts / limit);
  
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      images: product.images,
      stock: product.stock,
      colors: product.colors,
      createdAt: product.createdAt,
      category: product.categoryID ? product.categoryID.name : "Unknown",
    }));
  
    const categories = await categorySchema.find({ isListed: true });
  
    if (req.session.user) {
      res.render("user/shop", {
        user: req.session.user,
        categories,
        products: formattedProducts,
        currentPage: page,
        totalPages,
      });
    } else {
      res.render("user/shop", {
        user: false,
        categories,
        products: formattedProducts,
        currentPage: page,
        totalPages,
      });
    }
  };




  
  module.exports={
    shopRender
  }