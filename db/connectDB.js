const mongoose=require("mongoose")

const connectDB=async ()=>{
    try{
        const connect=await mongoose.connect('mongodb://localhost:27017/SmartSphere',{})
        console.log(`mongodb connected ${connect.connection.host}`);
        
    }catch(error){
           console.log(error);
           process.exit(1)
           
    }
}

module.exports =connectDB; 