const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/register-invite', authController.registerFromInvite);
router.post('/login', authController.login);
router.put('/resetpassword/:resetToken', authController.resetPassword);
router.put('/profile', authController.protect, authController.updateProfile);

module.exports = router;
