const mongoose=require('mongoose')
const Category = require('./categoryModel'); 
const Coupon = require('./couponModel'); // Import the Coupon model

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: Array,
        required: true,
        validate: [arrayLimit, "You can pass only 3 product images"]
    },
    croppedImages: {
        type: Array,
        default: [] 
    },

    category_id: {
        type: mongoose.Types.ObjectId,
        ref: Category,
        required: true
    },
    is_disabled: {
        type: Boolean,
        default: false
    },
    is_cancelled: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false,
      },
      is_offer: {
        type: Boolean,
        default: false,
    },
    earlierPrice: {
        type: Number,
        default:true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    coupons: [{
        type: mongoose.Types.ObjectId,
        ref: 'Coupon' 
    }]
    });

function arrayLimit(val) {
    return val.length <= 3;
}

module.exports = mongoose.model('Product', productSchema);
