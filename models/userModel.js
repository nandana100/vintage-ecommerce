const mongoose = require('mongoose');



const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    is_admin: {
        type: Number,
        required: true,
    },
    is_varified: {
        type: Number,
        default: 0,
    },
    is_blocked: {
        type: Boolean,
        default: false,
    },
    addresses: [{
        address: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
        phoneNumber: String
    }],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],
    token:{
        type:String,
        default:""

    },
    referalCode:{
        type:String,
        required:true
    },
    refferedCode:{
        type:String
    },
    is_reffered:{
        type:Boolean,
        default:false
    },
    coupons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
        },
    ]
});

module.exports = mongoose.model('User', userSchema);
