const { models } = require("mongoose");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const offerSchema = require("../../model/offerModel");

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

  //product offers
  const productOffers = await offerSchema
    .find({
      isActive: true,
      targetType: "Product",
      selectedProducts: { $in: products.map((p) => p.id) },
    })
    .populate("selectedProducts");

  const categoryIds = products.map((product) => product.categoryID);
  const categoryOffers = await offerSchema
    .find({
      isActive: true,
      targetType: "Category",
      selectedCategory: { $in: categoryIds },
    })
    .populate("selectedCategory");

  const formattedProducts = products.map((product) => {
    const originalPrice = product.price;

    const productOffer = productOffers.find((offer) =>
      offer.selectedProducts.some((selectedId) =>
        selectedId.equals(product._id)
      )
    );

    //  discounted price
    const productDiscountedPrice = productOffer
      ? Math.round(
          originalPrice - originalPrice * (productOffer.discountAmount / 100)
        )
      : null;

    const categoryOffer = categoryOffers.find((offer) =>
      offer.selectedCategory.some((selectedId) =>
        selectedId.equals(product.categoryID)
      )
    );

    const categoryDiscountedPrice = categoryOffer
      ? Math.round(
          originalPrice - originalPrice * (categoryOffer.discountAmount / 100)
        )
      : null;

    let bestDiscountedPrice = null;
    let hasOffer = false;

    if (productDiscountedPrice && categoryDiscountedPrice) {
      bestDiscountedPrice = Math.min(
        productDiscountedPrice,
        categoryDiscountedPrice
      );
    } else if (productDiscountedPrice) {
      bestDiscountedPrice = productDiscountedPrice;
    } else if (categoryDiscountedPrice) {
      bestDiscountedPrice = categoryDiscountedPrice;
    }

    if (bestDiscountedPrice) {
      hasOffer = true;
    }

    return {
      _id: product._id,
      name: product.name,
      price: originalPrice,
      description: product.description,
      images: product.images,
      stock: product.stock,
      colors: product.colors,
      createdAt: product.createdAt,
      category: product.categoryID ? product.categoryID._id : "Unknown",
      offer: hasOffer
        ? {
            discountedPrice: bestDiscountedPrice,
            hasOffer: true,
          }
        : { hasOffer: false },
    };
  });

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
  try {
    const id = req.params.id;

    const product = await ProductsSchema.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedProducts = await ProductsSchema.find({
      categoryID: product.categoryID,
      _id: { $ne: product._id },
      isListed: true,
    }).limit(8);

    const productOffers = await offerSchema.find({
      isActive: true,
      targetType: "Product",
      selectedProducts: product._id,
    });

    const categoryIDs = [product.categoryID];

    const categoryOffers = await offerSchema
      .find({
        isActive: true,
        targetType: "Category",
        selectedCategory: { $in: categoryIDs },
      })
      .populate("selectedCategory");

    //  product data to include offer information
    const productOffer = productOffers.length > 0 ? productOffers[0] : null;
    const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

    const formattedProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      images: product.images,
      stock: product.stock,
      colors: product.colors,
      createdAt: product.createdAt,
      rating: product.rating,
      isListed: product.isListed,
      category: product.categoryID ? product.categoryID._id : "Unknown",
      offer: productOffer
        ? {
            discountedPrice: Math.round(
              product.price -
                product.price * (productOffer.discountAmount / 100)
            ),
            hasOffer: true,
          }
        : { hasOffer: false },
    };

    //  category offer, calculate the discounted price
    if (categoryOffer) {
      const categoryDiscountedPrice = Math.round(
        product.price - product.price * (categoryOffer.discountAmount / 100)
      );
      formattedProduct.categoryOffer = {
        discountedPrice: categoryDiscountedPrice,
        hasOffer: true,
      };
    }

    res.render("user/product-detail", {
      user: req.session.user ?? false,
      product: formattedProduct,
      relatedProducts,
    });
  } catch (error) {
    res.status(500).render("404");
  }
};

module.exports = {
  shopRender,
  product_detail,
};
