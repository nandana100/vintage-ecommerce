
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

        if (userData) {

            if (userData.is_verified === 0) {
                res.render('forget', { message: 'Please verify your mail' })
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
            from: 'ssameen584@gmail.com',
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



const changePasswordLoad = async (req, res) => {
    try {
        const token = req.query.token
        const tokenData = await User.findOne({ token: token })
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