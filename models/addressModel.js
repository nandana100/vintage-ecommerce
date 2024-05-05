const mongoose=require('mongoose')

const addressSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    
    country: {
        type: String,
        required: true,
    },
  
    });




module.exports = mongoose.model('Address', addressSchema);
