const router = require('express').Router();
const passport = require('passport');
const { generateToken } = require('../controllers/authController'); // Assuming you export this or duplicate logic

// NOTE: To enable, mount this router in server.js: app.use('/auth', ssoRoutes);

/*
// Auth with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback route for Google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    // User is now logged in (req.user)
    // Generate JWT
    const token = generateToken(req.user._id);
    
    // Redirect to Frontend with Token
    // In production, send via HTTPOnly cookie or a temporary code
    res.redirect(`http://localhost:5173/login?token=${token}`);
});
*/

module.exports = router;
