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

    // Enterprise: White-Labeling
    customDomain: { type: String }, // e.g. leads.client.com
    domainVerified: { type: Boolean, default: false },

    // Enterprise: RBAC (Custom Roles)
    // Default roles are: admin, manager, agent. Here we define custom ones.
    customRoles: [{
        name: { type: String }, // e.g. "Junior Sales"
        permissions: [{ type: String }] // e.g. ["view_leads", "make_calls"] (No "delete_leads")
    }],

    // Enterprise: Usage & Limits
    ssoSettings: {
        provider: { type: String, enum: ['google', 'microsoft', 'none'], default: 'none' },
        enabled: { type: Boolean, default: false }
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

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Organization', OrganizationSchema);
