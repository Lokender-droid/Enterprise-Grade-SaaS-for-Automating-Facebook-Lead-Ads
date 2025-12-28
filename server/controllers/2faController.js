
// ============================================
// TWO-FACTOR AUTHENTICATION ENDPOINTS
// ============================================

// POST /auth/2fa/setup - Initialize 2FA setup
exports.setup2FA = async (req, res) => {
    try {
        const { method } = req.body; // 'totp', 'email', 'sms'
        const userId = req.user._id;
        const admin = await Admin.findById(userId);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (admin.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is already enabled' });
        }

        let setupData = {};

        if (method === 'totp') {
            // Generate TOTP secret
            const { secret, qrCode } = otpService.generateTOTPSecret(admin.email);

            // Generate QR code
            const qrCodeImage = await otpService.generateQRCode(qrCode);

            // Store secret temporarily (will be confirmed after verification)
            admin.totpSecret = secret; // TODO: Encrypt this
            await admin.save();

            setupData = {
                method: 'totp',
                qrCode: qrCodeImage,
                secret: secret, // Show once for manual entry
                message: 'Scan QR code with your authenticator app'
            };
        } else if (method === 'email') {
            // Send OTP to email
            await otpService.sendEmailOTP(admin.email, userId);

            setupData = {
                method: 'email',
                message: 'OTP sent to your email. Please verify to enable 2FA.'
            };
        } else if (method === 'sms') {
            if (!admin.phoneNumber) {
                return res.status(400).json({ message: 'Please add phone number first' });
            }

            // Send SMS OTP
            await otpService.sendSMSOTP(admin.phoneNumber, userId);

            setupData = {
                method: 'sms',
                message: 'OTP sent to your phone. Please verify to enable 2FA.'
            };
        } else {
            return res.status(400).json({ message: 'Invalid 2FA method' });
        }

        res.json(setupData);
    } catch (error) {
        logger.error('2FA Setup Error', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// POST /auth/2fa/verify-setup - Complete 2FA setup
exports.verify2FASetup = async (req, res) => {
    try {
        const { method, token } = req.body;
        const userId = req.user._id;
        const admin = await Admin.findById(userId);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        let isValid = false;

        if (method === 'totp') {
            isValid = otpService.verifyTOTP(admin.totpSecret, token);
        } else if (method === 'email' || method === 'sms') {
            const result = otpService.verifyOTP(userId, token, method);
            isValid = result.success;
        }

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Generate backup codes
        const { plainCodes, hashedCodes } = await otpService.generateBackupCodes();

        // Enable 2FA
        admin.twoFactorEnabled = true;
        admin.twoFactorMethod = method;
        admin.backupCodes = hashedCodes;
        await admin.save();

        // Log activity
        ActivityLog.create({
            organizationId: admin.organizationId,
            performedBy: admin._id,
            userName: admin.name || admin.email,
            action: 'ENABLE_2FA',
            details: { method },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(err => console.error('[AUDIT-LOG] Failed:', err));

        res.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes: plainCodes // Show once, user must save these
        });
    } catch (error) {
        logger.error('2FA Verification Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /auth/2fa/verify - Verify OTP during login
exports.verify2FA = async (req, res) => {
    try {
        const { email, token, useBackupCode } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || !admin.twoFactorEnabled) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        let isValid = false;

        if (useBackupCode) {
            // Verify backup code
            const result = await otpService.verifyBackupCode(token, admin.backupCodes);
            isValid = result.success;

            if (isValid) {
                // Remove used backup code
                admin.backupCodes.splice(result.usedIndex, 1);
                await admin.save();
            }
        } else {
            // Verify regular OTP
            if (admin.twoFactorMethod === 'totp') {
                isValid = otpService.verifyTOTP(admin.totpSecret, token);
            } else {
                const result = otpService.verifyOTP(admin._id, token, admin.twoFactorMethod);
                isValid = result.success;

                if (!isValid) {
                    return res.status(400).json({ message: result.message });
                }
            }
        }

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid verification code' });
        }

        // Update last login
        admin.lastLoginAt = new Date();
        await admin.save();

        // Log successful 2FA login
        ActivityLog.create({
            organizationId: admin.organizationId,
            performedBy: admin._id,
            userName: admin.name || admin.email,
            action: 'USER_LOGIN_2FA',
            details: { method: admin.twoFactorMethod, backupCodeUsed: useBackupCode },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(err => console.error('[AUDIT-LOG] Failed:', err));

        // Issue full JWT token
        res.json({
            _id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            organizationId: admin.organizationId,
            token: generateToken(admin._id)
        });
    } catch (error) {
        logger.error('2FA Verification Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /auth/2fa/send-otp - Resend OTP
exports.resend2FAOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || !admin.twoFactorEnabled) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        if (admin.twoFactorMethod === 'totp') {
            return res.status(400).json({ message: 'TOTP does not require OTP sending' });
        }

        if (admin.twoFactorMethod === 'email') {
            await otpService.sendEmailOTP(admin.email, admin._id);
        } else if (admin.twoFactorMethod === 'sms') {
            await otpService.sendSMSOTP(admin.phoneNumber, admin._id);
        }

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        logger.error('Resend OTP Error', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// POST /auth/2fa/disable - Disable 2FA
exports.disable2FA = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;
        const admin = await Admin.findById(userId);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password before disabling
        if (!await admin.matchPassword(password)) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        admin.twoFactorEnabled = false;
        admin.totpSecret = undefined;
        admin.backupCodes = [];
        await admin.save();

        // Log activity
        ActivityLog.create({
            organizationId: admin.organizationId,
            performedBy: admin._id,
            userName: admin.name || admin.email,
            action: 'DISABLE_2FA',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(err => console.error('[AUDIT-LOG] Failed:', err));

        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        logger.error('Disable 2FA Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /auth/2fa/regenerate-backup - Regenerate backup codes
exports.regenerateBackupCodes = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;
        const admin = await Admin.findById(userId);

        if (!admin || !admin.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is not enabled' });
        }

        // Verify password
        if (!await admin.matchPassword(password)) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate new backup codes
        const { plainCodes, hashedCodes } = await otpService.generateBackupCodes();
        admin.backupCodes = hashedCodes;
        await admin.save();

        res.json({
            message: 'Backup codes regenerated',
            backupCodes: plainCodes
        });
    } catch (error) {
        logger.error('Regenerate Backup Codes Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /auth/2fa/status - Get 2FA status
exports.get2FAStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const admin = await Admin.findById(userId);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            twoFactorEnabled: admin.twoFactorEnabled,
            twoFactorMethod: admin.twoFactorMethod,
            phoneNumber: admin.phoneNumber,
            phoneVerified: admin.phoneVerified,
            backupCodesRemaining: admin.backupCodes?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
