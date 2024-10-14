//User session check login
const checkUserSession=(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/login')
    }
}


//check is user logged
const isUserLogged=(req,res,next)=>{
    if(req.session.user){
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