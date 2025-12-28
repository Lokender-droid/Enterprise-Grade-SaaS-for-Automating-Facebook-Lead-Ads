const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
<<<<<<< HEAD
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // User specific
    type: {
        type: String,
        enum: ['lead_assigned', 'task_assigned', 'task_due', 'mention', 'system_alert', 'import_completed', 'info', 'success', 'warning', 'error'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of lead, task, note, etc.
    relatedModel: { type: String, enum: ['Lead', 'Task', 'Note'] },
    link: { type: String }, // Optional direct link
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index for getting user's notifications quickly
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ organizationId: 1 });
=======
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
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19

module.exports = mongoose.model('Notification', NotificationSchema);
