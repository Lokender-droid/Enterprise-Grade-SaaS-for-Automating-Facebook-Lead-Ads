const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // Optional action link
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

NotificationSchema.index({ organizationId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
