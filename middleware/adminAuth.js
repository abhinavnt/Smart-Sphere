//admin session check
const checkAdminSession=(req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/login')
    }
}


//check admin alredy loggined
const isAdminLoged=(req,res,next)=>{
    if(req.session.admin){
       res.redirect('/admin/dashboard')
    }else{
        next()
    }
}




module.exports={checkAdminSession,isAdminLoged}
