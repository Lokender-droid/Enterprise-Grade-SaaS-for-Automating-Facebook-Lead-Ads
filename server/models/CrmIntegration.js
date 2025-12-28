const mongoose = require('mongoose');

const CrmIntegrationSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },

    // Salesforce Settings
    salesforce: {
        enabled: { type: Boolean, default: false },
        instanceUrl: { type: String },
        accessToken: { type: String }, // Encrypted in real app
        refreshToken: { type: String },
        lastSync: { type: Date },
        syncDirection: { type: String, enum: ['one-way-out', 'one-way-in', 'bidirectional'], default: 'one-way-out' }
    },

    // HubSpot Settings
    hubspot: {
        enabled: { type: Boolean, default: false },
        portalId: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        lastSync: { type: Date },
        syncDirection: { type: String, enum: ['one-way-out', 'one-way-in', 'bidirectional'], default: 'one-way-out' }
    },

    // Field Mapping (Simplified)
    fieldMapping: {
        type: Map,
        of: String // Key: Local Field, Value: Remote Field (e.g. "email": "Email")
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CrmIntegration', CrmIntegrationSchema);
