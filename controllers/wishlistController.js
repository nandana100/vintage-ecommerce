const Order = require("../models/orderModel")
const Product = require('../models/productModel')
const User = require('../models/userModel')
const Cart = require('../models/cartModel')

const wishlistLoad=async(req,res)=>{
    try {
const userId=req.session.user_id
const user=await User.findById(userId).populate('wishlist')
console.log("userL:",user)
const productIds = user.wishlist.map(wishlistItem => wishlistItem._id);
const wishlistProducts = await Product.find({ _id: { $in: productIds } });
console.log("wishlistProducts:", wishlistProducts);
res.render('wishlist',{wishlist:wishlistProducts,message:'',userId})

    }  catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const addToWishlist=async(req,res)=>{
    try {
        const userId=req.session.user_id
        console.log("userId",userId)
const productId=req.params.productId
console.log("productId",productId)

await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });
res.redirect('/wishlist')
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error')
    }
}
 const removeWishlist=async(req,res)=>{
    try {
        const userId=req.session.user_id
        const productId=req.params.productId
        await User.findByIdAndUpdate(userId,{$pull:{wishlist:productId}})
        res.redirect('/wishlist')
    }  catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error')
    }
}
 

module.exports={
    wishlistLoad,
    addToWishlist,
    removeWishlist

}