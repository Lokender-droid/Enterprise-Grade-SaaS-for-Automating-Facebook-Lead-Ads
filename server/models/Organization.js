const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Contact email for the org

    // API Keys (Encrypted/Stored securely in real prod, but plain for MVP)
    sendgridApiKey: { type: String },
    fromEmail: { type: String },

    metaAccessToken: { type: String },
    whatsappPhoneId: { type: String },
    pageId: { type: String }, // To identify which org a webhook belongs to

    // Stripe Payment Details
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: { type: String, default: 'active' }, // active, past_due, canceled, incomplete
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Organization', OrganizationSchema);
