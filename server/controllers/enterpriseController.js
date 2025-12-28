const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// --- AUDIT LOGS ---
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find({ organizationId: req.user.organizationId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

// --- NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ organizationId: req.user.organizationId })
            .sort({ createdAt: -1 })
            .limit(20);

        const unreadCount = await Notification.countDocuments({
            organizationId: req.user.organizationId,
            isRead: false
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { organizationId: req.user.organizationId, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications' });
    }
};
