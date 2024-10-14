const express = require("express");
const path = require("path");
const app = express();
const adminRoutes=require("./routes/admin")
const userRoutes=require("./routes/users")
const connectDB=require("./db/connectDB")
const bodyParser = require('body-parser')
const session=require("express-session")
const User=require('./model/userModel')
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();
const authRoutes = require('./routes/auth');
const noCache=require('nocache');
const flash = require('connect-flash');



require("dotenv").config()
// middlewares for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// //session for admin and user
app.use(session({
  secret:"SecretKey",
  resave:true,
  saveUninitialized:true
}))


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(noCache())

// static access
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));






app.use(flash());


// // Passport.js setup
app.use(passport.initialize());
app.use(passport.session()); 



// Passport Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, 
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
  callbackURL: 'http://localhost:3000/auth/google/callback' 
}, async (accessToken, refreshToken, profile, done) => {
  try {
    
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      
      let existingUser = await User.findOne({ email: profile.emails[0].value });

      if (existingUser) {
        
        return done(null, existingUser); 
      }

      
      user = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        password: "12345678" 
      });
      await user.save();
    }

    
    done(null, user);

  } catch (err) {
    console.error('Error during Google authentication:', err);
    return done(err, null); 
  }
}));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});


// // Routes
app.use(authRoutes);
app.use('/admin',adminRoutes)
app.use('/',userRoutes)

connectDB()
// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(500).render("500", { error: "Internal Server Error" }); 
});


app.use((req, res, next) => {
  res.status(404).render("404")

});



app.listen(process.env.PORT, () => {
    console.log(process.env.PORT);
    console.log("http://localhost:3000");
    
}
);
