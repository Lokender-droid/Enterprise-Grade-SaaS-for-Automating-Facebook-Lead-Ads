const Activity = require('../models/Activity');

class ActivityService {
    /**
     * Log a new activity
     */
    async logActivity(activityData) {
        try {
            const activity = await Activity.create({
                organizationId: activityData.organizationId,
                leadId: activityData.leadId,
                type: activityData.type,
                title: activityData.title,
                description: activityData.description,
                performedBy: activityData.performedBy,
                performedByType: activityData.performedByType || 'system',
                metadata: activityData.metadata,
                relatedTaskId: activityData.relatedTaskId,
                relatedNoteId: activityData.relatedNoteId,
                isVisible: activityData.isVisible !== undefined ? activityData.isVisible : true
            });

            return activity;
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw error to prevent interrupting main flow
            return null;
        }
    }

    /**
     * Get activity timeline for a lead
     */
    async getLeadTimeline(organizationId, leadId, filters = {}) {
        try {
            const query = { organizationId, leadId, isVisible: true };

            if (filters.type) {
                query.type = filters.type;
            }

            if (filters.startDate) {
                query.createdAt = { $gte: new Date(filters.startDate) };
            }

            const activities = await Activity.find(query)
                .populate('performedBy', 'name email')
                .populate('relatedTaskId', 'title status priority')
                .sort({ createdAt: -1 })
                .lean();

            return activities;
        } catch (error) {
            console.error('Error getting lead timeline:', error);
            throw error;
        }
    }

    /**
     * Get recent activities for organization (Dashboard)
     */
    async getRecentActivities(organizationId, limit = 20) {
        try {
            const activities = await Activity.find({
                organizationId,
                isVisible: true
            })
                .populate('performedBy', 'name')
                .populate('leadId', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return activities;
        } catch (error) {
            console.error('Error getting recent activities:', error);
            throw error;
        }
    }

    /**
     * Get metrics/stats
     */
    async getActivityStats(organizationId, startDate, endDate) {
        try {
            const query = {
                organizationId,
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            const stats = await Activity.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]);

            return stats.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {});
        } catch (error) {
            console.error('Error getting activity stats:', error);
            throw error;
        }
    }
}

module.exports = new ActivityService();
