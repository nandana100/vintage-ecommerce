
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');



const calculateTotalPrice = (products) => {
  return products.reduce((total, product_id) => total + product_id.quantity * product_id.price, 0);
};
const verifyCoupon = async (req, res) => {
  try {
    const id = req.session.user_id;
    const { coupon, total } = req.body;
    console.log('Received request to verify coupon:', req.body);

    console.log('Coupon to find:', coupon);
    const validCoupon = await Coupon.findOne({ code: coupon });
    console.log('Found Coupon:', validCoupon);

    if (!validCoupon) {
      return res.status(400).json({ message: 'Invalid Coupon' });
    }
console.log("heiii")
    if (validCoupon.minimumPurchase > parseFloat(total)) {
      return res.status(400).json({ message: `Minimum purchase amount is ${validCoupon.minimumPurchase}` });
    }
    console.log("hoiii")
    if (validCoupon.usedBy.includes(id)) {
      return res.status(400).json({ message: 'Coupon already used' });
    }
    console.log("huii")
    const currentDate = new Date();
    console.log("current:",currentDate)
    const expiryDate = new Date(validCoupon.expiry);
console.log("expiryyy:",expiryDate)
    if (currentDate > expiryDate) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }
    console.log("hiii")
    const user = await User.findOne({ _id: id });
    const cart = await Cart.findOne({ user_id: user._id }).populate('products.product_id');
    const totalPrice = calculateTotalPrice(cart.products);
    console.log("cart")
    if (isNaN(totalPrice)) {
      return res.status(500).json({ error: 'Invalid total price in the cart' });
    }

    let discountAmount = 0;

    if (validCoupon.discountType === 'flat') {
      discountAmount = validCoupon.discount;
    } else if (validCoupon.discountType === 'percentage') {
      discountAmount = (totalPrice * validCoupon.discount) / 100;
    }

    const totalAfterDiscount = (totalPrice - discountAmount).toFixed(2);
    console.log('totalAfterDiscount', totalAfterDiscount);

    await Cart.findOneAndUpdate({ user_id: user._id }, { $set: { totalPrice: totalAfterDiscount } }, { new: true });

    validCoupon.usedBy.push(id);
    await validCoupon.save();

    console.log('Coupon verified successfully');

    return res.status(200).json({ message: 'Coupon verified', discountAmount, totalAfterDiscount });
  } catch (err) {
    console.error('Error in verifyCoupon:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
 const removeCoupon= async (req, res) => {
  try {
    const userId = req.session.user_id;
    
    await Cart.findOneAndUpdate({ user_id: userId }, { $unset: { totalPrice: 1 } }, { new: true });
    
    console.log('Coupon removed successfully');
    return res.status(200).json({ message: 'Coupon removed successfully' });
  } catch (err) {
    console.error('Error while removing coupon:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}


   









module.exports = {

  verifyCoupon,
  removeCoupon

  
};