const mongoose = require('mongoose');

const DealStageSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    // Stage Details
    name: {
        type: String,
        required: true
    }, // e.g., "New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"

    key: {
        type: String,
        required: true
    }, // e.g., "new_lead", "contacted", "qualified" (used in code)

    // Display
    color: {
        type: String,
        default: '#6B7280'
    }, // Hex color code

    icon: {
        type: String
    }, // Icon name or emoji

    // Order
    displayOrder: {
        type: Number,
        required: true
    }, // 0, 1, 2, 3... (determines column order in Kanban)

    // Probability (for revenue forecasting)
    probability: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }, // 0-100% (e.g., "Qualified" = 30%, "Proposal" = 60%, "Won" = 100%)

    // Stage Type
    stageType: {
        type: String,
        enum: ['active', 'won', 'lost'],
        default: 'active'
    },

    // Auto-actions when lead enters this stage
    autoActions: {
        sendEmail: {
            enabled: { type: Boolean, default: false },
            templateId: { type: String }
        },
        createTask: {
            enabled: { type: Boolean, default: false },
            taskTitle: { type: String },
            taskType: { type: String },
            dueInDays: { type: Number }
        },
        triggerWebhook: {
            enabled: { type: Boolean, default: false },
            webhookUrl: { type: String }
        },
        assignTo: {
            enabled: { type: Boolean, default: false },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
        }
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    isDefault: {
        type: Boolean,
        default: false
    }, // Default stages (New, Won, Lost) cannot be deleted

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index for organization + key (unique per organization)
DealStageSchema.index({ organizationId: 1, key: 1 }, { unique: true });
DealStageSchema.index({ organizationId: 1, displayOrder: 1 });

module.exports = mongoose.model('DealStage', DealStageSchema);
