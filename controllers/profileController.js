const User = require('../models/userModel');
const Order=require("../models/orderModel")


const bcrypt=require('bcrypt')

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const user = await User.findById(userId).populate('addresses').exec();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const addresses = user.addresses;

        const orderDetails = await Order.find({ userId: userId })
            .populate('products.product_id')
            .exec();


        res.render('profile', { user, userId, addresses, orderDetails});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const addAddressProfile = async (req, res) => {
    try {
        const userId = req.body.user_id;
        console.log('User ID from request:', userId); 
        const { newAddress, city, state, pincode, country } = req.body;

        const updateUser = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    addresses: {
                        address: newAddress,
                        city: city,
                        state: state,
                        pincode: pincode,
                        country: country,
                    },
                },
            },
            { new: true }
        );

        console.log('Updated User:', updateUser); 

        if (!updateUser) {
            return res.json({ success: false, message: 'User not found' });
        }

       res.redirect('/profileLoad'); 
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error adding address' });
    }
};


const editProfileLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userId = req.session.user_id;

        if (!id) {
            return res.redirect('/profileLoad');
        }

        const userData = await User.findById(id);

        if (userData) {
            res.render('edit-user', { user: userData, userId });
        } else {
            res.redirect('/profileLoad');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateProfileLoad = async (req, res) => {
    const userId = req.session.user_id;
    const { name, mobile, addresses, email } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                mobile,
                addresses: [{
                    address: addresses,
                    city: 'city',
                    state: 'state',
                    pincode: 'pincode',
                    country: 'country',
                }],
                email,
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
const orderDetails=await Order.find({userId:updatedUser._id}).populate('products.product_id')
        res.render("profile", { user: updatedUser,orderDetails, message: "User updated", userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const editAddressLoad = async (req, res) => {
    try {
       const userId=req.query.id;
       const addressId=req.query.addressId;
       if(!userId||!addressId){
        return res.redirect('profile')
       }
       const userData=await User.findOne({_id:userId})
       if(userData){
        const address=userData.addresses.find(addr=>addr._id.toString()===addressId)
        
        res.render('editAddress',{user:userData,address,userId})
       }else{
        res.redirect('/profile')
       }

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const updateAddress = async (req, res) => {
    const { userId, addressId, newAddress, city, state, country, pincode } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, "addresses._id": addressId },
            {
                $set: {
                    'addresses.$.address': newAddress,
                    'addresses.$.city': city,
                    'addresses.$.state': state,
                    'addresses.$.country': country,
                    'addresses.$.pincode': pincode,
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'user or address not found' });
        }

        res.redirect('/profileLoad');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const deleteAddress=async(req,res)=>{
    try {
        const userId = req.query.userId;
        const addressId = req.query.addressId;
        console.log("address:",addressId)

        const updatedUser = await User.findByIdAndUpdate(userId, {
            $pull: { addresses: { _id: addressId } },
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.redirect('/profileLoad'); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
const changePassword = async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        const user = await User.findById(req.session.user_id);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordMatch) {
            return res.json({ success: false, message: "Incorrect current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateData = await User.findByIdAndUpdate(
            req.session.user_id,
            { $set: { password: hashedPassword } },
            { new: true }
        );

        if (!updateData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    loadProfile,
    addAddressProfile,
    editProfileLoad,
    updateProfileLoad,
    editAddressLoad,
    deleteAddress,
    changePassword,
    updateAddress
};
