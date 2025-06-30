const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

// Passport Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://smart-sphere-8ss8.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          let existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          const randomPassword = crypto.randomBytes(8).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
          });

          await user.save();
        }

        done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
