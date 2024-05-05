const User=require('../models/userModel');
const userOtpVerification=require('../models/userOtpVerification')
const bcrypt=require('bcrypt')
const WalletHistory=require("../models/walletModel")


const nodemailer=require('nodemailer')
const randomstring = require('randomstring')


require('dotenv').config()
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
})

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message)
    }
}
const sendVerifyMail = async (email, user_id, res) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString()


        const mailOptions = {
            from: 'jaaz9252@gmail.com',
            to: email,
            subject: 'For Verification',
            html: `<p>Enter ${otp} in the app to verify your email</p>`,
        }
        await userOtpVerification.deleteOne({ userId: user_id })
        const info = await transporter.sendMail(mailOptions);
        console.log("email has been sent ", info.response)

        const otpVerification = new userOtpVerification({
            userId: user_id,
            otp: otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60000),
        })
        await otpVerification.save()

    } catch (error) {
        console.log('error sending verification email', error)
        res.render('register', { message: "error sending verification mail" })
    }

}
const loadRegister = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async (req, res) => {
    try {
        console.log(req.body)
        const email = req.body.email;

        const generateReferalId = () => {
            const timestampPart = Date.now().toString().slice(-8);
            const randomPart = Math.floor(Math.random() * 100000000).toString().slice(0, 2);

            return timestampPart + randomPart;
        };


        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.render('register', { message: 'Email already exists. Please use a different email address.' });
        }

        const spassword = await securePassword(req.body.password);
        const refId = generateReferalId();

        const refCode = req.body.ref_code;
        let referrer = null;

        if (refCode) {
            referrer = await User.findOne({ referalCode: refCode });

            if (!referrer) {
                return res.render('signup', { message: 'Invalid referral code', exist: true });
            }
        }


        const user = new User({
            name: req.body.name,
            email: email,
            mobile: req.body.mobile,
            password: spassword,
            referalCode: refId,
            refferedCode: refCode,
            is_referred: referrer !== null,
            is_admin: 0,
        });
        console.log("user:", user)

        const userData = await user.save();
        console.log(userData)
        if (referrer) {
            const rewardAmount = 100;
            const creditTransaction = new WalletHistory({
                userId: referrer._id,
                amount: rewardAmount,
                type: 'credit',

            });

            await creditTransaction.save();
        }

        if (userData) {
            await sendVerifyMail(req.body.email, userData._id, res);
            res.redirect(`/verifyMail/${userData._id}`);
        } else {
            res.render('register', { message: 'Your registration has failed' });
        }
    } catch (error) {
        console.error(error.message);
        res.render('register', { message: 'Error during registration' });
    }
};


const verifyMail = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ _id: req.params.id }, { $set: { is_varified: 1 } })

        console.log(updateInfo)
        res.render('verifyMail', { userId: req.params.id })
    } catch (error) {
        console.log(error.msg)
    }
}






  
const resendOtp = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findOne({ _id: userId });
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      sendVerifyMail(user.email, userId, res);
      res.redirect(`/verifyMail/${userId}`);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal server error');
    }
  };

const verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const userOtps = await userOtpVerification.find({ userId: userId });

        if (userOtps.length > 0) {
            const validUserOtp = userOtps.find(userotp => userotp.otp === otp && new Date(userotp.expiresAt) > new Date());

            if (validUserOtp) {
                await User.updateOne({ _id: userId }, { $set: { is_varified: 1 } });
                return res.json({ success: true, redirectTo: '/login' })            } else {
                
                    return res.status(400).json({ success: false, message: 'Invalid or expired OTP, please try again' });            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP, please try again' });        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'An error occurred' });    }
};


const loginLoad = async(req,res)=>{

    try {

        res.render('login')
        
    } catch (error) {
        console.log(error.message) 
    }

}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_varified === 1) {
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                } else {
                    res.render('login', { message: "Please verify your email to log in" });
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


const forgetLoad = async (req, res) => {

    try {

        res.render('forgetLoad', { message: "" })

    } catch (error) {
        console.log(error.message)
    }

}

const forgetVerify = async (req, res) => {

    try {

        const email = req.body.email
        const userData = await User.findOne({ email: email })
        console.log("userData:",userData)

        if (userData) {

            if (userData.is_varified === 0) {
                res.render('forgetLoad', { message: 'Please verify your mail' })
            } else {
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
                sendResetPasswordMail(userData.email, userData._id, randomString)
                res.render('forgetLoad', { message: 'Please check your mail to reset your password' })
            }
        } else {
            res.render('forgetLoad', { message: 'email is incorrect' })
        }

    } catch (error) {
        console.log(error.message)
    }

}

const sendResetPasswordMail = async (email, user_id, token) => {

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS  //You should provide your password here
            }
        })

        const mailOptions = {
            from: 'jaaz9252@gmail.com',
            to: email,
            subject: 'For Verification',
            html: `<p>Click the link <a href="http://127.0.0.1:5000/changePassword?token=${token}">here</a></p>`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email has been sent to :', info.response)
            }
        })
    } catch (error) {

    }

}

// changepassword

const changePasswordLoad = async (req, res) => {
    try {
        const token = req.query.token
        console.log("token:",token)
        const tokenData = await User.findOne({ token: token })
        console.log("tokenData:",tokenData)

        if (tokenData) {

            res.render('changePassword', { user_id: tokenData._id })

        } else {

            res.render('404', { message: 'token is invalid' })

        }

    } catch (error) {
        console.log(error.message)
    }
}

const resetPassword = async (req, res) => {

    try {

        const password = req.body.password
        const user_id = req.body.user_id
        const secure_password = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } })
        res.redirect('/')

    } catch (error) {
        console.log(error.message)
    }

}



const loadHome = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id);
        if (user) {
            if (user.is_blocked) {
                res.render('login', { message: 'Your account is blocked.' });
            }else {
                res.render('home');
            }
        } else {
            res.render('login', { message: 'User not found. Please log in again.' });
        }
    } catch (error) {
        console.log(error.message);
        res.render('login', { message: 'Error loading home page.' });
    }
}
const userLogout=async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
 }
module.exports={
    loadRegister,
    insertUser,
    securePassword,
    verifyLogin,
    loginLoad,
    verifyMail,
    resendOtp,
    verifyOtp,
    forgetLoad,
    forgetVerify,
    changePasswordLoad,
    resetPassword,
    loadHome,
    userLogout
}