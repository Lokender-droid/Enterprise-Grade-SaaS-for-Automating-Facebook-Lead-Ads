const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },

    // Task Details
    title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    // Task Type
    type: {
        type: String,
        enum: ['call', 'email', 'meeting', 'follow-up', 'research', 'other'],
        default: 'other'
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },

    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },

    // Dates
    dueDate: {
        type: Date
    },

    completedAt: {
        type: Date
    },

    // Reminder
    reminder: {
        enabled: { type: Boolean, default: false },
        reminderDate: { type: Date },
        reminderSent: { type: Boolean, default: false }
    },

    // Notes
    notes: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
TaskSchema.index({ organizationId: 1, leadId: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);
