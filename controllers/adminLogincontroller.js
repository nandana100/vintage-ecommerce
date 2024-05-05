const User = require('../models/userModel')


const bcrypt = require('bcrypt')
const Order = require("../models/orderModel")





const loadLogin = async (req, res) => {
    try {

        res.render('login');

    } catch (error) {
        console.log(error.message)
    }
};


const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login', { message: 'Email and password are incorrect' });
                } else {
                    req.session.admin_id = userData._id;
                    req.session.is_admin = true;
                    res.redirect('/admin/dashboard');

                }
            } else {
                res.render('login', { message: 'Email and password are incorrect' });
            }

        } else {
            res.render('login', { message: 'Email and password are incorrect' });
        }
    } catch (error) {
        console.log(error.message);
    }
};




const loadDashboard = async (req, res) => {
    try {
        let log = req.session.admin_id;

        const totalOrderAmount = await Order.aggregate([
            {
                $match: { status: 'Delivered' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalPrice' }
                }
            }
        ]);
console.log("totalOrderAmount:",totalOrderAmount)
        const overallOrderAmount = totalOrderAmount.length > 0 ? totalOrderAmount[0].totalAmount : 0;
         console.log("overallOrderAmount:",overallOrderAmount)
        const salesCount = await Order.countDocuments({ status: 'Delivered' });

        const adminData = await User.findOne({ _id: log });

        res.render('dashboard', { adminData, salesCount, overallOrderAmount }); // Pass overallOrderAmount to the rendering
    } catch (error) {
        console.log(error.message);
    }
};


const userList = async (req, res) => {
    try {
        const search = req.query.search;
        const currentPage = parseInt(req.query.page) 
        const perPage = 10; 

        let query = { is_admin: 0 };

        if (search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { mobile: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        
        const totalUsers = await User.countDocuments(query);

        const totalPages = Math.ceil(totalUsers / perPage);

        
        const usersDetails = await User.find(query)
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.render('userList', {
            users: usersDetails,
            currentPage: currentPage,
            totalPages: totalPages,
            search: search,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).redirect('/');
    }
};


const blockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: true } });
      
        res.redirect('/admin/userList');
    } catch (error) {
        console.log(error.message);
       
        res.redirect('/admin/userList');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: false } });
       
        res.redirect('/admin/userList');
    } catch (error) {
        console.log(error.message);
        
        res.redirect('/admin/userList');
    }
}
const logout = async(req,res) => {
    try {
        
        req.session.destroy()
        res.redirect('/admin/login')

    } catch (error) {
        console.log(error.message)
    }
}
module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    userList,
    blockUser,
    unblockUser,
    logout


}