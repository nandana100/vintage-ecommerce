// cartModel
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    products: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', 
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    totalPrice: {
        type: Number,
        default: 0
    },
    appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
