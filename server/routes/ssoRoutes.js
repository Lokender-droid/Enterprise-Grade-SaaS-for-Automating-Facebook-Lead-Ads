const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '30d' });
};

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth Callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${config.clientUrl}/login?error=oauth_failed`,
        session: false
    }),
    (req, res) => {
        try {
            // User is authenticated (req.user)
            const token = generateToken(req.user._id);

            // Redirect to frontend with token
            res.redirect(`${config.clientUrl}/oauth/callback?token=${token}&provider=google`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${config.clientUrl}/login?error=server_error`);
        }
    }
);

// ============================================
// MICROSOFT OAUTH ROUTES
// ============================================

// Initiate Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft', {
    scope: ['user.read']
}));

// Microsoft OAuth Callback
router.get('/microsoft/callback',
    passport.authenticate('microsoft', {
        failureRedirect: `${config.clientUrl}/login?error=oauth_failed`,
        session: false
    }),
    (req, res) => {
        try {
            // User is authenticated (req.user)
            const token = generateToken(req.user._id);

            // Redirect to frontend with token
            res.redirect(`${config.clientUrl}/oauth/callback?token=${token}&provider=microsoft`);
        } catch (error) {
            console.error('Microsoft callback error:', error);
            res.redirect(`${config.clientUrl}/login?error=server_error`);
        }
    }
);

module.exports = router;
