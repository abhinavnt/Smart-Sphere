const { models } = require("mongoose");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");










// to render profile
const profile = async (req, res) => {
    console.log("ahi");
  
    try {
      const userId = req.params.id;
  
      const user = await userSchema.findById(userId);
  
      if (!user) {
        return res.redirect("/");
      }
      const addresses = await addressSchema.find({ user: userId });
      const orders = await orderSchema
        .find({ userID: userId })
        .populate("items.productID");
  
      res.status(200).render("user/profile", { user, addresses, orders });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch user details" });
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
    console.log(existingAddress);
  
    if (!existingAddress) {
      return res.status(404).json({ message: "Address not found." });
    }
  
    try {
      // Update address fields
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
      console.error("Error updating address:", error);
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
      console.error("Error deleting address:", error);
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




  module.exports={
    profile,
    addAddress,
    editAddress,
    deleteAddress,
    updateDetails
  }