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
  console.log(products);
  
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      images: product.images,
      stock: product.stock,
      colors: product.colors,
      createdAt: product.createdAt,
      category: product.categoryID ? product.categoryID._id : "Unknown",
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

//product detail page
const product_detail = async (req, res) => {
  const id = req.params.id;
  console.log("Checking here");

  // Find the product by ID and populate the category
  const product = await ProductsSchema.findById(id).populate("categoryID");

  // Find related products that are in the same category, but are not the current product and are listed
  const relatedProducts = await ProductsSchema.find({
    categoryID: product.categoryID,
    _id: { $ne: product._id },  // Exclude the current product
    isListed: true,             // Only include products that are listed
  }).limit(4);

  // Render the product detail page based on whether the user is logged in or not
  if (req.session.user) {
    res.render("user/product-detail", {
      user: req.session.user,
      product,
      relatedProducts,
    });
  } else {
    res.render("user/product-detail", {
      user: false,
      product,
      relatedProducts,
    });
  }
};



  
  module.exports={
    shopRender,
    product_detail
  }