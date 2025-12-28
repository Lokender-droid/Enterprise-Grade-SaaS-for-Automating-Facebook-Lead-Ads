const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const bcrypt = require('bcryptjs');

/**
 * ADVANCED 2FA & OTP SERVICE
 * Enterprise-grade Two-Factor Authentication
 */

// Cache for temporary OTP storage (5 minute TTL)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Rate limiting cache (track attempts)
const rateLimitCache = new NodeCache({ stdTTL: 900 }); // 15 minutes

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Generate TOTP secret for authenticator apps
 */
exports.generateTOTPSecret = (userEmail) => {
    const secret = speakeasy.generateSecret({
        name: `MetaLead (${userEmail})`,
        length: 32,
        issuer: 'MetaLead Automation'
    });

    return {
        secret: secret.base32, // Store this encrypted in DB
        qrCode: secret.otpauth_url // Use for QR code generation
    };
};

/**
 * Generate QR code image for TOTP setup
 */
exports.generateQRCode = async (otpauthUrl) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
        return qrCodeDataURL; // Returns base64 image
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Verify TOTP token from authenticator app
 */
exports.verifyTOTP = (secret, token) => {
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after for clock skew
    });

    return verified;
};

/**
 * Generate 6-digit OTP for email/SMS
 */
function generateNumericOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via email
 */
exports.sendEmailOTP = async (email, userId) => {
    // Check rate limiting
    if (isRateLimited(userId)) {
        throw new Error('Too many OTP requests. Please wait 15 minutes.');
    }

    const otp = generateNumericOTP();
    const key = `email_otp_${userId}`;

    // Store OTP in cache
    otpCache.set(key, {
        code: otp,
        createdAt: Date.now(),
        attempts: 0
    });

    // Send email (integrate with your email service)
    const emailService = require('./emailService');
    await emailService.sendOTPEmail(email, otp);

    incrementRateLimit(userId);

    return {
        success: true,
        expiresIn: OTP_EXPIRY / 1000 // seconds
    };
};

/**
 * Send OTP via SMS
 */
exports.sendSMSOTP = async (phoneNumber, userId) => {
    // Check rate limiting
    if (isRateLimited(userId)) {
        throw new Error('Too many OTP requests. Please wait 15 minutes.');
    }

    const otp = generateNumericOTP();
    const key = `sms_otp_${userId}`;

    // Store OTP in cache
    otpCache.set(key, {
        code: otp,
        createdAt: Date.now(),
        attempts: 0
    });

    // Send SMS (Twilio integration)
    try {
        const twilioClient = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        await twilioClient.messages.create({
            body: `Your MetaLead verification code is: ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        incrementRateLimit(userId);

        return {
            success: true,
            expiresIn: OTP_EXPIRY / 1000
        };
    } catch (error) {
        console.error('SMS OTP error:', error);
        throw new Error('Failed to send SMS OTP');
    }
};

/**
 * Verify OTP (email or SMS)
 */
exports.verifyOTP = (userId, providedOTP, method = 'email') => {
    const key = `${method}_otp_${userId}`;
    const cached = otpCache.get(key);

    if (!cached) {
        return {
            success: false,
            message: 'OTP expired or not found'
        };
    }

    // Check expiration
    if (Date.now() - cached.createdAt > OTP_EXPIRY) {
        otpCache.del(key);
        return {
            success: false,
            message: 'OTP has expired'
        };
    }

    // Check attempts
    if (cached.attempts >= MAX_ATTEMPTS) {
        otpCache.del(key);
        return {
            success: false,
            message: 'Too many failed attempts. Request a new OTP.'
        };
    }

    // Verify OTP
    if (cached.code === providedOTP) {
        otpCache.del(key); // Remove after successful verification
        return {
            success: true,
            message: 'OTP verified successfully'
        };
    } else {
        // Increment attempts
        cached.attempts++;
        otpCache.set(key, cached);

        return {
            success: false,
            message: `Invalid OTP. ${MAX_ATTEMPTS - cached.attempts} attempts remaining.`
        };
    }
};

/**
 * Generate backup codes (one-time use)
 */
exports.generateBackupCodes = async (count = 10) => {
    const backupCodes = [];
    const hashedCodes = [];

    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        backupCodes.push(code);

        // Hash for storage
        const hashed = await bcrypt.hash(code, 10);
        hashedCodes.push(hashed);
    }

    return {
        plainCodes: backupCodes, // Show to user once
        hashedCodes: hashedCodes  // Store in database
    };
};

/**
 * Verify backup code
 */
exports.verifyBackupCode = async (providedCode, hashedCodes) => {
    for (let i = 0; i < hashedCodes.length; i++) {
        const isValid = await bcrypt.compare(providedCode.toUpperCase(), hashedCodes[i]);
        if (isValid) {
            return {
                success: true,
                usedIndex: i // Remove this code from database
            };
        }
    }

    return {
        success: false,
        message: 'Invalid backup code'
    };
};

/**
 * Rate limiting helpers
 */
function isRateLimited(userId) {
    const key = `rate_limit_${userId}`;
    const attempts = rateLimitCache.get(key) || 0;
    return attempts >= MAX_ATTEMPTS;
}

function incrementRateLimit(userId) {
    const key = `rate_limit_${userId}`;
    const current = rateLimitCache.get(key) || 0;
    rateLimitCache.set(key, current + 1);
}

/**
 * Clear rate limit (admin function)
 */
exports.clearRateLimit = (userId) => {
    rateLimitCache.del(`rate_limit_${userId}`);
};

/**
 * Get pending OTP info (for debugging/admin)
 */
exports.getOTPInfo = (userId, method = 'email') => {
    const key = `${method}_otp_${userId}`;
    const cached = otpCache.get(key);

    if (!cached) {
        return null;
    }

    return {
        expiresIn: Math.max(0, OTP_EXPIRY - (Date.now() - cached.createdAt)) / 1000,
        attemptsRemaining: MAX_ATTEMPTS - cached.attempts
    };
};

module.exports = exports;
