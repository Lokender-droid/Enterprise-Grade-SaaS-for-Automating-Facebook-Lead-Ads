const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    leadId: {
        type: mongoose.Schema.Types.ObjectId,
<<<<<<< HEAD
        ref: 'Lead'
=======
        ref: 'Lead',
        required: true
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    },

    // Activity Type
    type: {
        type: String,
        enum: [
            'lead_created',
            'lead_updated',
            'status_changed',
            'stage_changed',
            'assigned',
            'voice_call',
            'email_sent',
            'email_opened',
            'email_clicked',
            'whatsapp_sent',
            'task_created',
            'task_completed',
            'note_added',
            'ai_processed',
            'field_updated',
            'crm_synced'
        ],
        required: true
    },

    // Activity Details
    title: {
        type: String,
        required: true
    }, // e.g., "Lead created", "Voice call completed"

    description: {
        type: String
    }, // Detailed description

    // Actor (who performed the action)
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }, // null for system actions

    performedByType: {
        type: String,
        enum: ['user', 'system', 'ai'],
        default: 'system'
    },

    // Metadata (flexible data storage)
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    // Examples:
    // - Voice call: { duration: 180, status: 'completed', transcript: '...' }
    // - Email: { subject: '...', opened: true, clicked: false }
    // - Stage change: { from: 'New', to: 'Contacted' }
    // - Field update: { field: 'budget', oldValue: '50k', newValue: '100k' }

    // Related Objects
    relatedTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },

    relatedNoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    },

    // Visibility
    isVisible: {
        type: Boolean,
        default: true
    }, // Hide certain system activities

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false }); // No updatedAt for activities (immutable)

// Indexes
ActivitySchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ performedBy: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
