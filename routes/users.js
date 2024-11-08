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
const wishlistController=require("../Controller/User/wishlistController")
const walletController=require("../Controller/User/walletController")
const couponController=require("../Controller/User/couponController")
const passport=require("../config/passPort")

//----------------------------------------------------------------Login------------------------------------------------------------------------

router.get("/login",userAuth.isUserLogged,userController.loadUserLogin)
router.post("/login",userController.userLoging)
router.get("/demo",userController.demologin)


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
router.patch('/resetPassword/:userId',userAuth.checkUserSession,userController.resetPassword)



//-------------------------------------------------------shop page---------------------------------------------------------------------------------

router.get('/shop',shopController.shopRender)


//-------------------------------------------------------profile----------------------------------------------------------------------------------

router.get('/profile',userAuth.checkUserSession,profileController.profile)
router.post('/addAddress/:id',userAuth.checkUserSession,profileController.addAddress)
router.patch('/editAddress/:id',userAuth.checkUserSession,profileController.editAddress)
router.delete('/daleteAddress/:id',userAuth.checkUserSession,profileController.deleteAddress)
router.patch('/userDetails/:id',userAuth.checkUserSession,profileController.updateDetails)

//----------------------------------------------------------cart-----------------------------------------------------------------------------------

router.get('/cart',userAuth.checkUserSession,cartController.cart)
router.post('/cart/add/:id',userAuth.checkUserSession,cartController.addCart)
router.post('/cart/check-stock/:id',userAuth.checkUserSession,cartController.check_stock)
router.patch('/cart/remove/:id',userAuth.checkUserSession,cartController.removeCart)
router.patch('/cart/update/:userId',userAuth.checkUserSession,cartController.updateCart)
router.get('/cart/items-count/:userId',cartController.cartCount);

//-------------------------------------------------------------checkout-------------------------------------------------------------------------------
router.get('/checkout',userAuth.checkUserSession,checkoutcontroller.checkout)
router.post('/checkout/submit/:id',userAuth.checkUserSession,checkoutcontroller.placeOrder)
router.get('/order/confirmation/:orderId',userAuth.checkUserSession,checkoutcontroller.conformationOrder)
router.post('/cart/applyCoupon',checkoutcontroller.applyCoupon)

//----------------------------------------------------------------orders------------------------------------------------------------------------------

//order items rendering is in the profile controller

//cancel product
router.post('/order/cancel/:orderId/:productId', userAuth.checkUserSession,ordercontroller.cancelProductInOrder);
router.post('/order/return/:orderId/:productId', ordercontroller.returnProductInOrder);

router.post('/payment/failure/:id',checkoutcontroller.handleRazorpayPayment)
router.post('/payment/success/:orderId',checkoutcontroller.paymentSucess);
router.post('/retryPayment/:orderId', checkoutcontroller.retryPayment)

//-----------------------------------------------------------------search------------------------------------------------------------------------------
router.get('/search',searchController.search)

//--------------------------------------------------------------------wishlist-----------------------------------------------------------------------
router.get('/wishlist',wishlistController.wishlist)
router.post('/wishlist/add/:productId',wishlistController.addWishlist)
router.delete('/wishlist/remove',wishlistController.removeFromWishlist)
router.get('/wishlist/items-count/:userId', wishlistController.wishlistCount);

//------------------------------------------------------------------wallet--------------------------------------------------------------------------
router.get('/wallet/transactions',walletController.transaction)


//----------------------------------------------------------------coupon----------------------------------------------------------------------------------

router.get('/coupons/available',couponController.availableCoupon)

module.exports = router;
