const Notification = require('../models/Notification');
// IO instance passed as argument to avoid circular dependency

class NotificationService {
    /**
     * Create a notification
     */
    async createNotification(data, ioInstance = null) {
        try {
            const notification = await Notification.create({
                organizationId: data.organizationId,
                recipient: data.recipient,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedId: data.relatedId,
                relatedModel: data.relatedModel
            });

            // Real-time emission if IO is provided
            // In a real app, we'd have a user-socket map. 
            // For now, we can emit to a room 'user:userId'
            if (ioInstance) {
                ioInstance.to(`user:${data.recipient}`).emit('notification', notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            // Don't throw, notifications shouldn't break the main flow
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(organizationId, userId, limit = 50) {
        try {
            return await Notification.find({ organizationId, recipient: userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }

    /**
     * Mark as read
     */
    async markAsRead(organizationId, notificationId, userId) {
        try {
            const notification = await Notification.findOne({
                _id: notificationId,
                organizationId,
                recipient: userId
            });

            if (notification) {
                notification.isRead = true;
                await notification.save();
            }

            return notification;
        } catch (error) {
            console.error('Error marking notification read:', error);
            throw error;
        }
    }

    /**
     * Mark ALL as read
     */
    async markAllAsRead(organizationId, userId) {
        try {
            await Notification.updateMany(
                { organizationId, recipient: userId, isRead: false },
                { $set: { isRead: true } }
            );
            return { success: true };
        } catch (error) {
            console.error('Error marking all notifications read:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
