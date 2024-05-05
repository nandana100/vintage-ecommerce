const Order = require('../models/orderModel');
const WalletHistory = require("../models/walletModel");

const ITEMS_PER_PAGE = 3;
const loadWallet = async (req, res) => {
    try {
        const log = req.session.user_id;
        
        const totalItems = await Order.countDocuments({ userId: log });
        
        const page = +req.query.page || 1;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        
        const orderData = await Order.find({ userId: log })
                                     .sort({ createdAt: -1 }) 
                                     .skip(startIndex)
                                     .limit(ITEMS_PER_PAGE)
                                     .lean();
                                     
        
        const wallet = await WalletHistory.findOne({ userId: log }).lean();

        res.render('wallet', { log, orderData, wallet, totalPages, currentPage: page });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    loadWallet
};
