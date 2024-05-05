
const express = require('express');
const session = require('express-session');
const auth = require('../middleware/adminAuth');
const config = require("../config/config");
const bodyParser = require('body-parser');

const adminController = require('../controllers/adminController');
const adminLogincontroller = require('../controllers/adminLogincontroller');
const salescontroller = require('../controllers/salescontroller');
const offerController =require('../controllers/offerControllers')
const adminCouponController =require('../controllers/adminCouponcontroller')


const admin_route = express();



admin_route.use(session({
    secret: config.sessionSecret,
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true
}));
admin_route.use(express.static('public'));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');



const path = require('path')


const multer = require('multer')
const storage = multer.diskStorage({
    destination:(req,res,cd) => {
        cd(null,path.join(__dirname,'../public/productImage'))
    },
    filename:(req,file,cd) => {
        const name = Date.now()+'-'+file.originalname
        cd(null,name)
    }
})

const upload = multer({storage:storage,})
//------------------------user-----------------------//
admin_route.get('/login',auth.isLogout, adminLogincontroller.loadLogin);
admin_route.post('/login', adminLogincontroller.verifyLogin);
admin_route.get('/dashboard', auth.isLogin ,adminLogincontroller.loadDashboard);

admin_route.get('/userList',auth.isLogin, adminLogincontroller.userList);

admin_route.get('/block-user',auth.isLogin, adminLogincontroller.blockUser);

admin_route.get('/unblock-user',auth.isLogin, adminLogincontroller.unblockUser);
//------------------------category-----------------------//

admin_route.get('/addCategory',auth.isLogin, adminController.loadCategory)

admin_route.post('/addCategory', auth.isLogin,adminController.addCategory)

admin_route.get('/viewCategory',auth.isLogin,adminController.loadCategoryList)

admin_route.get('/editCategory',auth.isLogin,adminController.editCategoryLoad)

admin_route.post('/editCategory',auth.isLogin,adminController.editCategory)

admin_route.get('/deleteCategory',adminController.deleteCategory)

//------------------------product-----------------------//

admin_route.get('/productList',auth.isLogin, adminController.loadProductList);

 admin_route.get('/addProduct',auth.isLogin,adminController.loadProduct);

 admin_route.post('/addProduct',auth.isLogin,upload.array('image',3),adminController.addProduct);

 admin_route.get('/editProduct',auth.isLogin,adminController.editProductLoad);

 admin_route.post('/editProduct', auth.isLogin,upload.array('image', 3),adminController.updateProduct);
 admin_route.get('/deleteProduct',auth.isLogin,adminController.deleteProduct);
 admin_route.post('/deleteImage',auth.isLogin,adminController.deleteImage);

 admin_route.get('/logout',auth.isLogin,adminLogincontroller.logout);
//----------------------------orders-----------------//
admin_route.get('/orderList',auth.isLogin,adminController.loadOrder);
admin_route.put('/orders/:orderId/status', auth.isLogin,adminController.updateOrderStatus)
admin_route.get('/reports',auth.isLogin, salescontroller.loadReport)
admin_route.get('/exportPdfOrders', salescontroller.exportPdfOrders)
admin_route.get('/exportExcelOrders', salescontroller.exportExcelOrders)
admin_route.get('/orderDetail', adminController.orderDetail)


//----------------------------offers-----------------//
admin_route.get('/offers', auth.isLogin, offerController.offerLoad)

admin_route.get('/add-offers', auth.isLogin, offerController.addOffersLoad)

admin_route.post('/addOffers',auth.isLogin, offerController.addOffers);
//----------------------------productoffers-----------------//
// admin_route.get('/productOffers', auth.isLogin, productOfferController.productOfferLoad)

// admin_route.get('/add-productOffers', auth.isLogin, productOfferController.loadProductAddOfferPage)

// admin_route.post('/addproductOffers',auth.isLogin, productOfferController.applyProductOffer);





//----------------------------coupons-----------------//

admin_route.get('/coupons', auth.isLogin, adminCouponController.couponLoad)

admin_route.get('/add-coupon', auth.isLogin, adminCouponController.addCouponLoad)

admin_route.post('/add-coupon',auth.isLogin, adminCouponController.createCoupon)

admin_route.get('/edit-coupon', auth.isLogin, adminCouponController.loadEditCoupon)

admin_route.post('/edit-coupon',auth.isLogin, adminCouponController.editCoupons)

admin_route.get('/delete-coupon', auth.isLogin, adminCouponController.deleteCoupons)


//----------------------------charts-----------------//
const chartController = require('../controllers/chartController')

// admin_route.get('/weeklyBarChart', auth.isLogin, chartController.weeklyBarChart);

admin_route.get('/monthlyBarChart', auth.isLogin, chartController.monthlyBarChart);

admin_route.get('/yearlyBarChart', auth.isLogin, chartController.yearlyBarChart);


// admin_route.get('/weeklyAreaChart', auth.isLogin, chartController.weeklyAreaChart);

admin_route.get('/monthlyAreaChart', auth.isLogin, chartController.monthlyAreaChart);

admin_route.get('/yearlyAreaChart', auth.isLogin, chartController.yearlyAreaChart);

admin_route.get('/piechart', auth.isLogin, chartController.piechart);

admin_route.get('/linechart', auth.isLogin, chartController.linechart);

admin_route.get('/topcategories', auth.isLogin, adminLogincontroller.loadDashboard);







module.exports =  admin_route;