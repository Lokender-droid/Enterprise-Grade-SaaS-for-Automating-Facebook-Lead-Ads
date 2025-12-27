const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');

// NOTE: To enable this:
// 1. Install dependencies: npm install passport passport-google-oauth20
// 2. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
// 3. Import this file in server.js: require('./config/passport-setup');
// 4. Initialize passport in server.js: app.use(passport.initialize());

/*
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    Admin.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, profile, done) => {
        // passport callback function
        // Check if user already exists in our db
        Admin.findOne({ email: profile.emails[0].value }).then((currentUser) => {
            if (currentUser) {
                // already have this user
                console.log('user is: ', currentUser);
                done(null, currentUser);
            } else {
                // if not, create user in DB
                // NOTE: In a real enterprise app, you might want to enforce that the Organization exists first
                // or have an invitation flow. For now, we might reject unknown emails.
                console.log('User not found. SSO Login failed for security.');
                done(new Error("User not registered in system"), null);
            }
        });
    })
);
*/
