const DealStage = require('../models/DealStage');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const TaskService = require('./taskService');

class PipelineService {
    /**
     * Get all stages
     */
    async getStages(organizationId) {
        try {
            // Ensure default stages exist
            await this.ensureDefaultStages(organizationId);

            const stages = await DealStage.find({ organizationId, isActive: true })
                .sort({ displayOrder: 1 })
                .lean();

            return stages;
        } catch (error) {
            console.error('Error getting pipeline stages:', error);
            throw error;
        }
    }

    /**
     * Create default stages if none exist
     */
    async ensureDefaultStages(organizationId) {
        try {
            const count = await DealStage.countDocuments({ organizationId });
            if (count > 0) return;

            const defaults = [
                { name: 'New Lead', key: 'new', color: '#3B82F6', icon: 'UserPlus', displayOrder: 0, probability: 10, isDefault: true },
                { name: 'Contacted', key: 'contacted', color: '#F59E0B', icon: 'Phone', displayOrder: 1, probability: 30 },
                { name: 'Interested', key: 'interested', color: '#8B5CF6', icon: 'ThumbsUp', displayOrder: 2, probability: 50 },
                { name: 'Proposal', key: 'proposal', color: '#EC4899', icon: 'FileText', displayOrder: 3, probability: 75 },
                { name: 'Won', key: 'won', color: '#10B981', icon: 'CheckCircle', displayOrder: 4, probability: 100, stageType: 'won', isDefault: true },
                { name: 'Lost', key: 'lost', color: '#EF4444', icon: 'XCircle', displayOrder: 5, probability: 0, stageType: 'lost', isDefault: true }
            ];

            await DealStage.insertMany(defaults.map(s => ({ ...s, organizationId })));
        } catch (error) {
            console.error('Error creating default stages:', error);
        }
    }

    /**
     * Create custom stage
     */
    async createStage(stageData) {
        try {
            // Get max order
            const max = await DealStage.findOne({ organizationId: stageData.organizationId })
                .sort({ displayOrder: -1 });

            const displayOrder = stageData.displayOrder || (max ? max.displayOrder + 1 : 0);

            const stageKey = stageData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

            const stage = await DealStage.create({
                organizationId: stageData.organizationId,
                name: stageData.name,
                key: stageKey,
                color: stageData.color,
                displayOrder,
                probability: stageData.probability,
                autoActions: stageData.autoActions
            });

            return stage;
        } catch (error) {
            console.error('Error creating stage:', error);
            throw error;
        }
    }

    /**
     * Update stage
     */
    async updateStage(organizationId, stageId, updates) {
        try {
            const stage = await DealStage.findOne({ _id: stageId, organizationId });
            if (!stage) throw new Error('Stage not found');

            Object.assign(stage, updates);
            await stage.save();
            return stage;
        } catch (error) {
            console.error('Error updating stage:', error);
            throw error;
        }
    }

    /**
     * Move lead to stage
     */
    async moveLeadToStage(organizationId, leadId, stageKey, movedBy) {
        try {
            const lead = await Lead.findOne({ _id: leadId, organizationId });
            if (!lead) throw new Error('Lead not found');

            const stage = await DealStage.findOne({ organizationId, key: stageKey });
            if (!stage) throw new Error('Stage not found');

            const oldStage = lead.dealStage;

            // Update lead
            lead.dealStage = stageKey;
            lead.probability = stage.probability;

            if (stage.stageType === 'won') {
                lead.status = 'Converted';
                lead.dealValue = lead.dealValue || lead.predictedRevenue || 0;
            } else if (stage.stageType === 'lost') {
                lead.status = 'Lost';
            }

            await lead.save();

            // Log activity
            await Activity.create({
                organizationId,
                leadId,
                type: 'stage_changed',
                title: 'Deal stage updated',
                description: `Moved from ${oldStage} to ${stage.name}`,
                performedBy: movedBy,
                performedByType: 'user',
                metadata: { from: oldStage, to: stageKey }
            });

            // Trigger Auto-Actions
            await this.handleAutoActions(organizationId, lead, stage, movedBy);

            return lead;
        } catch (error) {
            console.error('Error moving lead stage:', error);
            throw error;
        }
    }

    /**
     * Handle Auto Actions
     */
    async handleAutoActions(organizationId, lead, stage, triggeredBy) {
        if (!stage.autoActions) return;

        const { createTask, assignTo } = stage.autoActions;

        // Auto Create Task
        if (createTask?.enabled) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (createTask.dueInDays || 1));

            await TaskService.createTask({
                organizationId,
                leadId: lead._id,
                title: createTask.taskTitle,
                type: createTask.taskType || 'other',
                priority: 'high',
                dueDate,
                assignedTo: lead.assignedTo || triggeredBy
            }, triggeredBy);
        }

        // Auto Assign
        if (assignTo?.enabled && assignTo.userId) {
            lead.assignedTo = assignTo.userId;
            await lead.save();
        }
    }

    /**
     * Reorder stages
     */
    async reorderStages(organizationId, stageOrders) {
        try {
            const updates = stageOrders.map(({ stageId, displayOrder }) => ({
                updateOne: {
                    filter: { _id: stageId, organizationId },
                    update: { $set: { displayOrder } }
                }
            }));
            await DealStage.bulkWrite(updates);
            return { success: true };
        } catch (error) {
            console.error('Error reordering stages:', error);
            throw error;
        }
    }
}

module.exports = new PipelineService();
