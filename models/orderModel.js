const mongoose= require('mongoose')
const orderSchema= new mongoose.Schema({
    userId:{
        type:String,
        required:true,
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
            },
          
        },
    ],
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    addresses: {
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
       
    },
    totalPrice:{
        type:Number,
        required:true,
    },
    paymentMethod:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:'pending'
    },
    returned: {
        type: Boolean,
        default: false,
    },
   
    orderPlacedAt: {
        type: Date,
        default: Date.now
    },
    is_cancelled :{
      type:Boolean,
      default:false
    },
    
    appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,
    },
   
});

module.exports=mongoose.model('Order',orderSchema);