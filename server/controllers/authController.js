const Admin = require('../models/Admin');
const Organization = require('../models/Organization'); // Import Organization
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { sendResetEmail } = require('../services/emailService');
const otpService = require('../services/otpService');

const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, { expiresIn: '30d' });
};

// POST /auth/register
exports.register = async (req, res) => {
    const { companyName, name, email, password } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await Admin.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Create new Organization
        const organization = await Organization.create({
            name: companyName,
            email: email, // Contact email for org
            plan: 'free',
            isActive: true
        });

        // 3. Create Admin User linked to Org
        const admin = await Admin.create({
            name,
            email,
            password,
            organizationId: organization._id,
            role: 'admin' // First user is always admin
        });

        // 4. Return Token
        if (admin) {
            res.status(201).json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                organizationId: admin.organizationId,
                token: generateToken(admin._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        logger.error('Registration Error', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// POST /auth/register-invite
exports.registerFromInvite = async (req, res) => {
    const { token, name, password } = req.body;
    const Invitation = require('../models/Invitation'); // Lazy load

    try {
        const invitation = await Invitation.findOne({
            token,
            expiresAt: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired invitation' });
        }

        // Create User
        const admin = await Admin.create({
            name,
            email: invitation.email,
            password,
            organizationId: invitation.organizationId,
            role: invitation.role
        });

        // Delete Invitation
        await invitation.deleteOne();

        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            organizationId: admin.organizationId,
            token: generateToken(admin._id),
            message: 'Joined team successfully'
        });

    } catch (error) {
        logger.error('Invite Registration Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if it's the env-seeded super admin (immune to lockout for recovery)
        if (email === config.admin.email && password === config.admin.password) {
            return res.json({
                _id: 'super-admin',
                email: email,
                token: generateToken('super-admin')
            });
        }

        // Check DB Admin
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check Lockout
        if (admin.isLocked) {
            return res.status(423).json({
                message: 'Account is temporarily locked due to too many failed attempts. Please try again later.'
            });
        }

        // Check Password
        if (await admin.matchPassword(password)) {
            // Success: Reset attempts
            admin.loginAttempts = 0;
            admin.lockUntil = undefined;

            // Check if 2FA is enabled
            if (admin.twoFactorEnabled) {
                await admin.save();

                // Send OTP based on method
                if (admin.twoFactorMethod === 'email') {
                    await otpService.sendEmailOTP(admin.email, admin._id);
                } else if (admin.twoFactorMethod === 'sms') {
                    await otpService.sendSMSOTP(admin.phoneNumber, admin._id);
                }
                // For TOTP, user will use their authenticator app

                return res.json({
                    requires2FA: true,
                    twoFactorMethod: admin.twoFactorMethod,
                    email: admin.email, // Needed for 2FA verification endpoint
                    message: admin.twoFactorMethod === 'totp'
                        ? 'Enter code from your authenticator app'
                        : 'OTP sent successfully'
                });
            }

            // No 2FA - proceed with normal login
            await admin.save();

            // Log Activity
            ActivityLog.create({
                organizationId: admin.organizationId,
                performedBy: admin._id,
                userName: admin.name || admin.email,
                action: 'USER_LOGIN',
                entityType: 'Admin',
                entityId: admin._id,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            }).catch(err => console.error('[AUDIT-LOG] Failed:', err));

            res.json({
                _id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                organizationId: admin.organizationId, // Return Org ID
                token: generateToken(admin._id)
            });
        } else {
            // Fail: Increment attempts
            admin.loginAttempts += 1;

            // Lock if attempts >= 5
            if (admin.loginAttempts >= 5) {
                admin.lockUntil = Date.now() + 60 * 60 * 1000; // 1 Hour Lock
            }

            await admin.save();
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error('Login Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, config.jwtSecret);

            if (decoded.id === 'super-admin') {
                req.user = { id: 'super-admin', role: 'super_admin' };
                return next();
            }

            // Fetch user to attach full details including orgId if needed
            const user = await Admin.findById(decoded.id).select('-password');
            if (!user) {
                throw new Error('User not found');
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// POST /auth/forgotpassword
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'Email could not be sent' });
        }

        const resetToken = admin.getResetPasswordToken();

        await admin.save({ validateBeforeSave: false });

        // Create Reset URL (Frontend URL)
        // Adjust port if client is on 5173
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        try {
            await sendResetEmail(admin.email, resetUrl);
            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            admin.resetPasswordToken = undefined;
            admin.resetPasswordExpire = undefined;
            await admin.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        logger.error('Forgot Password Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /auth/resetpassword/:resetToken
exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        admin.password = req.body.password;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;
        // Also unlock account if it was locked
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;

        await admin.save();

        res.json({
            success: true,
            _id: admin._id,
            email: admin.email,
            token: generateToken(admin._id),
            message: 'Password reset successful'
        });

    } catch (error) {
        logger.error('Reset Password Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const user = await Admin.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                organizationId: updatedUser.organizationId,
                token: generateToken(updatedUser._id),
                message: 'Profile updated successfully'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Update Profile Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};
