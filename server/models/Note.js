const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
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

    // Note Content
    content: {
        type: String,
        required: true
    },

    // Author
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },

    // Mentions (@username)
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }],

    // Note Type
    type: {
        type: String,
        enum: ['general', 'call-log', 'meeting-notes', 'email-log', 'internal'],
        default: 'general'
    },

    // Visibility
    isPrivate: {
        type: Boolean,
        default: false
    }, // Private notes only visible to creator

    // Attachments
    attachments: [{
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        fileSize: { type: Number }
    }],

    // Pinned
    isPinned: {
        type: Boolean,
        default: false
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
NoteSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });
NoteSchema.index({ mentions: 1 });

module.exports = mongoose.model('Note', NoteSchema);
