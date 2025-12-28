const mongoose = require('mongoose');
const encryptionService = require('../services/encryptionService');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Contact email for the org

    // API Keys (Encrypted/Stored securely in real prod, but plain for MVP)
    sendgridApiKey: { type: String },
    fromEmail: { type: String },

    metaAccessToken: { type: String },
    whatsappPhoneId: { type: String },
    pageId: { type: String }, // To identify which org a webhook belongs to

    // Enterprise: White-Labeling
    customDomain: { type: String }, // e.g. leads.client.com
    domainVerified: { type: Boolean, default: false },

    // Enterprise: RBAC (Custom Roles)
    // Default roles are: admin, manager, agent. Here we define custom ones.
    customRoles: [{
        name: { type: String }, // e.g. "Junior Sales"
        permissions: [{ type: String }] // e.g. ["view_leads", "make_calls"] (No "delete_leads")
    }],

    // Enterprise: SSO Configuration (UI Managed)
    ssoSettings: {
        provider: { type: String, enum: ['google', 'microsoft', 'none'], default: 'none' },
        enabled: { type: Boolean, default: false },

        // Google OAuth Credentials
        googleClientId: { type: String },
        googleClientSecret: { type: String },
        googleCallbackUrl: { type: String, default: 'http://localhost:4000/auth/google/callback' },
        googleEnabled: { type: Boolean, default: false },

        // Microsoft OAuth Credentials
        microsoftClientId: { type: String },
        microsoftClientSecret: { type: String },
        microsoftCallbackUrl: { type: String, default: 'http://localhost:4000/auth/microsoft/callback' },
        microsoftEnabled: { type: Boolean, default: false }
    },
    integrations: {
        salesforce: { connected: { type: Boolean, default: false }, lastSync: Date },
        hubspot: { connected: { type: Boolean, default: false }, lastSync: Date }
    },

    // Advanced AI Keys
    vapiPrivateKey: { type: String },
    vapiPublicKey: { type: String },
    vapiAssistantId: { type: String },
    vapiPhoneNumber: { type: String }, // The Twilio/Vapi number to call FROM
    openaiApiKey: { type: String },

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

    // Feature Flags (Activation Control)
    features: {
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        aiStats: { type: Boolean, default: false }, // Scoring, Profiling
        voiceAgent: { type: Boolean, default: false }
    },

    // White-Label Domain Verification
    customDomain: { type: String },
    domainVerified: { type: Boolean, default: false },
    domainVerifiedAt: { type: Date },
    verificationToken: { type: String }, // For TXT record verification
    sslProvisioned: { type: Boolean, default: false },
    sslProvisioningStartedAt: { type: Date },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ============================================
// ENCRYPTION HOOKS
// ============================================

// Encrypt sensitive fields before saving
OrganizationSchema.pre('save', function (next) {
    const fields = ['metaAccessToken', 'sendgridApiKey', 'openaiApiKey', 'vapiPrivateKey', 'vapiPublicKey'];

    fields.forEach(field => {
        if (this.isModified(field) && this[field] && !encryptionService.isEncrypted(this[field])) {
            try {
                this[field] = encryptionService.encrypt(this[field]);
            } catch (error) {
                console.error(`Failed to encrypt ${field}:`, error);
            }
        }
    });

    next();
});

// Decrypt sensitive fields after finding
OrganizationSchema.post('find', function (docs) {
    if (!docs) return;

    const fields = ['metaAccessToken', 'sendgridApiKey', 'openaiApiKey', 'vapiPrivateKey', 'vapiPublicKey'];

    docs.forEach(doc => {
        fields.forEach(field => {
            if (doc[field] && encryptionService.isEncrypted(doc[field])) {
                try {
                    doc[field] = encryptionService.decrypt(doc[field]);
                } catch (error) {
                    console.error(`Failed to decrypt ${field}:`, error);
                }
            }
        });
    });
});

// Decrypt for findOne
OrganizationSchema.post('findOne', function (doc) {
    if (!doc) return;

    const fields = ['metaAccessToken', 'sendgridApiKey', 'openaiApiKey', 'vapiPrivateKey', 'vapiPublicKey'];

    fields.forEach(field => {
        if (doc[field] && encryptionService.isEncrypted(doc[field])) {
            try {
                doc[field] = encryptionService.decrypt(doc[field]);
            } catch (error) {
                console.error(`Failed to decrypt ${field}:`, error);
            }
        }
    });
});

module.exports = mongoose.model('Organization', OrganizationSchema);

