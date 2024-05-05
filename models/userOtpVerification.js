const mongoose=require('mongoose')

const userOtpVerificationSchema=new mongoose.Schema({
    userId:{
        type:String,
        required :true
    },
    otp:{
        type:String,
        required :true
    },
    createdAt:{
        type:String,
        required :true
    },
    expiresAt:{
        type:String,
        required :true
    }
})

module.exports=mongoose.model('userOtpVerification',userOtpVerificationSchema)