const express = require("express");
const router = express.Router();
const adminController = require("../Controller/Admin/adminController");
const adminAuth = require("../middleware/adminAuth");
const productImageUpload = require("../config/multer");
const orderController=require("../Controller/Admin/orders")
const categoryController=require("../Controller/Admin/category")
const productController=require("../Controller/Admin/products")
const offerController=require("../Controller/Admin/offerController")

//----------------------------------------------------------------Login------------------------------------------------------------------------

//admin login page load
router.get("/login", adminAuth.isAdminLoged, adminController.loadAdminLogin);
//admin login post
router.post("/login", adminController.adminLogin);
//admin logout
router.get("/logout", adminController.logoutAdmin);

//----------------------------------------------------------------dashBoard------------------------------------------------------------------------

//admin dasboard
router.get("/dashboard",adminAuth.checkAdminSession,adminController.adminDashBoard);
//admin user management
router.get("/users", adminAuth.checkAdminSession, adminController.adminUser);
//admin user block
router.patch("/users/:id", adminController.isBlock);

//----------------------------------------------------------------category------------------------------------------------------------------------

// admin category management
router.get("/category",adminAuth.checkAdminSession,categoryController.adminCategory);
// admin new category add
router.post("/categories/add",adminAuth.checkAdminSession,categoryController.adminCategoryadd);
//admin category listing
router.patch("/category/:id", categoryController.isCategorylist);
//admin category edit
router.patch("/categories/edit/:id", categoryController.adminCategoryEdit);

//----------------------------------------------------------------product------------------------------------------------------------------------

//admin products
router.get("/products",adminAuth.checkAdminSession,productController.adminProducts);
//admin add products
router.post("/add-product",productImageUpload.array("croppedImage[]", 3),productController.adminAddProduct);
//admin produt edit modal
router.get("/products/:id", productController.edit_product);
router.patch("/products/:id",productImageUpload.array("croppedImage[]", 10),productController.editProductModal);
//admin product list
router.post("/products/:id", productController.isProductListed);

//------------------------------------------------------------------orders---------------------------------------------------------------

//render the orders
router.get('/orders',orderController.order)
//approve cancellation request
router.post('/orders/:orderId/approve-cancellation/:productId', orderController.approveProductCancellation);
//change the order status
router.patch('/orders/:orderId/items/:productId/status',orderController.changeItemStatus);
//render order details
router.get('/:orderId/details',orderController.orderDetails)

//--------------------------------------------------------------------offers--------------------------------------------------------------------
router.get('/offer',offerController.offer)
router.get('/products2',offerController.products)
router.get('/categories',offerController.categories)
router.post('/offers/add',offerController.addOffer)
router.patch('/offers/edit',offerController.editOffer)
router.patch('/offers/activate',offerController.activate)
router.patch('/offers/deactivate',offerController.deactivate)






module.exports = router;
