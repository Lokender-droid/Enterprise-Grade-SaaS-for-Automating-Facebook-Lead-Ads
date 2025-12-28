const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const twoFactorController = require('../controllers/2faController');

router.post('/register', authController.register);
router.post('/register-invite', authController.registerFromInvite);
router.post('/login', authController.login);
router.put('/resetpassword/:resetToken', authController.resetPassword);
router.put('/profile', authController.protect, authController.updateProfile);

// Two-Factor Authentication Routes
router.post('/2fa/setup', authController.protect, twoFactorController.setup2FA);
router.post('/2fa/verify-setup', authController.protect, twoFactorController.verify2FASetup);
router.post('/2fa/verify', twoFactorController.verify2FA); // No auth required (during login)
router.post('/2fa/send-otp', twoFactorController.resend2FAOTP);
router.post('/2fa/disable', authController.protect, twoFactorController.disable2FA);
router.post('/2fa/regenerate-backup', authController.protect, twoFactorController.regenerateBackupCodes);
router.get('/2fa/status', authController.protect, twoFactorController.get2FAStatus);

module.exports = router;

