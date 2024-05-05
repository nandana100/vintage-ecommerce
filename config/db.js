const mongoose=require('mongoose')

const connectdb=function(){
   
    mongoose.connect("mongodb://127.0.0.1:27017/user_management");
}
module.exports= connectdb 
   
