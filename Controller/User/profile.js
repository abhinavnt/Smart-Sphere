const { models } = require("mongoose");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const walletSchema = require("../../model/walletModel");

// to render profile
const profile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await userSchema.findById(userId);

    if (!user) {
      return res.redirect("/");
    }

    const addresses = await addressSchema.find({ user: userId });

    const wallet = (await walletSchema.findOne({ userId })) || {
      balance: 0,
      transactions: [],
    };

    const latestTransactions = wallet.transactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 6);

    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const totalOrders = await orderSchema.countDocuments({ userID: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await orderSchema
      .find({ userID: userId })
      .populate("items.productID")
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 });

    res.status(200).render("user/profile", {
      user,
      addresses,
      orders,
      currentPage: page,
      totalPages,
      wallet: {
        balance: wallet.balance,
        transactions: latestTransactions,
      },
    });
  } catch (err) {
    res.status(500).render("500");
  }
};

// to add new address
const addAddress = async (req, res) => {
  const {
    fullName,
    phone,
    address,
    district,
    city,
    state,
    pincode,
    country,
    type,
  } = req.body;
  const user = req.params.id;

  if (!user) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const newAddress = new addressSchema({
      user,
      fullName,
      phone,
      address,
      district,
      city,
      state,
      pincode,
      country,
      type,
    });

    await newAddress.save();
    res
      .status(200)
      .json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error adding address", error: error.message });
  }
};

// edit address
const editAddress = async (req, res) => {
  const {
    fullName,
    phone,
    address,
    district,
    city,
    state,
    pincode,
    country,
    type,
  } = req.body;
  const addressId = req.params.id;

  const existingAddress = await addressSchema.findById(addressId);

  if (!existingAddress) {
    return res.status(404).json({ message: "Address not found." });
  }

  try {
    existingAddress.fullName = fullName;
    existingAddress.phone = phone;
    existingAddress.address = address;
    existingAddress.district = district;
    existingAddress.city = city;
    existingAddress.state = state;
    existingAddress.pincode = pincode;
    existingAddress.country = country;
    existingAddress.type = type;

    const updatedAddress = await existingAddress.save();

    res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating address", error: error.message });
  }
};

// to delete address
const deleteAddress = async (req, res) => {
  const addressId = req.params.id;

  try {
    const deletedAddress = await addressSchema.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting address", error: error.message });
  }
};

// update user detials
const updateDetails = async (req, res) => {
  const { username, email } = req.body;

  const user = req.params.id;

  await userSchema
    .findByIdAndUpdate(user, { username, email }, { new: true })

    .then((updatedUser) => {
      res
        .status(200)
        .json({ message: "Profile updated successfully", user: updatedUser });
    })

    .catch((error) => {
      res.status(500).json({ error: "Failed to update profile" });
    });
};

module.exports = {
  profile,
  addAddress,
  editAddress,
  deleteAddress,
  updateDetails,
};
