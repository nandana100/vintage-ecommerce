const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  expiry:{
    type:Date,
    required:true
},
  minimumPurchase: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'percentage', // Adjust the default value based on your needs
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming there is a User model, update accordingly
    },
  ],
  appliedDate: {
    type: Date,
    default: Date.now, // This sets the default value to the current date and time
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Assuming there is a Product model, update accordingly
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
