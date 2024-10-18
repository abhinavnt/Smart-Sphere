const express = require('express');
const router = express.Router();
const userAuth=require("../middleware/userAuth")
const userController=require("../Controller/User/userController")
const cartController=require("../Controller/User/cart")
const checkoutcontroller=require("../Controller/User/checkout")
const ordercontroller=require("../Controller/User/order")
const searchController=require("../Controller/User/search")
const shopController=require("../Controller/User/shop")
const profileController=require("../Controller/User/profile")
const passport=require("../config/passPort")

//----------------------------------------------------------------Login------------------------------------------------------------------------

router.get("/login",userAuth.isUserLogged,userController.loadUserLogin)
router.post("/login",userController.userLoging)
router.get("/demo",userController.demologin)


//-----------------------------------------------------------------googlelogin--------------------------------------------------------------------




//----------------------------------------------------------------SigUp------------------------------------------------------------------------

router.get('/signUp',userAuth.isUserLogged, userController.loadUserSignup)
router.get("/otp",userAuth.isUserLogged,userController.otprender)
router.post('/signUp',userController.userSignupVerify)
router.get('/resendOtp',userController.resendOTP)
router.post('/verifyotp',userController.verifyOTP)  

//----------------------------------------------------------------Home------------------------------------------------------------------------

router.get("/", userController.renderHome)


//----------------------------------------------------------------product details------------------------------------------------------------------------

router.get("/product-detail/:id",shopController.product_detail)

router.get('/logout',userAuth.checkUserSession,userController.logout)

//----------------------------------------------------------------------forgot password----------------------------------------------------------

router.get('/forgotmail',userController.forgotmail)
router.post('/forgot-otp',userController.forgotEmailVerify)
router.post("/forgetverifyotp",userController.forgotPassOtp)
router.get("/forgetOtp",userController.forgotOtpRender)
router.get("/forgotresendotp",userController.forgotResendOTP)
router.post("/update-password",userController.newpassVerify)

//---------------------------------------------------------------------Reset Password------------------------------------------------------------
router.patch('/resetPassword/:userId',userController.resetPassword)



//-------------------------------------------------------shop page---------------------------------------------------------------------------------

router.get('/shop',shopController.shopRender)


//-------------------------------------------------------profile----------------------------------------------------------------------------------

router.get('/profile',profileController.profile)
router.post('/addAddress/:id',profileController.addAddress)
router.patch('/editAddress/:id',profileController.editAddress)
router.delete('/daleteAddress/:id',profileController.deleteAddress)
router.patch('/userDetails/:id',profileController.updateDetails)

//----------------------------------------------------------cart-----------------------------------------------------------------------------------

router.get('/cart',userAuth.checkUserSession,cartController.cart)
router.post('/cart/add/:id',cartController.addCart)
router.post('/cart/check-stock/:id',cartController.check_stock)
router.patch('/cart/remove/:id',cartController.removeCart)
router.patch('/cart/update/:userId',cartController.updateCart)

// router.get('/cart/items-count/:userId',cartController.cartCount);

//-------------------------------------------------------------checkout-------------------------------------------------------------------------------
router.get('/checkout/:id',userAuth.checkUserSession,checkoutcontroller.checkout)
router.post('/checkout/submit/:id',checkoutcontroller.placeOrder)
router.get('/order/confirmation/:orderId',checkoutcontroller.conformationOrder)

//----------------------------------------------------------------orders------------------------------------------------------------------------------
router.post('/order/cancel/:orderId',ordercontroller.cancelOrder)
router.get('/order/details/:orderId',ordercontroller.orderDetails)

//-----------------------------------------------------------------search------------------------------------------------------------------------------
router.get('/search',searchController.search)

module.exports = router;
