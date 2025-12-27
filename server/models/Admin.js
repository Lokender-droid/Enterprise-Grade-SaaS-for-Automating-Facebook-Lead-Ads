const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
