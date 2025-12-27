const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');
const config = require('../config');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await Admin.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ============================================
// DYNAMIC OAUTH STRATEGY CONFIGURATION
// ============================================
// This function dynamically configures OAuth strategies based on database settings
// Allows admins to enable/disable OAuth from UI without code changes

async function configureDynamicOAuth() {
    try {
        // Get first organization's SSO settings
        const org = await Organization.findOne();

        if (!org || !org.ssoSettings) {
            console.log('⚠️  No organization found or SSO settings not configured');
            return;
        }

        const sso = org.ssoSettings;

        // ============================================
        // GOOGLE OAUTH STRATEGY (Dynamic)
        // ============================================
        if (sso.googleEnabled && sso.googleClientId && sso.googleClientSecret) {
            passport.use(new GoogleStrategy({
                clientID: sso.googleClientId,
                clientSecret: sso.googleClientSecret,
                callbackURL: sso.googleCallbackUrl || 'http://localhost:4000/auth/google/callback',
                passReqToCallback: true
            },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        console.log('Google OAuth Profile:', profile);

                        const email = profile.emails[0].value;
                        const googleId = profile.id;
                        const displayName = profile.displayName;
                        const profilePicture = profile.photos[0]?.value;

                        // Check if user already exists
                        let user = await Admin.findOne({ email });

                        if (user) {
                            // User exists - link Google account if not already linked
                            if (!user.googleId) {
                                user.googleId = googleId;
                                user.profilePicture = user.profilePicture || profilePicture;
                                user.emailVerified = true;
                                await user.save();
                                console.log('✅ Linked Google account to existing user:', email);
                            }
                            return done(null, user);
                        }

                        // New user - create account
                        let organization = await Organization.findOne();
                        if (!organization) {
                            organization = await Organization.create({
                                name: `${displayName}'s Organization`,
                                plan: 'free',
                                subscriptionStatus: 'active'
                            });
                            console.log('✅ Created new organization:', organization.name);
                        }

                        // Create new user
                        user = await Admin.create({
                            email,
                            name: displayName,
                            googleId,
                            profilePicture,
                            emailVerified: true,
                            organizationId: organization._id,
                            role: 'admin',
                            oauthProvider: 'google'
                        });

                        console.log('✅ Created new user via Google OAuth:', email);
                        return done(null, user);

                    } catch (error) {
                        console.error('Google OAuth Error:', error);
                        return done(error, null);
                    }
                }));

            console.log('✅ Google OAuth Strategy configured (from database)');
        } else {
            console.log('⚠️  Google OAuth disabled or not configured in database');
        }

        // ============================================
        // MICROSOFT OAUTH STRATEGY (Dynamic)
        // ============================================
        if (sso.microsoftEnabled && sso.microsoftClientId && sso.microsoftClientSecret) {
            passport.use(new MicrosoftStrategy({
                clientID: sso.microsoftClientId,
                clientSecret: sso.microsoftClientSecret,
                callbackURL: sso.microsoftCallbackUrl || 'http://localhost:4000/auth/microsoft/callback',
                scope: ['user.read'],
                passReqToCallback: true
            },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        console.log('Microsoft OAuth Profile:', profile);

                        const email = profile.emails[0].value;
                        const microsoftId = profile.id;
                        const displayName = profile.displayName;

                        // Check if user already exists
                        let user = await Admin.findOne({ email });

                        if (user) {
                            // User exists - link Microsoft account if not already linked
                            if (!user.microsoftId) {
                                user.microsoftId = microsoftId;
                                user.emailVerified = true;
                                await user.save();
                                console.log('✅ Linked Microsoft account to existing user:', email);
                            }
                            return done(null, user);
                        }

                        // New user - create account
                        let organization = await Organization.findOne();
                        if (!organization) {
                            organization = await Organization.create({
                                name: `${displayName}'s Organization`,
                                plan: 'free',
                                subscriptionStatus: 'active'
                            });
                            console.log('✅ Created new organization:', organization.name);
                        }

                        // Create new user
                        user = await Admin.create({
                            email,
                            name: displayName,
                            microsoftId,
                            emailVerified: true,
                            organizationId: organization._id,
                            role: 'admin',
                            oauthProvider: 'microsoft'
                        });

                        console.log('✅ Created new user via Microsoft OAuth:', email);
                        return done(null, user);

                    } catch (error) {
                        console.error('Microsoft OAuth Error:', error);
                        return done(error, null);
                    }
                }));

            console.log('✅ Microsoft OAuth Strategy configured (from database)');
        } else {
            console.log('⚠️  Microsoft OAuth disabled or not configured in database');
        }

    } catch (error) {
        console.error('Error configuring dynamic OAuth:', error);
    }
}

// Configure OAuth on startup
configureDynamicOAuth();

// Export function to reconfigure OAuth (call after settings update)
passport.reconfigureOAuth = configureDynamicOAuth;

module.exports = passport;
