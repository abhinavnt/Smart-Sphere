const express = require('express');
const passport = require('passport');
const session = require("express-session")

const router = express.Router();

// Route to start Google OAuth process
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // Request profile and email from Google
}));

// Callback route that Google redirects to
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    let user=req.user
    if(user.isBlocked){
      res.redirect('/login?message=User is Blocked')
    }else{
      req.session.user=req.user
      res.redirect('/'); 
    }
   
  }
);



module.exports=router;