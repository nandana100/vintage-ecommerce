

const express = require("express");
const session = require("express-session");
const config = require("../config/config");
const cookieParser = require("cookie-parser");
const auth = require("../middleware/auth");




const profileController = require("../controllers/profileController");
const cartController = require("../controllers/userCartController");
const userLogincontroller = require("../controllers/userLogincontroller");
const userProductController = require("../controllers/userProductController");
const userOrderController = require("../controllers/userOrderController");
const wishlistController = require("../controllers/wishlistController");
const walletController = require("../controllers/walletController");
const couponController = require("../controllers/couponController");


const user_route = express();
user_route.use((req, res, next) => {
    res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

user_route.use(cookieParser());
user_route.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 600000 },
    })
);
const multer = require('multer');

const storage = multer.memoryStorage(); // Using memory storage for handling base64 images
const upload = multer({ storage: storage });


user_route.use("/public", express.static("public"));
user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));


// Register and Login Routes
user_route.get("/register", userLogincontroller.loadRegister);
user_route.post("/register", userLogincontroller.insertUser);
user_route.get("/verifyMail/:id", userLogincontroller.verifyMail);
user_route.post("/verifyMail", userLogincontroller.verifyOtp);
user_route.get("/resendOtp/:id", userLogincontroller.resendOtp);
user_route.get('/forget',auth.isLogout,userLogincontroller.forgetLoad)

user_route.post('/forget',userLogincontroller.forgetVerify)


user_route.get('/changePassword',userLogincontroller.changePasswordLoad)

user_route.post('/changePassword',userLogincontroller.resetPassword)


user_route.get("/", userLogincontroller.loginLoad);
user_route.get("/login", auth.isLogout, userLogincontroller.loginLoad);
user_route.post("/login", userLogincontroller.verifyLogin);
user_route.get("/home", auth.isLogin, userLogincontroller.loadHome);
user_route.get("/logout", auth.isLogin, userLogincontroller.userLogout);

// Product Routes
user_route.get("/allProduct", userProductController.loadProduct);
user_route.get("/productDetail", userProductController.loadProductDetail);
user_route.get("/searchProduct", userProductController.productSearch);


// Cart Routes
user_route.get('/add-to-cart/:productId', cartController.addToCart)

user_route.get('/cart', auth.isLogin, cartController.loadCart)

user_route.post('/updateQuantity', cartController.updateQuantity)

user_route.post('/deleteItem/:productId', cartController.deleteItem)
user_route.post('/removeCoupon', couponController.removeCoupon)


// Change the method to DELETE
// user_route.post("/updateQuantity", auth.isLogin, cartController.updateQuantity);

// user_route.post("/updateQuantityOnServer", auth.isLogin, userCartController.updateQuantityOnServer);



// Profile Route
user_route.get("/profileLoad", auth.isLogin, profileController.loadProfile);
user_route.post("/addAddress",profileController.addAddressProfile);
user_route.get("/edit-user", auth.isLogin, profileController.editProfileLoad);
user_route.post('/edit-user', auth.isLogin,profileController.updateProfileLoad);
user_route.get('/editAddress', auth.isLogin,profileController.editAddressLoad);
user_route.post('/editAddress', auth.isLogin,profileController.updateAddress);

user_route.get('/deleteAddress',profileController.deleteAddress)
user_route.post('/change-password',profileController.changePassword)
// order Route
user_route.get("/orderLoad",  auth.isLogin,userOrderController.loadOrder);
user_route.post("/place-order",  auth.isLogin,userOrderController.placeOrder);
user_route.get("/order-placed",  auth.isLogin,userOrderController.receiptLoad);
user_route.post('/cancel-order/:orderId',  auth.isLogin,userOrderController.cancelOrder);
user_route.get('/return-order/:orderId',  auth.isLogin,userOrderController.returnOrder);
user_route.post('/verifyRazorPay',auth.isLogin,upload.none(),userOrderController.razorpayVerify)
//wishlist  Route
user_route.get("/wishlist",  auth.isLogin,wishlistController.wishlistLoad);
user_route.get("/addToWishlist/:productId", auth.isLogin, wishlistController.addToWishlist);
user_route.get("/removeWishlist/:productId", auth.isLogin, wishlistController.removeWishlist);
//wallet
user_route.get("/loadWallet", auth.isLogin, walletController.loadWallet);
//coupons

user_route.post('/verifyCoupon',auth.isLogin,couponController.verifyCoupon);
// invoice
const invoiceController = require('../controllers/invoiceControllers')

user_route.get('/invoice',auth.isLogin,invoiceController.createInvoice);




module.exports = user_route;
