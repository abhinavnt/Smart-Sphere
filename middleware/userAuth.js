const userSchema= require("../model/userModel")



//User session check login
const checkUserSession=async (req,res,next)=>{
    const userId= req.session.user ? req.session.user._id : null
    
    const isBlocked= await userSchema.findById(userId)
    
    if(req.session.user && !isBlocked.isBlocked ){
        next()
    }else{
        res.redirect('/login')
    }
}

 
//check is user logged
const isUserLogged= async (req,res,next)=>{
    const userId= req.session.user ? req.session.user._id : null
    
    const isBlocked= await userSchema.findById(userId)

    if(req.session.user && !isBlocked.isBlocked){
        res.redirect('/')
    }else{
       next() 
    }
}


//check user sign up
const isUserSignuped=(req,res)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        next()
    }
}


module.exports={checkUserSession,isUserLogged}