const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const Coupon = require('../models/couponModel');
const User = require('../models/userModel');


const calculateTotalPrice = (products) => {
  return products.reduce((total, product_id) => total + product_id.quantity * product_id.price, 0);
};

const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  const discountFactor = 1 - discountPercentage / 100;
  return originalPrice * discountFactor;
};

const applyCouponToCart = async (userId, couponCode, cartData) => {
  try {
    const userCart = await Cart.findOne({ user_id:userId }).populate('products.product_id');

    if (!userCart) {
      return { success: false, message: 'Cart not found for the user' };
    }

    const appliedCoupon = await Coupon.findOne({ code: couponCode });

    if (!appliedCoupon) {
      return { success: false, message: 'Coupon not found' };
    }

    userCart.products.forEach((cartProduct) => {
      const discountedPrice = calculateDiscountedPrice(cartProduct.product.price, appliedCoupon.discount);
      cartProduct.price = discountedPrice;
    });

    userCart.totalPrice = calculateTotalPrice(userCart.products);

    await userCart.save();

    const updatedTotalPrice = calculateTotalPrice(userCart.products);

    return { success: true, updatedCart: userCart, updatedTotalPrice };
  } catch (error) {
    console.error('Error applying coupon to the cart:', error);
    return { success: false, message: 'Failed to apply coupon to the cart' };
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.session.user_id) {
      return res.redirect('/login');
    }

    let cart = await Cart.findOne({ user_id: req.session.user_id });

    if (!cart) {
      cart = new Cart({ user_id: req.session.user_id, products: [] });
    }

     const existingProduct = cart.products.find(p => p.product_id.equals(product._id));

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      const initialQuantity = product.quantity || 1; 
      cart.products.push({
        product_id: product._id,
        price: product.price,
        quantity: initialQuantity,
      });
    }


    cart.totalPrice = calculateTotalPrice(cart.products);

    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({user_id: userId }).populate('products.product_id');
    const coupon = await Coupon.findOne();
    console.log("cartData:",cartData)
    

    const appliedCouponCode = req.session.appliedCouponCode || null;

    if (appliedCouponCode) {
      const result = await applyCouponToCart(userId, appliedCouponCode, cartData);
      if (result.success) {
        res.render('cart', {
          cartData: result.updatedCart,
          coupon,
          userId,
          appliedCouponCode,
          updatedTotalPrice: result.updatedTotalPrice,
        });
      } else {
        res.json({ success: false, message: 'Failed to apply coupon', cartData });
      }
    } else {
      res.render('loadCart', { cartData, coupon, userId, appliedCouponCode: null });
    }
  } catch (error) {
    console.error('Error loading cart:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const removeProductFromCart = async (userId, productId) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user_id:userId },
      { $pull: { products: { product_id: productId } } },
      { new: true }
    );

    if (cart) {
      cart.totalPrice = calculateTotalPrice(cart.products);
      await cart.save();

      return { success: true };
    } else {
      return { success: false, message: 'Cart not found' };
    }
  } catch (error) {
    console.error('Error removing product from cart:', error.message);
    return { success: false, message: 'Internal Server Error' };
  }
};

const deleteItem = async (req, res) => {
  try {
    const productId = req.params.productId;

    const result = await removeProductFromCart(req.session.user_id, productId);
    if (result.success) {
      res.json({ success: true, message: 'Item deleted successfully' });
    } else {
      res.json({ success: false, message: 'Failed to delete item' });
    }
  } catch (error) {
    console.error('Error deleting item:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const newQuantity = req.body.newQuantity;

    const result = await updateProductQuantity(userId, productId, newQuantity);

    console.log('Update Quantity route called');
    console.log(req.body);

    if (result.success) {
      const updatedCart = await Cart.findOne({ user_id: userId }).populate('products.product_id');

      const updatedTotal = calculateTotalPrice(updatedCart.products);

      res.json({ success: true, updatedCart, updatedTotal });
    } else {
      res.json({ success: false, message: 'Failed to update quantity' });
    }
  } catch (error) {
    console.error('Error updating quantity:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const updateProductQuantity = async (userId, productId, newQuantity) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      {user_id: userId, 'products.product_id': productId },
      { $set: { 'products.$.quantity': newQuantity } },
      { new: true }
    );

    if (cart) {
      cart.totalPrice = calculateTotalPrice(cart.products);
      await cart.save();
      const unitPrice = cart.products.find(item => item.product == productId).price;
      return { success: true, updatedCart: cart, unitPrice };
    } else {
      return { success: false, message: 'Product not found in the cart' };
    }
  } catch (error) {
    console.error('Error updating product quantity:', error.message);
    return { success: false, message: 'Internal Server Error' };
  }
};












module.exports = {
    loadCart,
    addToCart,
    deleteItem,
    updateQuantity
  
    
};