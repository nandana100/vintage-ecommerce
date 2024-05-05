const mongoose = require('mongoose');
 
const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    totalPrice: {
        type: Number,
        default:0,
    },
    cancelledAmountAdded: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WalletHistory', walletSchema);
