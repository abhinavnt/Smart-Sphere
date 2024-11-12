const mongoose=require("mongoose")
require("dotenv").config();

const connectDB =async ()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGODB_URL)
        
        
        console.log(`MongoDB Connected SmartSphere`);
        
    }catch(error){
           console.log(error);
           process.exit(1)
           
    }
}

module.exports =connectDB; 