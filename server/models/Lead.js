const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    fb_lead_id: { type: String, required: true, unique: true },
    page_id: { type: String },
    form_id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    raw: { type: Object }, // Store full raw data from FB
    emailStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }, // pending, sent, failed
    whatsappStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }, // pending, sent, failed
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Interested', 'Converted', 'Lost'],
        default: 'New'
    },
    // AI Predictive Scoring
    leadScore: { type: Number, default: 0 },
    scoreReason: { type: String, default: 'Pending analysis...' },

    // Voice Agent Status
    voiceCallStatus: { type: String, enum: ['pending', 'triggered', 'in-progress', 'completed', 'failed', 'no-answer'], default: 'pending' },
    callId: { type: String },
    callTranscript: { type: String },
    callRecordingUrl: { type: String },

    // Advanced Intelligence (Spy Bot & Profiling)
    competitors: { type: Array, default: [] }, // [{ name, gap_analysis, battlecard_point }]
    salesBattlecard: { type: String }, // Markdown summary

    discProfile: { type: Object }, // { type: 'D', characteristics: [], communication_style: '' }

    // Revenue Prediction
    companyInfo: { type: Object }, // { size, industry, tech_stack }
    predictedRevenue: { type: Number }, // Estimated Value

    // Deal Pipeline
    dealStage: {
        type: String,
        default: 'new'
    }, // References DealStage.key
    dealValue: {
        type: Number,
        default: 0
    }, // Estimated deal value
    probability: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }, // Win probability (%)
    expectedCloseDate: {
        type: Date
    },

    // Custom Fields (Dynamic)
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }, // Stores custom field values { fieldKey: value }

    // CRM Sync Tracking
    crmSync: {
        salesforce: {
            synced: { type: Boolean, default: false },
            salesforceId: String,  // Salesforce Lead/Contact ID
            lastSyncedAt: Date,
            syncStatus: {
                type: String,
                enum: ['pending', 'synced', 'error'],
                default: 'pending'
            },
            syncError: String
        },
        hubspot: {
            synced: { type: Boolean, default: false },
            hubspotId: String,  // HubSpot Contact ID
            lastSyncedAt: Date,
            syncStatus: {
                type: String,
                enum: ['pending', 'synced', 'error'],
                default: 'pending'
            },
            syncError: String
        }
    },

    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Segregate data by Org
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
LeadSchema.index({ organizationId: 1, dealStage: 1 });
LeadSchema.index({ organizationId: 1, assignedTo: 1 });
LeadSchema.index({ organizationId: 1, createdAt: -1 });
LeadSchema.index({ 'crmSync.salesforce.salesforceId': 1 });
LeadSchema.index({ 'crmSync.hubspot.hubspotId': 1 });


module.exports = mongoose.model('Lead', LeadSchema);
