const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to log user actions to the audit trail
 */
const logAction = (action, entityType = null) => {
    return async (req, res, next) => {
        // Store original json to intercept response
        const originalJson = res.json;

        res.json = function (data) {
            // Only log if request was successful (status < 400)
            if (res.statusCode < 400 && req.user) {
                ActivityLog.create({
                    organizationId: req.user.organizationId,
                    performedBy: req.user.id,
                    userName: req.user.name || req.user.email,
                    action: action,
                    entityType: entityType,
                    entityId: req.params.id || data._id || null,
                    details: {
                        method: req.method,
                        path: req.path,
                        body: sanitizeBody(req.body)
                    },
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent')
                }).catch(err => console.error('[AUDIT-LOG-ERROR]', err));
            }

            // Call original json
            originalJson.call(this, data);
        };

        next();
    };
};

// Remove sensitive data from logs
function sanitizeBody(body) {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'accessToken'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) sanitized[field] = '***REDACTED***';
    });
    return sanitized;
}

module.exports = { logAction };
