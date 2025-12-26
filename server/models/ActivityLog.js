const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    userName: { type: String }, // Store name snapshot
    action: { type: String, required: true }, // e.g., 'EXPORT_LEADS', 'UPDATE_SETTINGS'
    entityType: { type: String }, // e.g., 'Lead', 'Settings'
    entityId: { type: String },
    details: { type: Object }, // Store detailed info (diffs or metadata)
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast searching
ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
