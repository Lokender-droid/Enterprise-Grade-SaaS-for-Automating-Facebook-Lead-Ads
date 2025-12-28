const mongoose = require('mongoose');

const SyncLogSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    crmType: { type: String, enum: ['salesforce', 'hubspot'], required: true },
    status: { type: String, enum: ['success', 'failed', 'partial'], required: true },
    recordsProcessed: { type: Number, default: 0 },
    recordsSuccess: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    errors: [{
        recordId: String,
        message: String
    }],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

SyncLogSchema.index({ organizationId: 1, startedAt: -1 });

module.exports = mongoose.model('SyncLog', SyncLogSchema);
