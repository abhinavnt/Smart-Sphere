const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

// Passport Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find user by Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Check if a user with the same email exists
        let existingUser = await User.findOne({ email: profile.emails[0].value });

        if (existingUser) {
          // If the user exists, log them in
          return done(null, existingUser);
        }

        // If no user exists, create a new one
        const randomPassword = crypto.randomBytes(8).toString('hex'); // Generate random password
        const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the password

        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
          password: hashedPassword // Store hashed password
        });

        await user.save();
      }

      // Continue the authentication process
      done(null, user);

    } catch (err) {
      console.error('Error during Google authentication:', err);
      return done(err, null);
    }
  })
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
    console.error('Error during deserialization:', err);
    done(err, null);
  }
});

// Export passport so it can be used as middleware
module.exports = passport;
