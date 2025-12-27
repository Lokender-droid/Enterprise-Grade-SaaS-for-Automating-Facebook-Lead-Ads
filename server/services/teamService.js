const Lead = require('../models/Lead');
const Admin = require('../models/Admin');
const Activity = require('../models/Activity');

class TeamService {
    /**
     * Assign lead to user
     */
    async assignLead(organizationId, leadId, userId, assignedBy) {
        try {
            const lead = await Lead.findOne({ _id: leadId, organizationId });
            if (!lead) throw new Error('Lead not found');

            const previousAssignee = lead.assignedTo;
            lead.assignedTo = userId;
            await lead.save();

            // Log activity
            await Activity.create({
                organizationId,
                leadId,
                type: 'assigned',
                title: 'Lead assigned',
                description: `Lead assigned to user`,
                performedBy: assignedBy,
                performedByType: 'user',
                metadata: {
                    previousAssignee,
                    newAssignee: userId
                }
            });

            // Send notification (placeholder function)
            // await this.sendNotification(userId, 'Lead Assigned', `You have been assigned to ${lead.name}`);

            return lead;
        } catch (error) {
            console.error('Error assigning lead:', error);
            throw error;
        }
    }

    /**
     * Get team performance metrics
     */
    async getTeamPerformance(organizationId, startDate, endDate) {
        try {
            // Simple aggregation example
            const performance = await Activity.aggregate([
                {
                    $match: {
                        organizationId: new mongoose.Types.ObjectId(organizationId),
                        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                {
                    $group: {
                        _id: '$performedBy',
                        calls: {
                            $sum: { $cond: [{ $eq: ['$type', 'voice_call'] }, 1, 0] }
                        },
                        tasksCompleted: {
                            $sum: { $cond: [{ $eq: ['$type', 'task_completed'] }, 1, 0] }
                        },
                        leadsConverted: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$type', 'stage_changed'] },
                                            { $eq: ['$metadata.to', 'won'] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            return performance;
        } catch (error) {
            console.error('Error getting team performance:', error);
            return [];
        }
    }

    /**
     * Auto-assign lead (Round Robin)
     */
    async autoAssignLead(organizationId, leadId) {
        try {
            // Get eligible users (e.g., sales role)
            // This is a simplified logic. In real implementation, check roles/availability.
            const users = await Admin.find({ organizationId }).sort({ lastAssignedAt: 1 }).limit(1);

            if (users.length > 0) {
                const assignee = users[0];
                await this.assignLead(organizationId, leadId, assignee._id, null); // System assignment

                // Update last assigned timestamp
                assignee.lastAssignedAt = new Date();
                await assignee.save();

                return assignee;
            }
            return null;
        } catch (error) {
            console.error('Error in auto-assignment:', error);
            // Don't throw, just fail silently or log
            return null;
        }
    }
}

module.exports = new TeamService();
