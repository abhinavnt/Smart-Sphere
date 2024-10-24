const { models } = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../../model/userModel");
const nodemailer = require("nodemailer");
const categorySchema = require("../../model/category");
const ProductsSchema = require("../../model/productModel");
const addressSchema = require("../../model/adressModel");
const orderSchema = require("../../model/orderModel");
const offerSchema=require("../../model/offerModel")
const saltRound = 10;
require("dotenv").config();

//-----------------------------------------------------------------Authentication---------------------------------------------------------------

//user login page load
const loadUserLogin = (req, res) => {
  const message = req.query.message;
  console.log(message);

  res.render("user/login", { msg: message });
};

//user login verification
const userLoging = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userSchema.findOne({ email });

    if (!user) {
      
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "User is blocked",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password incorrect",
      });
    }

    // If login is successful
    req.session.user = user;
    console.log(req.session.user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      redirectUrl: "/", 
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later",
    });
  }
};

//user Signup page
const loadUserSignup = (req, res) => {
  const message = req.query.message;
  res.render("user/signup", { msg: message });
};

//otp render
const otprender = (req, res) => {
  const message = req.query.message;
  res.render("user/otp", { msg: message });
};

// user signup verification and otp
const userSignupVerify = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    console.log(email);
    // req.flash('signupData', { email, password});

    req.session.signupData = req.body;
    // Check if the email already exists
    const user = await userSchema.findOne({ email });
    if (user) {
      return res.redirect("/signup?message=email already exist");
    }

    // Generate a random 4-digit OTP
    const genotp = Math.floor(1000 + Math.random() * 9000);
    console.log(genotp); // Log the OTP for debugging

    // Configure the email transporter using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASS, // Your email password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP for Signup",
      text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
    };

    // Send the OTP via email
    await transporter.sendMail(mailOptions);

    // Store OTP and expiration time in session
    req.session.otp = genotp;
    req.session.email = req.body;
    req.session.otpExpires = Date.now() + 1 * 60 * 1000; // Set expiration time to 1 minute (60000 ms)

    console.log(req.session.otp); // Log the session OTP for debugging

    // Redirect to the OTP input page
    res.redirect("/otp");
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
};

//resend OTP
const resendOTP = async (req, res) => {
  try {
    const signupData = req.session.signupData;
    const { username, email, password } = req.session.signupData;

    if (!signupData) {
      return res.redirect(
        "/signup?message=Signup data not found. Please try again."
      );
    }

    // Generate a new OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    console.log(`New OTP: ${newOtp}`);

    // Resend OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: signupData.email,
      subject: "Your Resend OTP for Signup",
      text: `Your new OTP is ${newOtp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    // Update session with new OTP and reset expiration
    req.session.otp = newOtp;
    req.session.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiration

    // Reset the countdown timer in session storage
    res.setHeader("Content-Type", "text/html");
    res.write(`
      <script>
        sessionStorage.setItem('otpCountdown', 60); // Reset timer to 60 seconds
        window.location.href = "/otp?message=New OTP has been sent to your email";
      </script>
    `);
    res.end();
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.redirect("/otp?message=Something went wrong while resending OTP.");
  }
};

//otp verification
const verifyOTP = (req, res) => {
  const { otp1, otp2, otp3, otp4 } = req.body;
  const enteredOtp = otp1 + otp2 + otp3 + otp4;

  const { username, email, password } = req.session.signupData;

  if (!req.session.otp) {
    return res.redirect(
      "/otp?message=Session expired. Please request a new OTP."
    );
  }

  if (Date.now() > req.session.otpExpires) {
    return res.redirect("/otp?message=OTP expired. Please request a new one.");
  }

  if (parseInt(enteredOtp) === req.session.otp) {
    const newUser = new userSchema({ username, email, password });
    newUser
      .save()
      .then(() => {
        req.session.otp = null;
        req.session.otpExpires = null;
        req.session.user = newUser;

        res.setHeader("Content-Type", "text/html");
        res.write(`
            <script>
              sessionStorage.setItem('otpCountdown', 60); // Reset the countdown to 60 seconds
              window.location.href = "/";
            </script>
          `);
        res.end();
      })
      .catch((err) => {
        console.error(err);
        res.redirect("/signup?message=Error creating user.");
      });
  } else {
    return res.redirect("/otp?message=Invalid OTP. Please try again.");
  }
};

//home page render
const renderHome = async (req, res) => {
  const categories = await categorySchema.find({ isListed: true });
  const products2 = await ProductsSchema.find({ isListed: true })
    .limit(12)
    .populate("categoryID");
   
    const productOffers = await offerSchema.find({
      isActive: true,
      targetType: 'Product',
      selectedProducts: { $in: products2.map(p => p._id) }
  }).populate('selectedProducts');
   
  const categoryIDs = products2.map(p => p.categoryID); 

  const categoryOffers = await offerSchema.find({
      isActive: true,
      targetType: 'Category',
      selectedCategory: { $in: categoryIDs }
  }).populate('selectedCategory');
  
  
    const products = products2.map(product => {
        const productOffer = productOffers.find(offer => 
            offer.selectedProducts.some(selectedId => selectedId.equals(product._id))
        );
  
        const categoryOffer = categoryOffers.find(offer => 
            offer.selectedCategory.some(selectedCat => selectedCat.equals(product.categoryID))
        );
  
        const originalPrice = product.price;
        let discountedPrice = originalPrice; 
  
        if (productOffer) {
            discountedPrice = Math.round(originalPrice - (originalPrice * (productOffer.discountAmount / 100)));
        } else if (categoryOffer) {
            discountedPrice = Math.round(originalPrice - (originalPrice * (categoryOffer.discountAmount / 100)));
        }
  
        return {
            _id: product._id,
            name: product.name,
            price: originalPrice,
            description: product.description,
            images: product.images,
            stock: product.stock,
            colors: product.colors,
            rating: product.rating,
            category: product.categoryID ? product.categoryID.name : 'Unknown',
            offer: discountedPrice < originalPrice ? {
                discountedPrice,
                hasOffer: true
            } : { hasOffer: false }
        };
    });
  


  if (req.session.user) {
    res.render("user/home", { user: req.session.user, categories, products });
  } else {
    res.render("user/home", { user: false, categories, products });
  }
};


//logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
  });

  res.redirect("/");
};

//demo login
const demologin = (req, res) => {
  req.session.user = true;
  res.redirect("/");
};

//------------------------------------------------------------forgot password-------------------------------------------------------------------

//forgotemail
const forgotmail = (req, res) => {
  const message = req.query.message;
  res.render("user/forgotmail", { msg: message });
};

const forgotpassword = (req, res) => {
  res.redirect("/");
};

const forgotEmailVerify = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email is in database
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.redirect("/forgotmail?message=email not exist");
    }

    req.session.email = email;
    const genotp = Math.floor(1000 + Math.random() * 9000);
    console.log(genotp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASS, // Your email password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP for Signup",
      text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
    };

    // Send the OTP via email
    await transporter.sendMail(mailOptions);

    // Store OTP and expiration time in session
    req.session.otp = genotp;
    req.session.signupdata = req.body;
    req.session.otpExpires = Date.now() + 1 * 60 * 1000; // Set expiration time to 1 minute (60000 ms)

    console.log(req.session.otp); // Log the session OTP for debugging

    // Redirect to the OTP input page
    res.redirect("/forgetOtp");
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
};

const forgotOtpRender = (req, res) => {
  const message = req.query.message;
  res.render("user/forgetOtp", { msg: message });
};

const forgotPassOtp = (req, res) => {
  const { otp1, otp2, otp3, otp4 } = req.body;
  const enteredOtp = otp1 + otp2 + otp3 + otp4;

  if (!req.session.otp) {
    return res.redirect(
      "/forgetOtp?message=Session expired. Please request a new OTP."
    );
  }

  if (Date.now() > req.session.otpExpires) {
    return res.redirect(
      "/forgetOtp?message=OTP expired. Please request a new one."
    );
  }
  console.log("njan forgot pass");

  if (parseInt(enteredOtp) === req.session.otp) {
    console.log("OTP verified successfully");

    req.session.otp = null;
    req.session.otpExpires = null;
    res.render("user/newpass", { msg: null });
  } else {
    return res.redirect("/forgetOtp?message=Invalid OTP. Please try again.");
  }
};

const forgotResendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email is in database
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.redirect("/forgotmail?message=emai not exist");
    }

    const genotp = Math.floor(1000 + Math.random() * 9000);
    console.log(genotp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASS, // Your email password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP for Signup",
      text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
    };

    // Send the OTP via email
    await transporter.sendMail(mailOptions);

    // Store OTP and expiration time in session
    req.session.otp = genotp;
    req.session.signupdata = req.body;
    req.session.otpExpires = Date.now() + 1 * 60 * 1000; // Set expiration time to 1 minute (60000 ms)

    console.log(req.session.otp); // Log the session OTP for debugging

    // Redirect to the OTP input page
    res.redirect("/forgetOtp");
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
};

const newpassVerify = async (req, res) => {
  try {
    console.log("hai");

    const { password } = req.body;
    const email = req.session.email;
    console.log(email, password);

    // Find the user by email
    const existingUser = await userSchema.findOne({ email });
    console.log(existingUser);

    // Check if the user exists
    if (!existingUser) {
      return res.render("user/newpass", { message: "Email does not exist" });
    }

    // Hash the new password
    const hashPassword = await bcrypt.hash(password, saltRound);

    // Update the existing user's password
    await userSchema.updateOne(
      { email: email }, // criteria to find the user
      { $set: { password: hashPassword } } // update operation
    );

    console.log("Password updated successfully");
    res.render("user/login", { message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.send("Something went wrong");
  }
};

//------------------------------------------------------------------resetpassword------------------------------------------------------------------

const resetPassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  console.log(email, currentPassword, newPassword);
  

  try {
      const user = await userSchema.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await userSchema.updateOne(
          { email: email }, 
          { $set: { password: hashedPassword } } 
        );
      return res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ message: 'Server error' });
}
};





module.exports = {
  loadUserLogin,
  loadUserSignup,
  userSignupVerify,
  resendOTP,
  otprender,
  verifyOTP,
  userLoging,
  renderHome,
  logout,
  forgotmail,
  forgotpassword,
  forgotEmailVerify,
  forgotPassOtp,
  forgotOtpRender,
  forgotResendOTP,
  newpassVerify,
  demologin,
  resetPassword
};
