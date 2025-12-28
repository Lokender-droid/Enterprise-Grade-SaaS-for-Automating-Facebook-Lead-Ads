const ActivityLog = require('../models/ActivityLog');

exports.logActivity = async (req, action, details = {}, entityType = null, entityId = null) => {
    try {
        if (!req.user) return; // Cannot log if no user context

        await ActivityLog.create({
            organizationId: req.user.organizationId,
            performedBy: req.user.id || req.user._id,
            userName: req.user.name,
            action,
            details,
            entityType,
            entityId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // Do not crash app if logging fails
    }
};
