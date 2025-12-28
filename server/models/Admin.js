const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
<<<<<<< HEAD
const encryptionService = require('../services/encryptionService');
=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth users
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'agent', 'super_admin'], default: 'agent' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Link user to an Org

    // OAuth Fields
    googleId: { type: String, sparse: true, unique: true },
    microsoftId: { type: String, sparse: true, unique: true },
    oauthProvider: { type: String, enum: ['email', 'google', 'microsoft'], default: 'email' },
    profilePicture: { type: String },
    emailVerified: { type: Boolean, default: false },
<<<<<<< HEAD

    // Two-Factor Authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['totp', 'email', 'sms'], default: 'email' },
    totpSecret: { type: String }, // Encrypted TOTP secret for authenticator apps
    backupCodes: [{ type: String }], // Has hed backup codes
    phoneNumber: { type: String }, // For SMS 2FA
    phoneVerified: { type: Boolean, default: false },

    // Security & Login Tracking
    lastLoginAt: { type: Date },
=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

// Hash password before saving (skip for OAuth users)
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

<<<<<<< HEAD
// Encrypt TOTP secret before saving
AdminSchema.pre('save', async function (next) {
    if (this.isModified('totpSecret') && this.totpSecret && !encryptionService.isEncrypted(this.totpSecret)) {
        try {
            this.totpSecret = encryptionService.encrypt(this.totpSecret);
        } catch (error) {
            console.error('Failed to encrypt totpSecret:', error);
        }
    }
    next();
});

// Decrypt TOTP secret after finding
AdminSchema.post('findOne', function (doc) {
    if (doc && doc.totpSecret && encryptionService.isEncrypted(doc.totpSecret)) {
        try {
            doc.totpSecret = encryptionService.decrypt(doc.totpSecret);
        } catch (error) {
            console.error('Failed to decrypt totpSecret:', error);
        }
    }
});

=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
// Method to match password
AdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

AdminSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Generate and hash password token
AdminSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    return resetToken;
};

module.exports = mongoose.model('Admin', AdminSchema);
