const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    // Field Definition
    fieldName: {
        type: String,
        required: true
    }, // e.g., "Industry", "Budget", "Decision Maker"

    fieldKey: {
        type: String,
        required: true
    }, // e.g., "industry", "budget", "decision_maker" (used in database)

    fieldType: {
        type: String,
        enum: ['text', 'number', 'date', 'dropdown', 'boolean', 'textarea', 'url', 'email'],
        required: true
    },

    // Dropdown Options (only for dropdown type)
    options: [{
        type: String
    }], // e.g., ["Manufacturing", "Technology", "Healthcare"]

    // Field Settings
    required: {
        type: Boolean,
        default: false
    },

    showInListView: {
        type: Boolean,
        default: false
    },

    showInDetailView: {
        type: Boolean,
        default: true
    },

    // Default Value
    defaultValue: {
        type: mongoose.Schema.Types.Mixed
    },

    // Validation
    validation: {
        min: { type: Number }, // For number fields
        max: { type: Number }, // For number fields
        pattern: { type: String }, // Regex pattern for text fields
        message: { type: String } // Custom validation message
    },

    // Display Order
    displayOrder: {
        type: Number,
        default: 0
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
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

// Compound index for organization + field key (unique per organization)
CustomFieldSchema.index({ organizationId: 1, fieldKey: 1 }, { unique: true });

module.exports = mongoose.model('CustomField', CustomFieldSchema);
