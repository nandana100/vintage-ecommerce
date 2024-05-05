const mongoose=require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/user_management");

 
 const express=require('express')



 const app=express();

 
 
 const userRoute=require("./routes/userRoute")

app.use('/',userRoute)
const adminRoute=require("./routes/adminRoute")

app.use('/admin',adminRoute)





 app.listen(5000,()=>{
    console.log("server is running")
 })
