const Order = require("../models/orderModel")
const Product = require('../models/productModel')
const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Wallet = require('../models/walletModel');
const Razorpay = require('razorpay');

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});
const loadOrder = async (req, res) => {
  try {
    const id = req.session.user_id;

    const cart = await Cart.findOne({ user_id: id }).populate('products.product_id');
    const user = await User.findById(id).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cartData = {
      products: cart.products,
      price: cart.Price,
      description: cart.description,
      totalPrice: cart.totalPrice,
    };

    const orderDetails = await Order.find({ userId: id }).populate({
      path: 'products.product_id',
      model: 'Product',
    }).exec();

    res.render('checkOut', { id, cartData, user, orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("error");
  }
};



const placeOrder = async (req, res) => {
  try {
      const userId = req.session.user_id;
      if (!userId) {
          res.redirect('/home');
          return;
      }

      const { payment, name, city, email, address, pincode, state } = req.body;
      console.log('req.body of cod :', req.body)

      let totalPrice = 0;
      let totalQuantity = 0;

      const cartData = await Cart.find({ user_id:userId }).populate('products.product_id');
      if (cartData.length > 0) {
          totalPrice = cartData[0].totalPrice;
      } else {
          res.redirect('/allProduct');
          return;
      }


      const productsArray = cartData[0].products.map(product => ({
          product_id: product.product_id._id,
          price: product.price,
          quantity: product.quantity,
      }));

      const productIds = Array.isArray(req.body.productId)
          ? req.body.productId
          : [req.body.productId];

      console.log('productIds:', productIds)


      if (payment === 'COD') {

          const cartData = await Cart.findOne({ user_id:userId }).populate('products.product_id').lean();

          if (!cartData) {
              throw new Error('Cart not found');
          }

          const totalPrice = cartData.totalPrice;

          const productsArray = cartData.products.map(product => ({
              product_id: product.product_id._id,
              price: product.price,
              quantity: product.quantity,
          }));

          const totalQuantity = productsArray.reduce((sum, product) => sum + product.quantity, 0);
          if (payment === 'COD' && totalPrice > 1000) {
            return res.status(400).json({ error: 'COD not available for orders above $1000' });
          }

          const orderData = new Order({
              userId: userId,
              products: productsArray,
              name: name,
              email: req.body.email, // Assuming you have email in the form
              addresses: {
                  address: req.body.address,
                  city: city,
                  pincode: req.body.pincode, // Assuming you have pincode in the form
                  state: req.body.state, // Assuming you have state in the form
              },
              paymentMethod: 'COD',
              quantity: totalQuantity,
              totalPrice: totalPrice,
          });

          const validationResult = orderData.validateSync(); // Validate the orderData

          if (validationResult) {
              // Handle validation errors
              const errors = Object.values(validationResult.errors).map(err => err.message);
              return res.status(400).json({ error: errors });
          }

          const savedOrder = await orderData.save();

          if (!savedOrder) {
            return res.status(500).json({ error: 'Failed to save COD order' })
          }

          if (savedOrder) {
              //res.render('user/orderplaced',{title:'Orderstatus',style:'style.css',user:true,log});   
              const response = {
                  message: 'Order Placed (COD)',
                  payment: 'COD',
              };
              console.log('response of server', response)
              res.status(200).json(response);
              const product = req.body.productId;
              console.log('product:', product)
              const updated = await Cart.updateOne(
                  {
                    user_id: userId,
                      'products.product_id': { $in: Array.isArray(product) ? product : [product] }
                  },
                  {
                      $pull: {
                          products: {
                              product_id: { $in: Array.isArray(product) ? product : [product] }
                          }
                      }
                  }
              );
              console.log('updated :', updated)
              const user = await User.findById(req.session.user_id);
              console.log('user:', user)
              const count = await Wallet.find({ userId: req.session.user_id }).count();
              console.log('count:', count)
              if (user.refferedCode && user.is_reffered === false) {
                  if (count === 0) {
                      const wallet = new Wallet({
                          userId: req.session.user_id,
                          totalPrice: 50
                      });
                      console.log('wallet:', wallet)
                      const res = await wallet.save();
                      console.log('res :', res)

                      await User.findByIdAndUpdate(req.session.user_id, { is_reffered: true });
                  }

              }

              const referdUser = await User.findOne({ referalCode: user.refferedCode });
              console.log('referdUser :', referdUser)
              if (referdUser && user.is_reffered === false) {

                  const user1 = await User.findOne({ referalCode: user.refferedCode });

                  console.log('user1 :', user1)

                  const count1 = await Wallet.find({ userId: user1._id })
                  console.log('count1  :', count1)


                  if (count1.length === 0) {

                      const wallet = new Wallet({
                          userId: referdUser._id,
                          totalPrice: 100
                      });
                      const res = await wallet.save();

                  } else if (count1.length > 0) {

                      const wallet1 = await Wallet.findOne({ userId: referdUser._id });
                      if (wallet1) {

                          await Wallet.findOneAndUpdate({ userId: referdUser._id }, { $inc: { totalPrice: 100 } }, { new: true });

                      } else {

                          const wallet = new Wallet({
                              userId: referdUser._id,
                              totalPrice: 100
                          });
                          console.log('wallet:', wallet)
                          const res = await wallet.save();
                          console.log('res:', res)
                      }
                  }


              }

          }

      }

      else if (req.body.payment === "WALLET") {

          const id = req.session.user_id
          console.log("id:",id)
          const wallet = await Wallet.findOne({ userId: id });
          console.log("wallety:",wallet)
          // const walletTotal = wallet.find(total=>total)
          const cartTotal = cartData.find(total => total)
          console.log(wallet.totalPrice);
          console.log(cartTotal.totalPrice);
          console.log('wal-', wallet.totalPrice);
          console.log('Cart Total Price:', cartTotal.totalPrice);
          console.log('Wallet Total Price:', wallet.totalPrice);
          if (cartTotal.totalPrice <= wallet.totalPrice) {

              const updatedTotal = wallet.totalPrice - cartTotal.totalPrice;
              console.log(updatedTotal);

              const order_Data = new Order({
                  userId: userId,
                  products: productsArray,
                  name: name,
                  email: req.body.email, // Assuming you have email in the form
                  addresses: {
                      address: req.body.address,
                      city: city,
                      pincode: req.body.pincode, // Assuming you have pincode in the form
                      state: req.body.state, // Assuming you have state in the form
                  },
                  paymentMethod: req.body.payment,
                  quantity: totalQuantity,
                  totalPrice: totalPrice,
              });
console.log("order_Data:",order_Data)
              const orderData = await order_Data.save();
              const wallet1 = await Wallet.findOneAndUpdate(
                { userId: id }, 
                { $set: { totalPrice: updatedTotal } }, 
                { new: true }
              );
              console.log('wallet1:',wallet1)
              const response = {
                  message: 'Order Placed',
                  payment: req.body.payment
              }
              res.status(200).json(response)
              const productId = req.body.productId
              const updated = await Cart.updateOne({
                  userId: id, 'products.product_id': { $in: Array.isArray(productId) ? productId : [productId] }
              },
                  {
                      $pull: { products: { product: { $in: Array.isArray(productId) ? productId : [productId] } } },
                  });

          } else {

              const response = { errorMessages: 'Insufficient balance.Choose another option' };
              return res.status(400).json(response)
          }
      }
      else {
          const amount = totalPrice * 100;
          const options = {
              amount: amount,
              currency: "INR",
              receipt: generateOrderId(),
          };

          const orderPromise = new Promise((resolve, reject) => {
            razorpayInstance.orders.create(options, (err, order) => {
                if (err) {
                    console.error('Error creating Razorpay order:', err);
                    if (err.statusCode === 401) {
                        reject(new Error('Razorpay authentication failed. Check your API keys.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(order);
                }
            });
        });
          const order = await orderPromise;

          if (!order) {
              console.error('Razorpay order is undefined.');
              return res.status(500).json({ error: 'Failed to create Razorpay order' });
              
          }

         

          const response = {
              method: "UPI",
              success: true,
              amount: amount,
              key_id: RAZORPAY_KEY_ID,
              name: req.session.user_id,
              order: order,
          };

          console.log('Server Response:', response);
          console.log(order);
          res.status(200).json({ response });
      }
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


function generateOrderId() {
  const timestamp = Date.now().toString(); 
  const randomString = Math.random().toString(36).substring(2, 8); 

  const orderId =` ${timestamp}-${randomString}`;

  return orderId;
}


const razorpayVerify = async (req, res) => {
  try {
      console.log('req.body:', req.body);
      console.log('req.body.proName', req.body.proName);
      console.log(req.body.productId)

      const log = req.session.user_id;
      const id = req.session.user_id;

      const cartData = await Cart.findOne({ user_id: id }).populate('products.product_id').lean();
      console.log('cartData : ', cartData)
      if (!cartData) {
          throw new Error('Cart not found');
      }

      const { quantity, price, proName } = req.body;
      console.log('quantity', quantity)
      console.log('price', price)

      const quantityArray = Array.isArray(req.body.quantity) ? req.body.quantity.map(Number) : [Number(req.body.quantity)];
      const priceArray = Array.isArray(req.body.price) ? req.body.price.map(Number) : [Number(req.body.price)];
      const nameArray = Array.isArray(req.body.name) ? req.body.name : [req.body.name];

      console.log('quantityArray:', quantityArray);
      console.log('priceArray:', priceArray);

      if (quantityArray.some(isNaN) || priceArray.some(isNaN)) {
          throw new Error('Invalid quantity or price values');
      }

      const productsArray = quantityArray.map((quantity, index) => ({
        product_id: cartData.products[index].product_id._id,
        quantity: parseInt(quantity),
        price: parseFloat(priceArray[index]),
      }));
      console.log('productsArray :', productsArray)

      const orderData = new Order({
        userId: id, // Make sure 'id' is defined
        products: productsArray,
        name: req.body.name,
        email: req.body.email,
        addresses: {
          address: req.body.address,
          city: req.body.city,
          pincode: req.body.pincode,
          state: req.body.state,
        },
        paymentMethod: req.body.payment,
        quantity: cartData.products.reduce((sum, product) => sum + product.quantity, 0),
        totalPrice: cartData.totalPrice,
      });
      
      console.log('orderData :', orderData)


      const savedOrder = await orderData.save();

      if (!savedOrder) {
          throw new Error('Failed to save order');
      }

      const response = {
          success: true,
          message: 'Order Placed',
          error: 'Order failed',
          payment: req.body.payment,
      };

      res.status(200).json(response);

      const updatedCart = await Cart.updateOne(
        { user_id: id },
        {
          $pull: {
            products: { product_id: { $in: cartData.products.map(p => p.product_id) } }
          }
        }
      );
      
      

      const user = await User.findById(req.session.user_id);
      const count = await Wallet.find({ userId: req.session.user_id }).count();
      if (user.refferedCode && user.is_reffered === false) {

          if (count === 0) {
              const wallet = new Wallet({
                  userId: req.session.user_id,
                  totalPrice: 50
              });
              const res = await wallet.save();

              await User.findByIdAndUpdate(req.session.user_id, { is_reffered: true });
          }

      }

      const referdUser = await User.findOne({ referalCode: user.refferedCode });
      if (referdUser && user.is_reffered === false) {
          const user1 = await User.findOne({ referalCode: user.refferedCode });

          const count1 = await Wallet.find({ userId: user1._id })

          console.log('count=', count1.length)
          if (count1.length === 0) {

              const wallet = new Wallet({
                  userId: referdUser._id,
                  totalPrice: 100
              });
              const res = await wallet.save();

          } else if (count1.length > 0) {

              const wallet1 = await Wallet.findOne({ userId: referdUser._id });
              if (wallet1) {

                  await Wallet.findOneAndUpdate({ userId: referdUser._id }, { $inc: { totalPrice: 100 } }, { new: true });

              } else {

                  const wallet = new Wallet({
                      userId: referdUser._id,
                      totalPrice: 100
                  });
                  const res = await wallet.save();

              }
          }


     }
  } catch (err) {
      console.error(err.message);
      const response = {
          error: err.message,
      };
      res.status(400).json(response);
  }
};


const calculateTotalPrice = (products) => {
  return products.reduce((total, product) => {
    return total + (product.price * product.quantity);
  }, 0);
};

const removeProductsFromCart = async (userId, productId) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user_id: userId },
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
const receiptLoad = async (req, res) => {
  try {

    console.log('hello...............')
    const log = req.session.user_id;
    const orderDetails = await Order.findOne({ userId: log }).populate('products.product_id').populate('addresses').sort({ _id: -1 }).limit(1).lean();
    res.render('receipt', { orderDetails, userId: log });
    await Cart.deleteOne({ userId: log });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}





const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user=req.session.user_id;
    console.log('orderId:', orderId);

    const order = await Order.findById(orderId);
    console.log('Order:', order);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

  
    
    const canceledAmount = order.totalPrice;

    console.log('Canceled Amount:', canceledAmount);

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            $set: { status: 'Cancelled', is_cancelled: true },
            $inc: { walletAmount: canceledAmount },
        },
        { new: true }
    );

    const orderData = await Order.findById(orderId);

    console.log('Order Data:', orderData);
    console.log('User:', user);

    const walletData = {
        userId: user,
        totalPrice: canceledAmount,
    };

    const wallet1 = await Wallet.findOne({ userId: user });

    // Log to check wallet1
    console.log('Wallet 1:', wallet1);

    if (wallet1) {
        await Wallet.findByIdAndUpdate(wallet1._id, {
            $inc: { totalPrice: canceledAmount },
        });
    } else {
        const wallet = new Wallet(walletData);
        await wallet.save();
    }

    const finalWalletState = await Wallet.findOne({ userId: user });
    console.log('Final Wallet State:', finalWalletState);


    if (updatedOrder) {
        const response = {
            message: 'Order cancelled successfully',
        };
        res.status(200).json(response);
    } else {
        res.status(500).json({ error: 'Error updating order' });
    }
} catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
}
};



const returnOrder=async(req,res)=>{
  const orderId = req.params.orderId;
  if(!orderId){
    return res.redirect('/profileLoad');
  }
  const orderData=await Order.findById(orderId).populate('products.product_id');
  console.log("new:",orderData)
  if(orderData){

  res.render('return', { orderId ,orderData});
  }
};


module.exports = {
  loadOrder,
  placeOrder,
  receiptLoad,
  removeProductsFromCart,
  cancelOrder,
  returnOrder,
  razorpayVerify
  
}