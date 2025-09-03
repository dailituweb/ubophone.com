const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

// Configure Passport Google OAuth Strategy
const setupPassport = () => {
  try {
    // Check if we have Google OAuth credentials
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
            passReqToCallback: true
          },
          async (req, accessToken, refreshToken, profile, done) => {
            try {
              // Check if user already exists with this Google ID
              let user = await User.findOne({ where: { googleId: profile.id } });
              
              if (user) {
                // User exists, update profile information if needed
                await user.update({
                  lastLogin: new Date(),
                  profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                });
                return done(null, user);
              }
              
              // Check if user exists with the same email
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
              if (email) {
                user = await User.findOne({ where: { email } });
                
                if (user) {
                  // Link existing account with Google
                  await user.update({
                    googleId: profile.id,
                    lastLogin: new Date(),
                    profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                  });
                  return done(null, user);
                }
              }
              
              // Create new user
              if (email) {
                const newUser = await User.create({
                  username: profile.displayName || email.split('@')[0],
                  email: email,
                  googleId: profile.id,
                  firstName: profile.name ? profile.name.givenName : null,
                  lastName: profile.name ? profile.name.familyName : null,
                  profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                  balance: 0.00, // No welcome credits
                  lastLogin: new Date()
                });
                
                return done(null, newUser);
              }
              
              // Cannot create user without email
              return done(null, false, { message: 'Google account does not have a valid email' });
            } catch (error) {
              console.error('Error in Google authentication:', error);
              return done(error);
            }
          }
        )
      );
      
      console.log('Google OAuth strategy configured');
    } else {
      console.log('Google OAuth credentials not configured');
    }
    
    // Serialize and deserialize user
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findByPk(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
    
  } catch (error) {
    console.error('Error configuring passport:', error);
  }
};

// Initialize passport on module load
setupPassport();

module.exports = passport; 