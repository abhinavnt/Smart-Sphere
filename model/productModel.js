const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    categoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    colors: [String],
    images: [String],
    isListed: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

const ProductsSchema = mongoose.model("Product", productSchema);

module.exports = ProductsSchema;
